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

function getStatusDetails(id: number): { text: string; bg: string; color: string } {
  const mod = id % 5
  switch (mod) {
    case 0:
      return { text: 'Янги', bg: '#EFF6FF', color: '#2563EB' }
    case 1:
      return { text: 'Тасдиқланди', bg: '#F0FDF4', color: '#16A34A' }
    case 2:
      return { text: 'Кўриб чиқилди', bg: '#F5F3FF', color: '#7C3AED' }
    case 3:
      return { text: 'Рад этилди', bg: '#FEF2F2', color: '#DC2626' }
    case 4:
    default:
      return { text: 'Операторга берилди', bg: '#FFF7ED', color: '#EA580C' }
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

  const bgColor = isActive
    ? `${categoryColor}1A` // ~10% opacity when active
    : `${categoryColor}08` // ~3% opacity when inactive

  const border = isActive
    ? `1.5px solid ${categoryColor}`
    : `1.5px solid #E2E8F0`

  const boxShadow = isActive
    ? `0 0 0 2px ${categoryColor}1F, 0 2px 10px rgba(0,0,0,0.10)`
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
        {/* Row 1: location + clock time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748B', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>
            {locationLabel}
          </span>
          <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
