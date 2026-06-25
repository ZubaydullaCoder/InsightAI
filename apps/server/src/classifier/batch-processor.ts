import { Prisma, type RawMessage } from '../generated/prisma/client.js'
import { prisma } from '../shared/db.js'
import { env } from '../shared/env.js'
import { logger } from '../shared/logger.js'
import { classifyMessage } from './ai-client.js'
import type { ClassifierOutput } from './schema.js'

type BatchStatus = 'ok' | 'failed'

export type BatchResult = {
  status: BatchStatus
  messages_fetched: number
  signals_written: number
  ignored_count: number
  error_message: string | null
}

type IntakeMetrics = {
  pre_filter_discards: number
  keyword_matched_count: number
  keyword_skipped_count: number
  keyword_ai_signal_count: number
  keyword_ai_ignore_count: number
  no_keyword_ai_signal_count: number
  no_keyword_ai_ignore_count: number
}

type PipelineEventCountRow = {
  event_type: string
  count: bigint
}

type ClassifyBatchOptions = {
  sleep?: (ms: number) => Promise<void>
}

type PersistSignalsResult = {
  signalsWritten: number
  lastSignalId: number | null
}

const zeroIntakeMetrics: IntakeMetrics = {
  pre_filter_discards:        0,
  keyword_matched_count:      0,
  keyword_skipped_count:      0,
  keyword_ai_signal_count:    0,
  keyword_ai_ignore_count:    0,
  no_keyword_ai_signal_count: 0,
  no_keyword_ai_ignore_count: 0,
}

export async function classifyMessageWithRetry(
  text: string,
  maxAttempts = 3,
  sleepFn: (ms: number) => Promise<void> = sleep,
): Promise<ClassifierOutput> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await classifyMessage(text)
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        logger.warn({ attempt, err }, 'AI classification attempt failed; retrying')
        await sleepFn(100 * 2 ** (attempt - 1))
      }
    }
  }

  throw lastError
}

export async function classifyBatch(
  districtId: number,
  options: ClassifyBatchOptions = {},
): Promise<BatchResult> {
  const startedAt = new Date()
  const sleepFn = options.sleep ?? sleep
  let messagesFetched = 0
  let signalsWritten = 0
  let ignoredCount = 0
  let intakeWindowFrom: Date | null = null
  const intakeWindowTo = startedAt
  let intakeMetrics = zeroIntakeMetrics

  logger.info({ districtId }, 'Classify batch started')

  try {
    const previousBatch = await prisma.batchHealth.findFirst({
      where:   { district_id: districtId, completed_at: { not: null } },
      orderBy: { started_at: 'desc' },
    })

    intakeWindowFrom = previousBatch?.started_at ?? null
    intakeMetrics = await aggregateIntakeMetrics({
      districtId,
      from: intakeWindowFrom ?? new Date(0),
      to:   intakeWindowTo,
    })

    const rawMessages = await prisma.rawMessage.findMany({
      where:   { district_id: districtId },
      orderBy: { id: 'asc' },
    })

    messagesFetched = rawMessages.length
    const failedRawMessageIds: number[] = []

    for (const rawMessage of rawMessages) {
      try {
        const aiResult = await classifyMessageWithRetry(rawMessage.text, 3, sleepFn)

        if (aiResult.decision === 'signal') {
          const persistResult = await persistSignals(rawMessage, aiResult, aiResult.categories)
          signalsWritten += persistResult.signalsWritten

          await writeClassifierEvent({
            eventType: 'classifier_signal',
            rawMessage,
            signalId:  persistResult.lastSignalId,
            detail:    {
              decision:      'signal',
              categories:    aiResult.categories,
              hokimRelated:  aiResult.hokim_related ?? false,
              shortLabel:    aiResult.short_label ?? null,
            },
          })
        } else {
          await prisma.rawMessage.delete({ where: { id: rawMessage.id } })
          ignoredCount += 1
          await writeClassifierEvent({
            eventType: 'classifier_ignore',
            rawMessage,
            signalId:  null,
            detail:    { decision: 'ignore' },
          })
        }
      } catch (err) {
        failedRawMessageIds.push(rawMessage.id)
        await writeClassifierEvent({
          eventType: 'classifier_error',
          rawMessage,
          signalId:  null,
          detail:    {
            decision: 'error',
            error:    getErrorMessage(err),
          },
        })
        logger.error(
          { districtId, rawMessageId: rawMessage.id, attempts: 3, err },
          'AI classification failed after max retries; message stays in raw_messages',
        )
      }
    }

    const status: BatchStatus = failedRawMessageIds.length === 0 ? 'ok' : 'failed'
    const errorMessage = failedRawMessageIds.length === 0
      ? null
      : `${failedRawMessageIds.length} message(s) failed after retries; raw message IDs: ${failedRawMessageIds.join(', ')}`

    await writeBatchHealth({
      districtId,
      status,
      startedAt,
      completedAt: new Date(),
      intakeWindowFrom,
      intakeWindowTo,
      messagesFetched,
      signalsWritten,
      ignoredCount,
      intakeMetrics,
      errorMessage,
    })

    logger.info(
      { districtId, status, messagesFetched, signalsWritten, ignoredCount },
      'Classify batch complete',
    )

    return {
      status,
      messages_fetched: messagesFetched,
      signals_written:  signalsWritten,
      ignored_count:    ignoredCount,
      error_message:    errorMessage,
    }
  } catch (err) {
    const errorMessage = getErrorMessage(err)

    logger.error({ districtId, err }, 'Classify batch failed')

    // P-1: writeBatchHealth may itself throw when the DB is down (the same
    // condition that caused the outer error). Wrap it to prevent a secondary
    // unhandled rejection from shadowing the original failure.
    try {
      await writeBatchHealth({
        districtId,
        status: 'failed',
        startedAt,
        completedAt: new Date(),
        intakeWindowFrom,
        intakeWindowTo,
        messagesFetched,
        signalsWritten,
        ignoredCount,
        intakeMetrics,
        errorMessage,
      })
    } catch (healthErr) {
      logger.error(
        { districtId, healthErr },
        'writeBatchHealth also failed in error path — batch health record not written',
      )
    }

    return {
      status:           'failed',
      messages_fetched: messagesFetched,
      signals_written:  signalsWritten,
      ignored_count:    ignoredCount,
      error_message:    errorMessage,
    }
  }
}

