import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { includesText } from '../utils/format'
import './MultiSelect.css'

export interface MultiSelectOption {
  value: string
  label: string
  /** Secondary text shown under the label (e.g. type and ID). */
  hint?: string
}

interface MultiSelectProps {
  /** Accessible name of the control. */
  label: string
  name?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

/**
 * Multi-select dropdown: a trigger button that opens a searchable checkbox
 * list. Closes on outside click or Escape. Selected items show as removable
 * chips under the trigger.
 */
export function MultiSelect({ label, name, options, value, onChange, placeholder = 'Select…' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = new Set(value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation() // close the dropdown, not the surrounding dialog
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    rootRef.current?.addEventListener('keydown', onKey)
    const node = rootRef.current
    return () => {
      document.removeEventListener('mousedown', onDown)
      node?.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = (v: string) => {
    onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v
  const visible = options.filter((o) => includesText([o.label, o.hint], query))
  const summary =
    value.length === 0 ? placeholder : value.length === 1 ? labelOf(value[0]) : `${value.length} selected`

  return (
    <div className="adm-multiselect" ref={rootRef}>
      <button
        type="button"
        name={name}
        className={`adm-select adm-multiselect__trigger ${value.length ? '' : 'is-empty'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${value.length ? value.map(labelOf).join(', ') : 'none selected'}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="adm-multiselect__summary">{summary}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div className="adm-multiselect__panel">
          <input
            className="adm-input adm-multiselect__search"
            type="search"
            value={query}
            placeholder="Search…"
            aria-label={`Search ${label}`}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul id={listId} className="adm-multiselect__list" role="listbox" aria-multiselectable="true" aria-label={label}>
            {visible.length === 0 ? (
              <li className="adm-multiselect__empty">No matches</li>
            ) : (
              visible.map((o) => (
                <li key={o.value} role="option" aria-selected={selected.has(o.value)}>
                  <label className="adm-multiselect__option">
                    <input type="checkbox" checked={selected.has(o.value)} onChange={() => toggle(o.value)} />
                    <span>
                      <span className="adm-multiselect__label">{o.label}</span>
                      {o.hint && <span className="adm-multiselect__hint">{o.hint}</span>}
                    </span>
                  </label>
                </li>
              ))
            )}
          </ul>
          <div className="adm-multiselect__footer">
            <span className="adm-hint">{value.length} selected</span>
            <span style={{ display: 'flex', gap: 4 }}>
              <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => onChange([])} disabled={!value.length}>
                Clear
              </button>
              <button type="button" className="adm-btn adm-btn--sm" onClick={() => setOpen(false)}>
                Done
              </button>
            </span>
          </div>
        </div>
      )}

      {value.length > 0 && (
        <ul className="adm-multiselect__chips" aria-label={`Selected ${label}`}>
          {value.map((v) => (
            <li key={v} className="adm-multiselect__chip">
              {labelOf(v)}
              <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${labelOf(v)}`}>
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
