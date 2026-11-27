import { useMemo, useState } from 'react'
import type { Product } from '../../shared/types/product'
import { SearchInput, SelectFilter } from './Filters'
import { includesText } from '../utils/format'
import './ProductPicker.css'

interface ProductPickerProps {
  products: Product[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  label?: string
}

/**
 * Multi-select list of existing catalog products (search + type filter),
 * used to associate badges with products. Nothing is assigned by default.
 */
export function ProductPicker({ products, selectedIds, onChange, label = 'Products' }: ProductPickerProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [onlySelected, setOnlySelected] = useState(false)
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const visible = products.filter((p) => {
    if (type !== 'all' && p.productType !== type) return false
    if (onlySelected && !selected.has(p.id)) return false
    return includesText([p.name, p.sku, p.brandOrTeam, p.category], query)
  })

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(Array.from(next))
  }

  const setVisible = (on: boolean) => {
    const next = new Set(selected)
    for (const p of visible) {
      if (on) next.add(p.id)
      else next.delete(p.id)
    }
    onChange(Array.from(next))
  }

  return (
    <div className="adm-field">
      <div className="adm-picker__head">
        <span className="adm-label">{label}</span>
        <span className="adm-hint adm-num" aria-live="polite">
          {selected.size} selected
        </span>
      </div>
      <div className="adm-picker__tools">
        <SearchInput value={query} onChange={setQuery} placeholder="Search products…" label="Search products to assign" />
        <SelectFilter
          label="Product type"
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'jersey', label: 'Jerseys' },
            { value: 'shoe', label: 'Shoes' },
          ]}
        />
      </div>
      <div className="adm-picker__actions">
        <label className="adm-picker__only">
          <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
          Selected only
        </label>
        <span className="adm-toolbar__spacer" />
        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setVisible(true)} disabled={!visible.length}>
          Select shown
        </button>
        <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => setVisible(false)} disabled={!visible.length}>
          Clear shown
        </button>
      </div>
      <ul className="adm-picker__list" role="group" aria-label={label}>
        {visible.length === 0 ? (
          <li className="adm-picker__empty">No products match.</li>
        ) : (
          visible.map((p) => (
            <li key={p.id}>
              <label className={`adm-picker__item ${selected.has(p.id) ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                <img src={p.images[0]} alt="" className="adm-thumb" loading="lazy" />
                <span className="adm-picker__text">
                  <span className="adm-cell-primary">{p.name}</span>
                  <span className="adm-cell-secondary">
                    {p.productType === 'jersey' ? 'Jersey' : 'Shoe'} · {p.category}
                  </span>
                </span>
              </label>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
