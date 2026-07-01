import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const OPS_QUERY_KEY = ['ops'] as const

export interface OpsBatchStatus {
  schedulerStatus: 'idle' | 'running'
  lastBatchAt: string | null
  lastBatchDuration: number | null
  queueDepth: number
  lastBatchResult: {
    filterMode: string
    messagesFetched: number
    signalsWritten: number
    ignoredCount: number
    preFilterDiscards: number
    keywordMatchedCount: number
    keywordSkippedCount: number
    keywordAiSignalCount: number
    keywordAiIgnoreCount: number
    noKeywordAiSignalCount: number
    noKeywordAiIgnoreCount: number
    errors: string | null
  } | null
  recentErrors: Array<{ message: string, occurredAt: string }>
}

export interface OpsStatus {
  isEnabled: boolean
  isForbidden: boolean
  data: OpsBatchStatus | null
}

async function fetchOpsStatus(): Promise<OpsStatus> {
  const res = await fetch('/api/ops/batch-status', {
    credentials: 'same-origin',
  })

  if (res.status === 404) {
    return { isEnabled: false, isForbidden: false, data: null }
  }

  if (res.status === 403) {
    return { isEnabled: true, isForbidden: true, data: null }
  }

  if (!res.ok) {
    throw new Error(`GET /api/ops/batch-status failed: ${res.status}`)
  }

  return {
    isEnabled: true,
    isForbidden: false,
    data: await res.json() as OpsBatchStatus,
  }
}

export function useOpsStatus() {
  return useQuery({
    queryKey: [...OPS_QUERY_KEY, 'status-probe'],
    queryFn: fetchOpsStatus,
    retry: false,
  })
}

// ── Story 6.2: Simulator hooks ────────────────────────────────────────────────

export interface OpsMahalla {
  id:   number
  name: string
}

export interface SimulateWebhookBody {
  mahallaId:           number
  senderDisplayName?:  string
  text:                string
  textSource?:         'text' | 'caption'
  simulatedTimestamp?: string
}

export interface SimulateWebhookResult {
  decision:       'queued' | 'structural_discard' | 'keyword_skip'
  reason?:        string
  filterMode:     string
  keywordMatched: boolean
  matchedPhrase:  string | null
}

export interface SimulateMessageBody {
  mahallaId:           number
  senderDisplayName?:  string
  senderUsername?:     string
  text:                string
  textSource?:         'text' | 'caption'
  simulatedTimestamp?: string
}