export async function aggregateIntakeMetrics(params: {
  districtId: number
  from: Date
  to: Date
}): Promise<IntakeMetrics> {
  const rows = await prisma.$queryRaw<Array<PipelineEventCountRow>>`
    SELECT event_type, COUNT(DISTINCT telegram_update_id) AS count
    FROM pipeline_events
    WHERE district_id = ${params.districtId}
      AND created_at >= ${params.from}
      AND created_at < ${params.to}
    GROUP BY event_type
  `

  const countByType = Object.fromEntries(
    rows.map((row) => [row.event_type, Number(row.count)]),
  )

  return {
    // Stage 1 pre-filter discards are not persisted to pipeline_events yet.
    pre_filter_discards:        0,
    keyword_matched_count:      countByType.keyword_match ?? 0,
    keyword_skipped_count:      countByType.keyword_skip ?? 0,
    // These require joining classifier outcomes to keyword events; reserved for a later story.
    keyword_ai_signal_count:    0,
    keyword_ai_ignore_count:    0,
    no_keyword_ai_signal_count: 0,
    no_keyword_ai_ignore_count: 0,
  }
}

async function persistSignals(
  rawMessage: RawMessage,
  aiResult: Extract<ClassifierOutput, { decision: 'signal' }>,
  categories: string[],
): Promise<PersistSignalsResult> {
  const baseSignalRow = {
    telegram_update_id:  rawMessage.telegram_update_id,
    telegram_message_id: rawMessage.telegram_message_id,
    district_id:         rawMessage.district_id,
    mahalla_id:          rawMessage.mahalla_id,
    sender_display_name: rawMessage.sender_display_name,
    sender_username:     rawMessage.sender_username,
    telegram_timestamp:  rawMessage.telegram_timestamp,
    raw_text:            rawMessage.text,
    text_source:         rawMessage.text_source,
    hokim_related:       aiResult.hokim_related ?? false,
    keyword_matched:     false,
    matched_keyword:     null,
    short_label:         aiResult.short_label ?? null,
    classified_at:       new Date(),
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch pre-existing signals for these categories to prevent unique constraint violation
      const existingSignals = await tx.signalMessage.findMany({
        where: {
          telegram_update_id: rawMessage.telegram_update_id,
          category: { in: categories },
        },
        select: { category: true, id: true },
      })

      const existingCategories = new Set(existingSignals.map((s) => s.category))
      let lastSignalId: number | null = existingSignals.length > 0 ? existingSignals[existingSignals.length - 1].id : null
      let signalsWritten = 0

      // 2. Create signals for categories that do not exist yet
      for (const category of categories) {
        if (!existingCategories.has(category)) {
          const created = await tx.signalMessage.create({
            data: {
              ...baseSignalRow,
              category,
            },
          })
          lastSignalId = created.id
          signalsWritten += 1
        }
      }

      // 3. Delete the raw message
      try {
        await tx.rawMessage.delete({ where: { id: rawMessage.id } })
      } catch (err) {
        if (!isPrismaRecordNotFoundError(err)) {
          throw err
        }
        logger.info(
          { rawMessageId: rawMessage.id },
          'Raw message already deleted by concurrent process — idempotent',
        )
      }

      return { signalsWritten, lastSignalId }
    })
  } catch (err) {
    if (isPrismaUniqueConstraintError(err)) {
      logger.info(
        { rawMessageId: rawMessage.id, updateId: rawMessage.telegram_update_id },
        'Signal already exists for categories; deleting raw_message only',
      )
      try {
        await prisma.rawMessage.delete({ where: { id: rawMessage.id } })
      } catch (deleteErr) {
        if (!isPrismaRecordNotFoundError(deleteErr)) {
          throw deleteErr
        }
      }
      return { signalsWritten: 0, lastSignalId: null }
    }
    throw err
  }
}

