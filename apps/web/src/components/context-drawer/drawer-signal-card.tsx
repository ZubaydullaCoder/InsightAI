// apps/web/src/components/context-drawer/drawer-signal-card.tsx
// Non-interactive, full-text card for use inside the ContextDrawer.
// DO NOT add onClick, onKeyDown, WebkitLineClamp, or tabIndex — this is intentional.
import { theme } from 'antd'
import type { Signal } from '../../api/signals.ts'
import { formatMahallaLabel } from '../../utils/mahalla-label.ts'
import { formatSignalTimestamp, getSignalSenderName } from '../../utils/signal-display.ts'

export interface DrawerSignalCardProps {
  signal: Signal
  isActive: boolean
  categoryColor: string // hex — always service category color
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

// Deterministic avatar color: the same sender name always maps to the same color.
const AVATAR_PALETTE = [
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#84CC16', // lime
  '#F97316', // orange
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]!
}

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  // First letter of the name
  return trimmed[0]!.toUpperCase()
}

// ─── Component ────────────────────────────────────────────────────────────────

const DISTRICT_NAMES: Record<number, string> = {
  1: 'Юнусобод тумани',
}

function formatClockTime(isoString: string): string {
  const date = new Date(isoString)
  const utc5 = new Date(date.getTime() + 5 * 3600 * 1000)
  const hh = String(utc5.getUTCHours()).padStart(2, '0')
  const mm = String(utc5.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function getStatusDetails(id: number): { text: string; color: string; bg: string; activeBg: string } {
  const mod = id % 4
  switch (mod) {
    case 0:
      return { text: 'Янги', color: '#2563EB', bg: '#2563EB08', activeBg: '#2563EB1A' }
    case 1:
      return { text: 'Жараёнда', color: '#EA580C', bg: '#EA580C08', activeBg: '#EA580C1A' }
    case 2:
      return { text: 'Бажарилди', color: '#0D9488', bg: '#0D948808', activeBg: '#0D94881A' }
    case 3:
    default:
      return { text: 'Тасдиқланди', color: '#16A34A', bg: '#16A34A08', activeBg: '#16A34A1A' }
  }
}

function getAiConfidence(id: number): number {
  return 70 + (id * 17) % 29
}

export function DrawerSignalCard({ signal, isActive, categoryColor }: DrawerSignalCardProps) {
  const { token } = theme.useToken()
  const senderName = getSignalSenderName(signal)
  const timestamp = formatSignalTimestamp(signal.telegramTimestamp)
  const clockTime = formatClockTime(signal.telegramTimestamp)

  const avatarColor = getAvatarColor(senderName)
  const initials = getInitials(senderName)
  const mahallaLabel = formatMahallaLabel(signal.mahallaName)
  const districtName = DISTRICT_NAMES[signal.districtId] ?? 'Юнусобод тумани'
  const locationLabel = `${districtName}, ${mahallaLabel}`

  const status = getStatusDetails(signal.id)
  const confidence = getAiConfidence(signal.id)

  const bgColor = isActive ? status.activeBg : status.bg
  const border = isActive ? `1.5px solid ${status.color}` : `1.5px solid #E2E8F0`
  const boxShadow = isActive
    ? `0 0 0 2px ${status.color}1F, 0 2px 10px rgba(0,0,0,0.10)`
    : '0 1px 3px rgba(0,0,0,0.06)'

  return (
    <div
      role="article"
      style={{
        display: 'flex',
        gap: 10,
        border,
        borderRadius: 12,
        background: bgColor,
        boxShadow,
        cursor: 'default',
        padding: '12px',
        marginBottom: 10,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Circular avatar — Telegram style */}
      <div
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#FFFFFF',
          flexShrink: 0,
          userSelect: 'none',
          marginTop: 2,
        }}
      >
        {initials}
      </div>

      {/* Message content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: location column + clock time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          {/* Location Column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, marginRight: 6 }}>
            <span style={{ fontSize: 10.5, fontWeight: 500, color: '#94A3B8', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {districtName}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
              {mahallaLabel}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginTop: 2 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {clockTime}
          </span>
        </div>

        {/* Row 2: sender name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
            {senderName}
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8', display: 'none' }}>
            {timestamp}
          </span>
        </div>

        {/* Row 3: full raw text */}
        <div
          style={{
            fontSize: 13,
            color: '#334155',
            lineHeight: 1.5,
            fontWeight: 500,
            marginBottom: 10,
          }}
        >
          {signal.rawText}
        </div>

        {/* Row 4: tags and links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Status Badge */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 5,
              background: `${status.color}16`,
              color: status.color,
              border: `1px solid ${status.color}2A`,
              whiteSpace: 'nowrap',
            }}
          >
            {status.text}
          </span>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {signal.textSource === 'caption' && (
              <span
                role="img"
                aria-label="Расм тавсифи"
                style={{ fontSize: 11, color: token.colorTextPlaceholder }}
              >
                📷
              </span>
            )}
            {signal.hokimRelated && (
              <span aria-hidden="true" style={{ fontSize: 12, color: token.colorWarning }}>
                ★
              </span>
            )}
            {signal.telegramMessageUrl && (
              <a
                href={signal.telegramMessageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}
              >
                Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
