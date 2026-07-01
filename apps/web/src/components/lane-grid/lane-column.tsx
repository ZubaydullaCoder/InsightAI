// apps/web/src/components/lane-grid/lane-column.tsx
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { theme, Badge } from 'antd'
import { strings } from '../../strings.ts'
import { CATEGORY_COLORS, CATEGORY_LIGHT_COLORS } from '../../theme.ts'
import { CategoryIcon } from '../category-icon.tsx'
import { SignalCard } from '../signal-card/signal-card.tsx'
import type { Signal } from '../../api/signals.ts'

export type LaneKey = 'hokim' | 'water' | 'electricity' | 'gas' | 'waste'

const LANE_LABELS: Record<LaneKey, string> = {
  hokim:       strings.dashboard.lanes.hokim,
  water:       strings.dashboard.lanes.water,
  electricity: strings.dashboard.lanes.electricity,
  gas:         strings.dashboard.lanes.gas,
  waste:       strings.dashboard.lanes.waste,
}

function getLaneLabel(key: LaneKey): string {
  return LANE_LABELS[key]
}

const VIRTUALIZE_THRESHOLD = 50

export interface LaneColumnProps {
  laneKey: LaneKey
  signals: Signal[]
  activeSignalId?: number | null  // which signal card is currently highlighted
  onCardClick: (signal: Signal) => void
  isKeywordSearch?: boolean   // when true, shows keyword-search-specific empty state
  isDrawerOpen?: boolean      // when true, freeze scroll (AC-8)
}

function EmptyLane({
  token,
  isKeywordSearch,
}: {
  token: ReturnType<typeof theme.useToken>['token']
  isKeywordSearch?: boolean
}) {
  const message = isKeywordSearch
    ? strings.dashboard.searchEmptyLane
    : strings.dashboard.emptyLane
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px 16px',
        gap: 8,
      }}
    >
      {/* Muted icon — 28px, 35% opacity */}
      <span
        aria-hidden="true"
        style={{ fontSize: 28, opacity: 0.35, lineHeight: 1 }}
      >
        {isKeywordSearch ? '🔍' : '📭'}
      </span>
      <span
        style={{
          fontSize: 12,
          color: token.colorTextPlaceholder,
          textAlign: 'center',
        }}
      >
        {message}
      </span>
    </div>
  )
}

export function LaneColumn({ laneKey, signals, activeSignalId, onCardClick, isKeywordSearch, isDrawerOpen }: LaneColumnProps) {
  const { token } = theme.useToken()
  const parentRef = useRef<HTMLDivElement>(null)

  // Always call useVirtualizer — conditionally render virtual vs non-virtual below
  const virtualizer = useVirtualizer({
    count: signals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height in px
    overscan: 5,
  })

  const laneLabel = getLaneLabel(laneKey)
  const useVirtual = signals.length > VIRTUALIZE_THRESHOLD

  const iconColor = CATEGORY_COLORS[laneKey]
  const iconBg = CATEGORY_LIGHT_COLORS[laneKey]

  return (
    <div
      className="lane-column"
      role="feed"
      aria-label={laneLabel}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}
    >
      {/* Sticky header — icon chip + title + badge (matches reference col-header) */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorder}`,
          padding: '12px 14px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: '12px 12px 0 0', // match parent card radius at top
        }}
      >
        {/* Colored icon chip — 28×28px, per reference .col-icon */}
        <div
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CategoryIcon category={laneKey} color={iconColor} />
        </div>

        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1E293B', flex: 1 }}>
          {laneLabel}
        </span>
        
        {/* Styled category-colored pill count badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: iconBg,
            color: iconColor,
            padding: '2px 8px',
            borderRadius: 12,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {signals.reduce((sum, s) => sum + (s.groupCount || 1), 0)}
        </span>
      </div>

      {/* Lane body */}
      <div
        ref={parentRef}
        style={{
          flex: 1,
          // Keep lane scroll container always 'auto' to prevent scrollbar vanish/layout shift on click
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {signals.length === 0 ? (
          <EmptyLane token={token} isKeywordSearch={isKeywordSearch} />
        ) : useVirtual ? (
          /* Virtual scroll — when signals > 50 */
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((item) => {
              const signal = signals[item.index]!
              return (
                <div
                  key={item.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${item.start}px)`,
                    padding: '4px 8px',
                  }}
                >
                  <SignalCard
                    signal={signal}
                    isActive={signal.id === activeSignalId}
                    categoryColor={CATEGORY_COLORS[signal.category]}
                    onClick={onCardClick}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          /* Non-virtual — when signals ≤ 50 */
          signals.map((signal) => (
            <div key={signal.id} style={{ padding: '4px 8px' }}>
              <SignalCard
                signal={signal}
                isActive={signal.id === activeSignalId}
                categoryColor={CATEGORY_COLORS[signal.category]}
                onClick={onCardClick}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer link matching reference exactly */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: `1px solid ${token.colorBorder}`,
          background: '#FFFFFF',
          textAlign: 'center',
          borderRadius: '0 0 12px 12px',
        }}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault()
          }}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#2563EB',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'color 150ms',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1D4ED8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#2563EB')}
        >
          Барча сигналларни кўриш
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>
    </div>
  )
}