async function fetchMahallas(): Promise<OpsMahalla[]> {
  const res = await fetch('/api/ops/mahallas', { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/mahallas failed: ${res.status}`)
  return res.json() as Promise<OpsMahalla[]>
}

async function postSimulateWebhook(body: SimulateWebhookBody): Promise<SimulateWebhookResult> {
  const res = await fetch('/api/ops/simulate-webhook', {
    method:      'POST',
    credentials: 'same-origin',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `simulate-webhook failed: ${res.status}`)
  }
  return res.json() as Promise<SimulateWebhookResult>
}

async function postSimulateMessage(body: SimulateMessageBody): Promise<{ rawMessageId: number }> {
  const res = await fetch('/api/ops/simulate-message', {
    method:      'POST',
    credentials: 'same-origin',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `simulate-message failed: ${res.status}`)
  }
  return res.json() as Promise<{ rawMessageId: number }>
}

export function useMahallas() {
  return useQuery({
    queryKey: [...OPS_QUERY_KEY, 'mahallas'],
    queryFn:  fetchMahallas,
    retry:    false,
  })
}

export function useSimulateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postSimulateWebhook,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'pipeline-events'] }),
  })
}

export function useSimulateMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postSimulateMessage,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'raw-messages'] }),
  })
}

// ── Story 6.3: Pipeline Event Log + Batch Controls ────────────────────────────

export interface PipelineEvent {
  id:               number
  // Current values: 'prefilter_pass' | 'keyword_match' | 'keyword_skip'
  // Unknown future event types should render with fallback UI
  eventType:        string
  districtId:       number
  mahallaId:        number | null
  telegramUpdateId: number | null
  rawMessageId:     number | null
  signalId:         number | null
  detail:           unknown
  createdAt:        string  // ISO 8601 UTC
}

async function fetchPipelineEvents(): Promise<PipelineEvent[]> {
  const res = await fetch('/api/ops/pipeline-events?limit=100', { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/pipeline-events failed: ${res.status}`)
  return res.json() as Promise<PipelineEvent[]>
}

async function postTriggerBatch(): Promise<{ triggered: boolean } | { status: 'locked' }> {
  const res = await fetch('/api/ops/trigger-batch', {
    method:      'POST',
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`POST /api/ops/trigger-batch failed: ${res.status}`)
  return res.json() as Promise<{ triggered: boolean } | { status: 'locked' }>
}

async function fetchBatchStatus(): Promise<OpsBatchStatus> {
  const res = await fetch('/api/ops/batch-status', { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/batch-status failed: ${res.status}`)
  return res.json() as Promise<OpsBatchStatus>
}

export function usePipelineEvents(autoRefresh: boolean) {
  return useQuery({
    queryKey:        [...OPS_QUERY_KEY, 'pipeline-events'],
    queryFn:         fetchPipelineEvents,
    refetchInterval: autoRefresh ? 5000 : false,
  })
}

export function useTriggerBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postTriggerBatch,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY] }),
  })
}

export function useBatchStatus() {
  return useQuery({
    queryKey:        [...OPS_QUERY_KEY, 'batch-status'],
    queryFn:         fetchBatchStatus,
    refetchInterval: 5000,
  })
}

// ── Story 6.4: Keyword Registry CRUD ──────────────────────────────────────────

export interface OpsKeyword {
  id:        number
  phrase:    string
  isActive:  boolean
  createdAt: string  // ISO 8601 UTC
  updatedAt: string  // ISO 8601 UTC
}

async function fetchFilteringMode(): Promise<{ filterMode: string }> {
  const res = await fetch('/api/ops/filtering-mode', { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/filtering-mode failed: ${res.status}`)
  return res.json() as Promise<{ filterMode: string }>
}

async function fetchKeywords(): Promise<OpsKeyword[]> {
  const res = await fetch('/api/ops/keywords', { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/keywords failed: ${res.status}`)
  return res.json() as Promise<OpsKeyword[]>
}

async function postKeyword(phrase: string): Promise<OpsKeyword> {
  const res = await fetch('/api/ops/keywords', {
    method:      'POST',
    credentials: 'same-origin',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ phrase }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `POST /api/ops/keywords failed: ${res.status}`)
  }
  return res.json() as Promise<OpsKeyword>
}

async function patchKeyword(id: number, isActive: boolean): Promise<OpsKeyword> {
  const res = await fetch(`/api/ops/keywords/${id}`, {
    method:      'PATCH',
    credentials: 'same-origin',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ isActive }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `PATCH /api/ops/keywords/${id} failed: ${res.status}`)
  }
  return res.json() as Promise<OpsKeyword>
}

async function deleteKeyword(id: number): Promise<{ deleted: number }> {
  const res = await fetch(`/api/ops/keywords/${id}`, {
    method:      'DELETE',
    credentials: 'same-origin',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `DELETE /api/ops/keywords/${id} failed: ${res.status}`)
  }
  return res.json() as Promise<{ deleted: number }>
}

export function useFilteringMode() {
  return useQuery({
    queryKey: [...OPS_QUERY_KEY, 'filtering-mode'],
    queryFn:  fetchFilteringMode,
    staleTime: Infinity,  // filter mode doesn't change without server restart
  })
}

export function useKeywords() {
  return useQuery({
    queryKey: [...OPS_QUERY_KEY, 'keywords'],
    queryFn:  fetchKeywords,
  })
}

export function useAddKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postKeyword,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'keywords'] }),
  })
}

export function useToggleKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => patchKeyword(id, isActive),
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'keywords'] }),
  })
}

export function useDeleteKeyword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteKeyword,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'keywords'] }),
  })
}

// \u2500\u2500 Story 6.5: Signals Browser + System Health Dashboard \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// Re-declare Signal shape inline (mirrors apps/server/src/shared/types.ts Signal interface)
// to avoid a cross-package import from server into web.
export interface OpsSignal {
  id:                 number
  telegramUpdateId:   number
  telegramMessageId:  number
  telegramMessageUrl: string | null
  districtId:         number
  mahallaId:          number
  mahallaName:        string
  senderDisplayName:  string | null
  senderUsername:     string | null
  telegramTimestamp:  string    // ISO 8601 UTC
  rawText:            string
  textSource:         'text' | 'caption'
  category:           'water' | 'electricity' | 'gas' | 'waste'
  hokimRelated:       boolean
  keywordMatched:     boolean
  matchedKeyword:     string | null
  shortLabel:         string | null
  classifiedAt:       string    // ISO 8601 UTC
}

export interface RawMessageRow {
  id:               number
  mahallaId:        number
  mahallaName:      string
  text:             string
  textSource:       'text' | 'caption'
  telegramTimestamp: string  // ISO 8601 UTC
  isSimulated:      boolean
}

export interface OpsSystemHealth {
  database:        { status: 'ok' | 'error'; latencyMs: number | null }
  scheduler:       { status: 'running' | 'stopped'; nextRunInSeconds: number | null }
  aiApi:           { status: 'ok' | 'error' | 'unknown'; lastCheckedAt: string | null }
  bot:             { status: 'ok' | 'error' }
  botConnectivity: Array<{
    mahallaId:    number
    mahallaName:  string
    botStatus:    'active' | 'removed' | 'unknown'
    botLastSeenAt: string | null
  }>
}

export interface OpsSignalsFilters {
  category?:    'water' | 'electricity' | 'gas' | 'waste' | ''
  mahallaId?:   number | null
  hokimRelated?: boolean | null
}

async function fetchOpsSignals(
  filters: OpsSignalsFilters = {},
  page = 1,
  limit = 50,
): Promise<{ items: OpsSignal[]; total: number }> {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.mahallaId != null) params.set('mahalla_id', String(filters.mahallaId))
  if (filters.hokimRelated != null) params.set('hokim_related', String(filters.hokimRelated))
  params.set('page', String(page))
  params.set('limit', String(limit))
  const res = await fetch(`/api/ops/signals?${params.toString()}`, { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/signals failed: ${res.status}`)
  return res.json() as Promise<{ items: OpsSignal[]; total: number }>
}

async function fetchRawMessages(page = 1, limit = 50): Promise<{ items: RawMessageRow[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const res = await fetch(`/api/ops/raw-messages?${params.toString()}`, { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/raw-messages failed: ${res.status}`)
  return res.json() as Promise<{ items: RawMessageRow[]; total: number }>
}

async function fetchSystemHealth(): Promise<OpsSystemHealth> {
  const res = await fetch('/api/ops/system-health', { credentials: 'same-origin' })
  if (!res.ok) throw new Error(`GET /api/ops/system-health failed: ${res.status}`)
  return res.json() as Promise<OpsSystemHealth>
}

async function deleteSimulatedSignals(): Promise<{ deleted: number }> {
  const res = await fetch('/api/ops/signals/simulated', { method: 'DELETE', credentials: 'same-origin' })
  if (!res.ok) throw new Error(`DELETE /api/ops/signals/simulated failed: ${res.status}`)
  return res.json() as Promise<{ deleted: number }>
}

async function deleteAllSignals(): Promise<{ deleted: number }> {
  const res = await fetch('/api/ops/signals?confirm=DELETE_ALL_SIGNALS', { method: 'DELETE', credentials: 'same-origin' })
  if (!res.ok) throw new Error(`DELETE /api/ops/signals failed: ${res.status}`)
  return res.json() as Promise<{ deleted: number }>
}

async function deleteSimulatedRawMessages(): Promise<{ deleted: number }> {
  const res = await fetch('/api/ops/raw-messages/simulated', { method: 'DELETE', credentials: 'same-origin' })
  if (!res.ok) throw new Error(`DELETE /api/ops/raw-messages/simulated failed: ${res.status}`)
  return res.json() as Promise<{ deleted: number }>
}

async function deleteAllRawMessages(): Promise<{ deleted: number }> {
  const res = await fetch('/api/ops/raw-messages?confirm=DELETE_ALL_RAW', { method: 'DELETE', credentials: 'same-origin' })
  if (!res.ok) throw new Error(`DELETE /api/ops/raw-messages failed: ${res.status}`)
  return res.json() as Promise<{ deleted: number }>
}

export function useOpsSignals(filters: OpsSignalsFilters = {}, page = 1) {
  return useQuery({
    queryKey: [...OPS_QUERY_KEY, 'signals', filters, page],
    queryFn:  () => fetchOpsSignals(filters, page),
  })
}

export function useRawMessages(page = 1) {
  return useQuery({
    queryKey: [...OPS_QUERY_KEY, 'raw-messages', page],
    queryFn:  () => fetchRawMessages(page),
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey:        [...OPS_QUERY_KEY, 'system-health'],
    queryFn:         fetchSystemHealth,
    refetchInterval: 10000,  // 10 seconds \u2014 matches AC-6 requirement
  })
}

export function useDeleteSimulatedSignals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSimulatedSignals,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'signals'] }),
  })
}

export function useDeleteAllSignals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAllSignals,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'signals'] }),
  })
}

export function useDeleteSimulatedRawMessages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSimulatedRawMessages,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'raw-messages'] }),
  })
}

export function useDeleteAllRawMessages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAllRawMessages,
    onSuccess:  () => qc.invalidateQueries({ queryKey: [...OPS_QUERY_KEY, 'raw-messages'] }),
  })
}
