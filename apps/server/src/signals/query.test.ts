// apps/server/src/signals/query.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mock env before any module import ───────────────────────────────────────
const mockEnv = vi.hoisted(() => ({
  DATABASE_URL:            'postgresql://test:test@localhost:5432/test',
  NODE_ENV:                'test' as const,
  PORT:                    3001,
  BOT_TOKEN:               'test-token',
  TELEGRAM_WEBHOOK_SECRET: 'test-secret',
  FILTER_MODE:             'keyword_gate' as const,
  AI_API_KEY:              'test-key',
  AI_MODEL:                'gemini-2.5-flash',
  SESSION_SECRET:          'test-session-secret',
}))

vi.mock('../shared/env.js', () => ({ env: mockEnv }))

// ─── Mock prisma — do not hit a real database ─────────────────────────────────
const mockFindMany  = vi.hoisted(() => vi.fn())
const mockFindFirst = vi.hoisted(() => vi.fn())

vi.mock('../shared/db.js', () => ({
  prisma: {
    signalMessage: {
      findMany:  mockFindMany,
      findFirst: mockFindFirst,
    },
  },
}))

import { getTodayUTC5Range, querySignals, querySignalById, queryContextSignals } from './query.js'

// ─── getTodayUTC5Range ────────────────────────────────────────────────────────

describe('getTodayUTC5Range', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns UTC+5 same-day range (morning UTC, still same UTC+5 day)', () => {
    // UTC 10:30 → UTC+5 15:30 on 2026-06-14 (same day)
    // UTC+5 midnight for 2026-06-14 = 2026-06-13T19:00:00.000Z
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-14T10:30:00.000Z'))

    const { from, to } = getTodayUTC5Range()

    expect(from.toISOString()).toBe('2026-06-13T19:00:00.000Z')
    expect(to.toISOString()).toBe('2026-06-14T10:30:00.000Z')
  })

  it('returns UTC+5 rollover boundary (late UTC, next UTC+5 day)', () => {
    // UTC 19:30 → UTC+5 00:30 on 2026-06-15 (next UTC+5 day)
    // UTC+5 midnight for 2026-06-15 = 2026-06-14T19:00:00.000Z
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-14T19:30:00.000Z'))

    const { from, to } = getTodayUTC5Range()

    expect(from.toISOString()).toBe('2026-06-14T19:00:00.000Z')
    expect(to.toISOString()).toBe('2026-06-14T19:30:00.000Z')
  })

  it('returns "to" equal to the mocked "now"', () => {
    vi.useFakeTimers()
    const now = new Date('2026-06-14T12:00:00.000Z')
    vi.setSystemTime(now)

    const { to } = getTodayUTC5Range()
    expect(to.toISOString()).toBe(now.toISOString())
  })
})

// ─── querySignals ─────────────────────────────────────────────────────────────

describe('querySignals', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('calls prisma.signalMessage.findMany with correct where, include, and orderBy', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const from = new Date('2026-06-13T19:00:00.000Z')
    const to   = new Date('2026-06-14T10:30:00.000Z')

    await querySignals(42, from, to)

    expect(mockFindMany).toHaveBeenCalledOnce()
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        district_id: 42,
        telegram_timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: [
        { telegram_timestamp: 'desc' },
        { id: 'desc' },
      ],
      include: {
        mahalla: {
          select: {
            name: true,
            telegram_chat_id: true,
          },
        },
      },
    })
  })

  it('passes district_id from the districtId argument, not from anywhere else', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const from = new Date('2026-06-13T19:00:00.000Z')
    const to   = new Date('2026-06-14T10:30:00.000Z')

    await querySignals(99, from, to)

    const call = mockFindMany.mock.calls[0]?.[0] as { where: { district_id: number } }
    expect(call.where.district_id).toBe(99)
  })

  it('returns the results from prisma.signalMessage.findMany', async () => {
    const mockRows = [{ id: 1 }, { id: 2 }]
    mockFindMany.mockResolvedValueOnce(mockRows)

    const result = await querySignals(1, new Date(), new Date())
    expect(result).toStrictEqual(mockRows)
  })
})

// ─── querySignalById ──────────────────────────────────────────────────────────

const MAHALLA_INCLUDE = {
  mahalla: {
    select: {
      name: true,
      telegram_chat_id: true,
    },
  },
}

describe('querySignalById', () => {
  beforeEach(() => {
    mockFindFirst.mockReset()
  })

  it('calls prisma.signalMessage.findFirst with id and district_id in where clause', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    await querySignalById(42, 7)

    expect(mockFindFirst).toHaveBeenCalledOnce()
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 42, district_id: 7 },
      include: MAHALLA_INCLUDE,
    })
  })

  it('returns null when findFirst returns null (not found or different district)', async () => {
    mockFindFirst.mockResolvedValueOnce(null)

    const result = await querySignalById(99, 7)
    expect(result).toBeNull()
  })

  it('returns the row when findFirst finds a matching signal', async () => {
    const mockRow = { id: 42, district_id: 7, category: 'gas', mahalla_id: 5, mahalla: { name: 'Test', telegram_chat_id: '-100' } }
    mockFindFirst.mockResolvedValueOnce(mockRow)

    const result = await querySignalById(42, 7)
    expect(result).toStrictEqual(mockRow)
  })

  it('uses district_id from argument — cross-district signal returns null', async () => {
    // Signal 42 belongs to district 3, not district 7 — DB returns null
    mockFindFirst.mockResolvedValueOnce(null)

    const result = await querySignalById(42, 7)
    expect(result).toBeNull()
    // Verify district scope is in the where clause
    const call = mockFindFirst.mock.calls[0]?.[0] as { where: { id: number; district_id: number } }
    expect(call.where.district_id).toBe(7)
  })
})

// ─── queryContextSignals ──────────────────────────────────────────────────────

describe('queryContextSignals', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  const from = new Date('2026-06-13T19:00:00.000Z')
  const to   = new Date('2026-06-14T18:59:59.000Z')

  it('calls findMany with district_id, mahalla_id, category, and date range', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await queryContextSignals(7, 5, 'gas', from, to)

    expect(mockFindMany).toHaveBeenCalledOnce()
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        district_id: 7,
        mahalla_id:  5,
        category:    'gas',
        telegram_timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: [
        { telegram_timestamp: 'asc' },
        { id: 'asc' },
      ],
      include: MAHALLA_INCLUDE,
    })
  })

  it('uses ascending orderBy (oldest first) — differs from querySignals desc order', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await queryContextSignals(7, 5, 'water', from, to)

    const call = mockFindMany.mock.calls[0]?.[0] as { orderBy: Array<Record<string, string>> }
    expect(call.orderBy[0]).toEqual({ telegram_timestamp: 'asc' })
    expect(call.orderBy[1]).toEqual({ id: 'asc' })
  })

  it('includes mahalla with name and telegram_chat_id select', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await queryContextSignals(7, 5, 'electricity', from, to)

    const call = mockFindMany.mock.calls[0]?.[0] as { include: typeof MAHALLA_INCLUDE }
    expect(call.include).toEqual(MAHALLA_INCLUDE)
  })

  it('returns results from findMany unchanged', async () => {
    const mockRows = [{ id: 1 }, { id: 2 }]
    mockFindMany.mockResolvedValueOnce(mockRows)

    const result = await queryContextSignals(7, 5, 'gas', from, to)
    expect(result).toStrictEqual(mockRows)
  })
})
