// @vitest-environment jsdom
// apps/web/src/components/ops/health-panel.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// AntD requires window.matchMedia — polyfill for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value:    (query: string) => ({
    matches:             false,
    media:               query,
    onchange:            null,
    addListener:         vi.fn(),
    removeListener:      vi.fn(),
    addEventListener:    vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent:       vi.fn(),
  }),
})

// AntD rc-resize-observer needs ResizeObserver — polyfill for jsdom
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}

// ─── Mock the ops API hooks ────────────────────────────────────────────────────

const mockUseSystemHealth = vi.fn()
const mockUseBatchStatus  = vi.fn()

vi.mock('../../api/ops.ts', () => ({
  useSystemHealth: () => mockUseSystemHealth(),
  useBatchStatus:  () => mockUseBatchStatus(),
}))

import { HealthPanel } from './health-panel.tsx'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderPanel() {
  const qc = makeQC()
  return render(
    <QueryClientProvider client={qc}>
      <HealthPanel />
    </QueryClientProvider>
  )
}

const HEALTH_DATA = {
  database:  { status: 'ok' as const, latencyMs: 5 },
  scheduler: { status: 'running' as const, nextRunInSeconds: null },
  aiApi:     { status: 'unknown' as const, lastCheckedAt: null },
  bot:       { status: 'ok' as const },
  botConnectivity: [
    { mahallaId: 1, mahallaName: 'Навбаҳор маҳалласи', botStatus: 'active' as const, botLastSeenAt: '2026-06-22T10:00:00.000Z' },
  ],
}

const BATCH_DATA = {
  schedulerStatus:  'idle' as const,
  lastBatchAt:      '2026-06-22T10:00:00.000Z',
  lastBatchDuration: 200,
  queueDepth:       3,
  lastBatchResult: {
    filterMode:               'keyword_gate',
    messagesFetched:          10,
    signalsWritten:           4,
    ignoredCount:             6,
    preFilterDiscards:        2,
    keywordMatchedCount:      8,
    keywordSkippedCount:      2,
    keywordAiSignalCount:     4,
    keywordAiIgnoreCount:     4,
    noKeywordAiSignalCount:   0,
    noKeywordAiIgnoreCount:   0,
    errors:                   null,
  },
  recentErrors: [],
}

function setupDefaultMocks() {
  mockUseSystemHealth.mockReturnValue({ data: undefined, isLoading: false, isError: false })
  mockUseBatchStatus.mockReturnValue({ data: undefined, isLoading: false, isError: false })
}

beforeEach(() => {
  setupDefaultMocks()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ─── Infrastructure Health Section ───────────────────────────────────────────

describe('HealthPanel — InfrastructureHealthSection', () => {
  it('renders Infrastructure Health section title', () => {
    renderPanel()
    expect(screen.getByText('Infrastructure Health')).toBeInTheDocument()
  })

  it('renders loading spinner while health data is loading', () => {
    mockUseSystemHealth.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderPanel()
    const spinners = document.querySelectorAll('.ant-spin')
    expect(spinners.length).toBeGreaterThan(0)
  })

  it('renders error alert when system health fetch fails', () => {
    mockUseSystemHealth.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPanel()
    expect(screen.getByText('Failed to load system health')).toBeInTheDocument()
  })

  it('renders Database, Scheduler, AI API, Bot labels when data is available', () => {
    mockUseSystemHealth.mockReturnValue({ data: HEALTH_DATA, isLoading: false, isError: false })
    renderPanel()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Scheduler')).toBeInTheDocument()
    expect(screen.getByText('AI API')).toBeInTheDocument()
    expect(screen.getByText('Bot')).toBeInTheDocument()
  })

  it('renders scheduler next-run placeholder when unavailable', () => {
    mockUseSystemHealth.mockReturnValue({ data: HEALTH_DATA, isLoading: false, isError: false })
    renderPanel()
    expect(screen.getByText('running (next run: not available)')).toBeInTheDocument()
  })

  it('renders bot connectivity table title when data available', () => {
    mockUseSystemHealth.mockReturnValue({ data: HEALTH_DATA, isLoading: false, isError: false })
    renderPanel()
    expect(screen.getByText('Bot Connectivity per Group')).toBeInTheDocument()
  })

  it('renders mahalla row in bot connectivity table', () => {
    mockUseSystemHealth.mockReturnValue({ data: HEALTH_DATA, isLoading: false, isError: false })
    renderPanel()
    expect(screen.getByText('Навбаҳор маҳалласи')).toBeInTheDocument()
  })
})

// ─── Pipeline Diagnostics Section ────────────────────────────────────────────

describe('HealthPanel — PipelineDiagnosticsSection', () => {
  it('renders Pipeline Diagnostics section title', () => {
    renderPanel()
    expect(screen.getByText('Pipeline Diagnostics')).toBeInTheDocument()
  })

  it('renders loading spinner while batch status is loading', () => {
    mockUseBatchStatus.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderPanel()
    const spinners = document.querySelectorAll('.ant-spin')
    expect(spinners.length).toBeGreaterThan(0)
  })

  it('renders error alert when batch status fetch fails', () => {
    mockUseBatchStatus.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderPanel()
    expect(screen.getByText('Failed to load batch status')).toBeInTheDocument()
  })

  it('renders pipeline diagnostics labels when batch data available', () => {
    mockUseBatchStatus.mockReturnValue({ data: BATCH_DATA, isLoading: false, isError: false })
    renderPanel()
    expect(screen.getByText('Filter Mode')).toBeInTheDocument()
    expect(screen.getByText('Queue Depth')).toBeInTheDocument()
    expect(screen.getByText('Last Batch At')).toBeInTheDocument()
    expect(screen.getByText('Pre-filter Discards')).toBeInTheDocument()
    expect(screen.getByText('Keyword Skipped')).toBeInTheDocument()
    expect(screen.getByText('Signals Written')).toBeInTheDocument()
  })

  it('renders queue depth value from batch data', () => {
    mockUseBatchStatus.mockReturnValue({ data: BATCH_DATA, isLoading: false, isError: false })
    renderPanel()
    expect(screen.getByText('3')).toBeInTheDocument()  // queueDepth
  })

  it('renders Never when lastBatchAt is null', () => {
    mockUseBatchStatus.mockReturnValue({
      data: { ...BATCH_DATA, lastBatchAt: null },
      isLoading: false,
      isError: false,
    })
    renderPanel()
    expect(screen.getByText('Never')).toBeInTheDocument()
  })
})
