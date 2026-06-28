// apps/web/src/components/filter-bar/time-range-chips.tsx
import { strings } from '../../strings.ts'
import type { TimeRangePreset } from '../../hooks/use-filters.ts'

const CHIP_DEFS: { key: TimeRangePreset; label: string }[] = [
  { key: '1h',        label: strings.filterBar.preset1h },
  { key: '3h',        label: strings.filterBar.preset3h },
  { key: '6h',        label: strings.filterBar.preset6h },
  { key: 'today',     label: strings.filterBar.presetToday },
  { key: 'yesterday', label: strings.filterBar.presetYesterday },
  { key: '7d',        label: strings.filterBar.preset7d },
]

export interface TimeRangeChipsProps {
  activePreset: TimeRangePreset
  onSelect: (preset: TimeRangePreset) => void
}

// Grouped pill container matching reference .time-pills design.
// Styles live in index.css (.time-pills, .time-pill, .time-pill.active)
// to avoid per-render style object creation and to allow CSS :hover to work cleanly.
export function TimeRangeChips({ activePreset, onSelect }: TimeRangeChipsProps) {
  return (
    <div className="time-pills" role="group" aria-label={strings.filterBar.timeRangeGroupLabel}>
      {CHIP_DEFS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`time-pill${activePreset === key ? ' active' : ''}`}
          onClick={() => onSelect(key)}
          aria-pressed={activePreset === key}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
