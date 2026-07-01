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

export function DrawerSignalCard({ signal, isActive, categoryColor }: DrawerSignalCardProps) {
  const { token } = theme.useToken()
  const senderName = getSignalSenderName(signal)
  const timestamp = formatSignalTimestamp(signal.telegramTimestamp)

  const avatarColor = getAvatarColor(senderName)
  const initials = getInitials(senderName)
  const mahallaLabel = formatMahallaLabel(signal.mahallaName)

  // Mirror signal-card active style: tinted background + colored border + ring
  const bgColor = isActive
    ? `${categoryColor}0D` // categoryColor at ~5% opacity (hex: 0D ≈ 5%)
    : token.colorBgElevated

  const border = isActive
    ? `1.5px solid ${categoryColor}`
    : `1.5px solid #E2E8F0`

  const boxShadow = isActive
    ? `0 0 0 2px ${categoryColor}1F, 0 2px 10px rgba(0,0,0,0.10)`
    : '0 1px 3px rgba(0,0,0,0.06)'

  const hasFooter = signal.textSource === 'caption' || signal.hokimRelated || signal.telegramMessageUrl

  return (
    <div
      role="article"
      // No tabIndex — drawer cards are non-interactive (Story 4.5 handles card swap)
      // No onClick, onKeyDown — intentional per AC-6
      style={{
        display: 'flex',
        gap: 10,
        border,
        borderRadius: token.borderRadius,
        background: bgColor,
        boxShadow,
        cursor: 'default', // non-interactive
        padding: '10px 12px',
        marginBottom: 10,
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Circular avatar — Telegram style */}
      <div
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: '#FFFFFF',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {initials}
      </div>

      {/* Message content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: sender + timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: token.colorText, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {senderName}
          </span>
          <span style={{ fontSize: 11, color: token.colorTextSecondary, flexShrink: 0 }}>
            {timestamp}
          </span>
        </div>

        {/* Row 2: MFY label */}
        <div style={{ fontSize: 11, color: token.colorTextSecondary, marginBottom: 4 }}>
          {mahallaLabel}
        </div>

        {/* Row 3: full raw text — NO WebkitLineClamp (AC-6) */}
        <div
          style={{
            fontSize: 13,
            color: token.colorText,
            lineHeight: 1.5,
            marginBottom: hasFooter ? 6 : 0,
            // Full text intentionally — no overflow hidden
          }}
        >
          {signal.rawText}
        </div>

        {/* Footer: source markers + Telegram link */}
        {hasFooter && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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
                style={{ fontSize: 12 }}
              >
                Telegram
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
