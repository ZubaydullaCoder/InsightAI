// apps/web/src/components/filter-bar/filter-bar.tsx
import { theme } from 'antd'
import { TimeRangeChips } from './time-range-chips.tsx'
import { MahallaSelect } from './mahalla-select.tsx'
import { DateRangePicker } from './date-range-picker.tsx'
import { KeywordSearch } from './keyword-search.tsx'
import { useMahallas } from '../../api/mahallas.ts'
import type { FilterState, TimeRangePreset } from '../../hooks/use-filters.ts'

export interface FilterBarProps {
  filterState: FilterState
  onTimeRangeChange: (preset: TimeRangePreset) => void
  onMahallaChange: (id: number | null) => void
  searchInputText: string
  onSearchChange: (text: string) => void
  onSearchClear: () => void
  onRangeChange: (range: [string, string] | null) => void
}

export function FilterBar({
  filterState,
  onTimeRangeChange,
  onMahallaChange,
  searchInputText,
  onSearchChange,
  onSearchClear,
  onRangeChange,
}: FilterBarProps) {
  const { token } = theme.useToken()
  const { data: mahallas = [] } = useMahallas()

  return (
    <div
      className="filter-bar-controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        height: '100%',
        minWidth: 0,
      }}
    >
      {/* Time range label */}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
        Вақт оралиғи:
      </span>

      {/* Time range chips */}
      <TimeRangeChips
        activePreset={filterState.timeRange}
        onSelect={onTimeRangeChange}
      />

      {/* Custom date range picker */}
      <DateRangePicker
        value={filterState.customRange}
        onRangeChange={onRangeChange}
      />

      {/* Mahalla label */}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', marginLeft: 6 }}>
        Маҳалла:
      </span>

      {/* Mahalla dropdown */}
      <div className="filter-mahalla-wrap" style={{ flexShrink: 0 }}>
        <MahallaSelect
          value={filterState.mahallaId}
          onSelect={onMahallaChange}
          mahallas={mahallas}
        />
      </div>

      {/* Keyword search box - pushed to the right */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
        <KeywordSearch
          value={searchInputText}
          onChange={onSearchChange}
          onClear={onSearchClear}
        />

        {/* Filters dropdown button */}
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            background: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            fontFamily: token.fontFamily,
            transition: 'all 150ms ease',
            height: 32,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F8FAFC'
            e.currentTarget.style.borderColor = '#CBD5E1'
            e.currentTarget.style.color = '#0F172A'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.borderColor = '#E2E8F0'
            e.currentTarget.style.color = '#475569'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Филтрлар
          <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.8 }}>▼</span>
        </button>
      </div>
    </div>
  )
}
