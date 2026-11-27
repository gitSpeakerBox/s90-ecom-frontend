import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { SearchInput } from './Filters'

interface ImagePickerProps {
  value: string
  onChange: (path: string) => void
  /** Existing asset paths to choose from. */
  options: string[]
  label?: string
}

/**
 * Selects one of the images that already exist in public/images (as
 * referenced by the existing data). Uploading is out of scope for this phase.
 */
export function ImagePicker({ value, onChange, options, label = 'Image' }: ImagePickerProps) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query]
  )

  return (
    <div className="adm-field">
      <span className="adm-label">{label}</span>
      <SearchInput value={query} onChange={setQuery} placeholder="Filter existing images…" label="Filter images" />
      <div className="adm-image-picker" role="group" aria-label={`${label} options`}>
        {filtered.map((path) => (
          <button
            key={path}
            type="button"
            aria-pressed={path === value}
            title={path}
            onClick={() => onChange(path)}
          >
            <img src={path} alt="" loading="lazy" />
            {path === value && (
              <span className="adm-image-picker__check" aria-hidden="true">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
            <span className="adm-sr-only">{path}</span>
          </button>
        ))}
      </div>
      <span className="adm-hint adm-mono">{value || 'No image selected'}</span>
    </div>
  )
}
