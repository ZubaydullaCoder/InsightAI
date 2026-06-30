// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { OpsPage } from './ops-page.tsx'

// AntD Form/Grid uses window.matchMedia — polyfill required in jsdom
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

// AntD rc-resize-observer needs ResizeObserver — polyfill required in jsdom
global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.title = ''
})

function mockFetch(responses: Record<string, { status: number; body: unknown }>) {
  vi.spyOn(window, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : (input as Request).url
    const match = Object.entries(responses).find(([key]) => url.includes(key))
    const { status, body } = match?.[1] ?? { status: 404, body: { error: 'Not found' } }
    return Promise.resolve({
      ok:   status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response)
  })
}

describe('OpsPage', () => {
  it('renders the ops shell with navigation and active panel when enabled', async () => {
    mockFetch({
      'batch-status': {
        status: 200,
        body:   { schedulerStatus: 'idle', lastBatchAt: null, lastBatchDuration: null, queueDepth: 0, lastBatchResult: null, recentErrors: [] },
      },
      'mahallas': { status: 200, body: [] },
    })

    render(<OpsPage />)

    expect(await screen.findByText('MAHALLA OVOZI — DEVELOPER OPS CONSOLE [Phase 1]')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Simulator' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Pipeline Log' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Keyword Registry' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Signals Browser' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Health' })).toBeInTheDocument()
    // SimulatorPanel is now implemented — check for the mode toggle instead of placeholder
    expect(await screen.findByText(/Webhook Simulation/)).toBeInTheDocument()
    expect(document.title).toBe('Ops Console – Mahalla Ovozi [Phase 1] — Simulator')

    await userEvent.click(screen.getByRole('menuitem', { name: 'Health' }))

    expect(screen.getByText('Health panel — coming in a later story')).toBeInTheDocument()
    expect(document.title).toBe('Ops Console – Mahalla Ovozi [Phase 1] — Health')
  })

  it('shows the disabled banner and hides panels when the ops API returns 404', async () => {
    mockFetch({ 'batch-status': { status: 404, body: { error: 'Not found' } } })

    render(<OpsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ops Console is disabled. Set OPS_ENABLED=true in .env and restart the server.',
    )

    await waitFor(() => {
      expect(screen.queryByText(/Webhook Simulation/)).not.toBeInTheDocument()
    })
  })
})
