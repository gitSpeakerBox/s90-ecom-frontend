import React from 'react'
import { X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import './FilterChips.css'

export interface AppliedFilterChip {
  key: string
  label: string
  value: string
}

export interface FilterChipsProps {
  chips: AppliedFilterChip[]
  onRemoveChip: (key: string, value: string) => void
  onClearAll: () => void
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  onRemoveChip,
  onClearAll,
}) => {
  const { t } = useLocale()
  if (chips.length === 0) return null

  return (
    <div className="filter-chips-section">
      <div className="filter-chips-inner">
        <div className="filter-chips-list">
          {chips.map((chip) => (
            <span key={`${chip.key}-${chip.value}`} className="filter-chip">
              <span className="filter-chip-text">{chip.label}</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => onRemoveChip(chip.key, chip.value)}
                aria-label={t('filters.removeFilterAria', { label: chip.label })}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}

          <button
            type="button"
            className="filter-chips-clear-all"
            onClick={onClearAll}
          >
            {t('filters.clearAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
