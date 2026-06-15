// @vitest-environment jsdom
// apps/web/src/components/delay-banner.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ConfigProvider } from 'antd'
import { DelayBanner } from './delay-banner.tsx'

afterEach(() => {
  cleanup()
})

function renderBanner(lastBatchAt: string | null) {
  render(
    <ConfigProvider>
      <DelayBanner lastBatchAt={lastBatchAt} />
    </ConfigProvider>,
  )
}

describe('DelayBanner', () => {
  // ── role="alert" ────────────────────────────────────────────────────────────

  it('renders an element with role="alert"', () => {
    renderBanner(null)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // ── No close button ─────────────────────────────────────────────────────────

  it('does not render a close button (closable={false})', () => {
    renderBanner(null)
    // AntD renders close button with aria-label="Close"
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  // ── No spinner or loading indicator ─────────────────────────────────────────

  it('does not render a spinner or loading indicator', () => {
    renderBanner('2026-06-15T10:00:00.000Z')
    // MUI/AntD spinners use role="img" with aria-label "loading" or "spinner", or
    // antd-specific class. Check neither is present.
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(document.querySelector('.ant-spin')).not.toBeInTheDocument()
  })

  // ── No-data message (null lastBatchAt) ──────────────────────────────────────

  it('shows the no-data Cyrillic message when lastBatchAt is null', () => {
    renderBanner(null)
    expect(screen.getByRole('alert')).toHaveTextContent(
      '⚠️ Сигналлар янгиланмаяпти — маълумот йўқ',
    )
  })

  // ── UTC+5 HH:MM formatting ──────────────────────────────────────────────────

  it('shows the timestamp prefix message with correct UTC+5 HH:MM when lastBatchAt is provided', () => {
    // 2026-06-15T10:30:00.000Z = 15:30 in UTC+5
    renderBanner('2026-06-15T10:30:00.000Z')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('⚠️ Сигналлар янгиланмаяпти — охирги янгиланиш 15:30')
  })

  it('pads single-digit hours and minutes to two digits in UTC+5', () => {
    // 2026-06-15T04:05:00.000Z = 09:05 in UTC+5
    renderBanner('2026-06-15T04:05:00.000Z')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('09:05')
  })

  it('correctly crosses midnight UTC+5 offset (23:30 UTC = 04:30 UTC+5 next day)', () => {
    // 2026-06-14T23:30:00.000Z = 04:30 in UTC+5 on 2026-06-15
    renderBanner('2026-06-14T23:30:00.000Z')
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('04:30')
  })

  // ── Warning type (amber, not error) ─────────────────────────────────────────

  it('renders with warning type class (not error)', () => {
    renderBanner(null)
    const alert = screen.getByRole('alert')
    // AntD applies ant-alert-warning class for type="warning"
    expect(alert.closest('.ant-alert-warning')).toBeInTheDocument()
    expect(alert.closest('.ant-alert-error')).not.toBeInTheDocument()
  })
})
