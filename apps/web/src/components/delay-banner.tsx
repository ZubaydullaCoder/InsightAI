// apps/web/src/components/delay-banner.tsx
import { Alert } from 'antd'
import { strings } from '../strings.ts'

interface DelayBannerProps {
  lastBatchAt: string | null
}

function formatLastBatchAt(isoString: string): string {
  // UTC+5: shift by 5 hours then read as UTC — same pattern as formatTimestamp in signal-card.tsx
  const utc5 = new Date(new Date(isoString).getTime() + 5 * 3600000)
  const hh = String(utc5.getUTCHours()).padStart(2, '0')
  const mm = String(utc5.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function DelayBanner({ lastBatchAt }: DelayBannerProps) {
  const message = lastBatchAt
    ? `⚠️ ${strings.dashboard.delayBannerPrefix} ${formatLastBatchAt(lastBatchAt)}`
    : `⚠️ ${strings.dashboard.delayBannerNoData}`

  return (
    <Alert
      type="warning"
      title={message}
      role="alert"
      showIcon={false}
      closable={false}
      style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}
    />
  )
}
