// apps/web/src/components/context-drawer/context-drawer.tsx
// Overlay drawer showing corroborating signals for a clicked signal.
// DO NOT: push mode, global Escape listener, destroyOnClose, refetchInterval.
import { useRef, useEffect } from 'react'
import { Drawer, Skeleton, theme } from 'antd'
import { useSignalContext, useUpdateSignalStatus } from '../../api/signals.ts'
import { DrawerSignalCard } from './drawer-signal-card.tsx'
import { CATEGORY_COLORS, CATEGORY_LIGHT_COLORS } from '../../theme.ts'
import { CategoryIcon } from '../category-icon.tsx'
import { strings } from '../../strings.ts'
import { formatMahallaLabel } from '../../utils/mahalla-label.ts'
import type { Signal } from '../../api/signals.ts'

// Uzbek Cyrillic service category names for breadcrumb.
// NOTE: 'hokim' is NOT a Signal.category value — signals always carry a service category.
// hokimRelated signals use their actual category (gas, water, etc.) in the breadcrumb — NOT 'Ҳокимга тегишли' (AC-2).
const CATEGORY_LABELS: Record<Signal['category'], string> = {
  water:       strings.dashboard.lanes.water,
  electricity: strings.dashboard.lanes.electricity,
  gas:         strings.dashboard.lanes.gas,
  waste:       strings.dashboard.lanes.waste,
}

// Format a Date as HH:MM in UTC+5. Captured once at click time — NOT recomputed on re-render.
function formatUTC5Time(date: Date): string {
  const utc5 = new Date(date.getTime() + 5 * 3600000)
  const hh = String(utc5.getUTCHours()).padStart(2, '0')
  const mm = String(utc5.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// Build breadcrumb: CategoryName · MahallaName (MFY) · HH:MM (AC-2)
function buildBreadcrumb(signal: Signal, clickedAt: Date | null): string {
  const categoryName = CATEGORY_LABELS[signal.category]
  const mahallaLabel = formatMahallaLabel(signal.mahallaName)
  const clickTime = clickedAt ? formatUTC5Time(clickedAt) : ''
  return `${categoryName} · ${mahallaLabel} · ${clickTime}`
}

export interface ContextDrawerProps {
  anchorSignal: Signal | null
  anchorClickedAt: Date | null
  isOpen: boolean
  onClose: () => void
  onAfterOpenChange?: (open: boolean) => void
  contextParams?: { from?: string; to?: string }
}

export function ContextDrawer({
  anchorSignal,
  anchorClickedAt,
  isOpen,
  onClose,
  onAfterOpenChange,
  contextParams,
}: ContextDrawerProps) {
  const { token } = theme.useToken()
  const anchorRef = useRef<HTMLDivElement | null>(null)

  // Call with computedApiParams forwarded from DashboardPage (AC-11)
  const { data: contextSignals = [], isLoading } = useSignalContext(
    anchorSignal?.id ?? null,
    contextParams,
  )

  const updateStatusMutation = useUpdateSignalStatus()

  const handleStatusChange = (status: string) => {
    if (anchorSignal) {
      updateStatusMutation.mutate({ signalId: anchorSignal.id, status })
    }
  }

  // Scroll anchor to center when context data loads (AC-4)
  useEffect(() => {
    if (!isLoading && anchorRef.current) {
      anchorRef.current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [isLoading, anchorSignal?.id])

  // Only-anchor empty state: context returned only the clicked signal (AC-9)
  const isOnlyAnchor =
    contextSignals.length === 1 &&
    anchorSignal !== null &&
    contextSignals[0]?.id === anchorSignal.id

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      afterOpenChange={onAfterOpenChange}
      placement="right"
      title={
        anchorSignal ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              paddingRight: 24, // compensates for close button width to center the title
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                background: CATEGORY_LIGHT_COLORS[anchorSignal.category],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CategoryIcon
                category={anchorSignal.category}
                color={CATEGORY_COLORS[anchorSignal.category]}
                size={14}
              />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {buildBreadcrumb(anchorSignal, anchorClickedAt)}
            </span>
          </div>
        ) : ''
      }
      className="context-drawer"
      styles={{
        mask: { background: 'rgba(15, 23, 42, 0.08)' },
        wrapper: {
          top: '12px',
          bottom: '12px',
          right: '12px',
          height: 'calc(100% - 24px)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        section: {
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          height: '100%',
        },
        body: {
          padding: '16px 14px',
          background: '#F8FAFC',
        },
        header: {
          padding: '16px 14px',
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF',
        },
      }}
      // Keep mounted so 4.5 card-swap stays smooth; do NOT use destroyOnClose (AC-7 note)
      destroyOnHidden={false}
    >
      {isLoading ? (
        // 3-row skeleton while context resolves (AC-3)
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <>
          {/* Info Banner showing that these are raw messages from residents */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>💬</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', lineHeight: 1.3 }}>
                Мурожаатлар рўйхати (Ҳақиқий хабарлар)
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 500, color: '#64748B', lineHeight: 1.3, marginTop: 1 }}>
                Ушбу тизимли муаммо доирасида маҳалла аҳолиси (резидентлар) томонидан юборилган барча асл мурожаатлар рўйхати.
              </span>
            </div>
          </div>

          {/* Status Transition Control */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Муаммо ҳолатини ўзгартириш:
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { value: 'yangi', label: 'Янги', color: '#2563EB' },
                { value: 'jarayonda', label: 'Жараёнда', color: '#EA580C' },
                { value: 'bajarildi', label: 'Бажарилди', color: '#0D9488' },
                { value: 'tasdiqlandi', label: 'Тасдиқланди', color: '#16A34A' },
              ].map((opt) => {
                const currentStatus = contextSignals.find(s => s.id === anchorSignal?.id)?.status ?? anchorSignal?.status ?? 'yangi'
                const isSelected = currentStatus.toLowerCase() === opt.value.toLowerCase()
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      border: isSelected ? `1.5px solid ${opt.color}` : '1.5px solid #E2E8F0',
                      background: isSelected ? `${opt.color}0E` : '#FFFFFF',
                      color: isSelected ? opt.color : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Context signals in ascending chronological order — oldest at top (AC-3) */}
          {contextSignals.map((signal) => (
            <div
              key={signal.id}
              ref={signal.id === anchorSignal?.id ? anchorRef : undefined}
            >
              <DrawerSignalCard
                signal={signal}
                isActive={signal.id === anchorSignal?.id}
                categoryColor={CATEGORY_COLORS[signal.category]}
                anchorId={anchorSignal?.id ?? undefined}
              />
            </div>
          ))}
          {/* Only-anchor empty state (AC-9) — anchor is still shown above */}
          {isOnlyAnchor && (
            <div style={{ fontSize: 12, color: token.colorTextPlaceholder, padding: '8px 0' }}>
              {strings.drawer.onlyAnchorMessage}
            </div>
          )}
        </>
      )}
    </Drawer>
  )
}