async function writeClassifierEvent(params: {
  eventType: 'classifier_signal' | 'classifier_ignore' | 'classifier_error'
  rawMessage: RawMessage
  signalId: number | null
  detail: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.pipelineEvent.create({
      data: {
        event_type:         params.eventType,
        district_id:        params.rawMessage.district_id,
        mahalla_id:         params.rawMessage.mahalla_id,
        telegram_update_id: params.rawMessage.telegram_update_id,
        raw_message_id:     params.rawMessage.id,
        signal_id:          params.signalId,
        detail: {
          telegramUpdateId:  params.rawMessage.telegram_update_id,
          telegramMessageId: params.rawMessage.telegram_message_id,
          rawMessageId:      params.rawMessage.id,
          signalId:          params.signalId,
          mahallaId:         params.rawMessage.mahalla_id,
          textSource:        params.rawMessage.text_source,
          textSnippet:       params.rawMessage.text.slice(0, 160),
          ...params.detail,
        },
      },
    })
  } catch (err) {
    logger.error(
      { rawMessageId: params.rawMessage.id, eventType: params.eventType, err },
      'classifier pipelineEvent.create failed',
    )
  }
}

async function writeBatchHealth(params: {
  districtId: number
  status: BatchStatus
  startedAt: Date
  completedAt: Date
  intakeWindowFrom: Date | null
  intakeWindowTo: Date
  messagesFetched: number
  signalsWritten: number
  ignoredCount: number
  intakeMetrics: IntakeMetrics
  errorMessage: string | null
}): Promise<void> {
  await prisma.batchHealth.create({
    data: {
      district_id:                params.districtId,
      status:                     params.status,
      started_at:                 params.startedAt,
      completed_at:               params.completedAt,
      intake_window_from:         params.intakeWindowFrom,
      intake_window_to:           params.intakeWindowTo,
      messages_fetched:           params.messagesFetched,
      signals_written:            params.signalsWritten,
      ignored_count:              params.ignoredCount,
      pre_filter_discards:        params.intakeMetrics.pre_filter_discards,
      filter_mode:                env.FILTER_MODE,
      keyword_matched_count:      params.intakeMetrics.keyword_matched_count,
      keyword_skipped_count:      params.intakeMetrics.keyword_skipped_count,
      keyword_ai_signal_count:    params.intakeMetrics.keyword_ai_signal_count,
      keyword_ai_ignore_count:    params.intakeMetrics.keyword_ai_ignore_count,
      no_keyword_ai_signal_count: params.intakeMetrics.no_keyword_ai_signal_count,
      no_keyword_ai_ignore_count: params.intakeMetrics.no_keyword_ai_ignore_count,
      error_message:              params.errorMessage,
    },
  })
}

function isPrismaUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.constructor.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientKnownRequestError') &&
    (err as any).code === 'P2002'
  )
}

function isPrismaRecordNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.constructor.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientKnownRequestError') &&
    (err as any).code === 'P2025'
  )
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown batch failure'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
