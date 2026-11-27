import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…', label = 'Search' }: SearchInputProps) {
  return (
    <div className="adm-search">
      <Search size={15} aria-hidden="true" />
      <input
        type="search"
        className="adm-input"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="adm-icon-btn adm-search__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label: string
}

export function SelectFilter({ value, onChange, options, label }: SelectFilterProps) {
  return (
    <select
      className="adm-select adm-filter-select"
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

interface SegmentedControlProps<V extends string> {
  value: V
  onChange: (value: V) => void
  options: { value: V; label: string }[]
  label: string
}

export function SegmentedControl<V extends string>({ value, onChange, options, label }: SegmentedControlProps<V>) {
  return (
    <div className="adm-segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <span className="adm-result-count" aria-live="polite">
      {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
    </span>
  )
}
