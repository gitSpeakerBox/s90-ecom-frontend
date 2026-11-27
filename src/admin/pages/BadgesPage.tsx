import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Award, Handshake, ImageOff, ImagePlus, Pencil, Plus, Trash, Upload } from 'lucide-react'
import type { BadgeDefinition, BadgeType } from '../../shared/types/badge'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { DataTable } from '../components/DataTable'
import { EmptyState } from '../components/EmptyState'
import { ResultCount, SearchInput, SegmentedControl, SelectFilter } from '../components/Filters'
import { Badge } from '../components/StatusBadge'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import { Pagination } from '../components/Pagination'
import { getText } from '../services/localeTextService'
import {
  BADGE_NAME_MAX,
  BADGE_TYPES,
  createBadge,
  deleteBadge,
  listBadges,
  productsWithBadge,
  updateBadge,
  validateBadge,
} from '../../shared/services/badgeService'
import type { BadgeInput } from '../../shared/services/badgeService'
import type { Column } from '../utils/table'
import { includesText, money, num } from '../utils/format'
import './pages.css'
import './BadgesPage.css'

/** Fixed page size of the badge listing. */
const BADGES_PER_PAGE = 5

/** Listing type filter: both types, or one of them. */
type TypeFilter = 'all' | BadgeType

const TYPE_FILTER_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'Normal Badge', label: 'Normal Badge' },
  { value: 'Sponsor Badge', label: 'Sponsor Badge' },
]

/** URL value (?type=normal|sponsor) ↔ filter. Also honours the older ?tab=sponsor link. */
function typeFromParams(params: URLSearchParams): TypeFilter {
  const t = params.get('type') ?? (params.get('tab') === 'sponsor' ? 'sponsor' : null)
  if (t === 'normal') return 'Normal Badge'
  if (t === 'sponsor') return 'Sponsor Badge'
  return 'all'
}

/** Existing storefront translation keys for the built-in badges. */
const DEFAULT_LABEL_KEYS: Record<string, string> = {
  'new arrival': 'productCard.badge.newArrival',
  'best seller': 'productCard.badge.bestSeller',
  sale: 'productCard.badge.sale',
  'limited edition': 'productCard.badge.limitedEdition',
  trending: 'productCard.badge.trending',
}

/** What the storefront shows when no custom label is set. */
function defaultLabel(name: string, lang: 'en' | 'ar'): string {
  const key = DEFAULT_LABEL_KEYS[name.toLowerCase()]
  return (key && getText(key, lang)) || name
}

function shownLabel(badge: BadgeDefinition, lang: 'en' | 'ar'): string {
  return badge.label[lang] || defaultLabel(badge.name, lang)
}

function hasArabic(text: string): boolean {
  return /\p{Script=Arabic}/u.test(text)
}

/** Arabic name to list: saved name, else the storefront's existing Arabic translation, else none. */
function arabicName(badge: BadgeDefinition): string {
  if (badge.nameAr) return badge.nameAr
  const fallback = shownLabel(badge, 'ar')
  return hasArabic(fallback) ? fallback : ''
}

export function BadgesPage() {
  const { commit } = useAdminData()
  const [params, setParams] = useSearchParams()
  const typeFilter = typeFromParams(params)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<{ open: boolean; badge: BadgeDefinition | null }>({ open: false, badge: null })
  const [confirm, setConfirm] = useState<BadgeDefinition | null>(null)

  // Single data source: every badge, both types.
  const all = listBadges('all')
  const countOf = (t: TypeFilter) => (t === 'all' ? all.length : all.filter((b) => b.type === t).length)

  const setTypeFilter = (next: TypeFilter) => {
    const p = new URLSearchParams(params)
    p.delete('tab')
    if (next === 'Normal Badge') p.set('type', 'normal')
    else if (next === 'Sponsor Badge') p.set('type', 'sponsor')
    else p.delete('type')
    setParams(p, { replace: true })
  }

  // Type filter and search work together.
  const rows = all.filter(
    (b) => (typeFilter === 'all' || b.type === typeFilter) && includesText([b.name, arabicName(b), b.type], query)
  )
  // 5 badges per page, over the current type's filtered list only.
  const pagination = usePagination(rows, BADGES_PER_PAGE)

  /** Search and type changes start again from page 1. */
  const changeQuery = (next: string) => {
    setQuery(next)
    pagination.setPage(1)
  }
  const changeType = (next: TypeFilter) => {
    setTypeFilter(next)
    pagination.setPage(1)
  }

  const openAdd = () => setForm({ open: true, badge: null })
  const confirmCount = confirm ? productsWithBadge(confirm.name).length : 0

  const columns: Column<BadgeDefinition>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (b) => {
        const ar = arabicName(b)
        return (
          <div>
            <div className="adm-cell-primary">{b.name}</div>
            {ar ? (
              <div className="adm-cell-secondary adm-badge-name-ar" dir="rtl" lang="ar">
                {ar}
              </div>
            ) : (
              <div className="adm-cell-secondary">No Arabic name</div>
            )}
          </div>
        )
      },
      sortValue: (b) => b.name,
    },
    {
      key: 'image',
      header: 'Badge Image',
      render: (b) =>
        b.image ? (
          <span className="adm-badge-thumb">
            <img src={b.image} alt={`${b.name} badge`} loading="lazy" />
          </span>
        ) : (
          <span className="adm-badge-thumb adm-badge-thumb--empty" title="No image uploaded">
            <ImageOff size={16} aria-hidden="true" />
            <span className="adm-sr-only">No image</span>
          </span>
        ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (b) => <Badge tone={b.type === 'Sponsor Badge' ? 'violet' : 'neutral'}>{b.type}</Badge>,
      sortValue: (b) => b.type,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      nowrap: true,
      render: (b) => <span className="adm-num">{money(b.price)}</span>,
      sortValue: (b) => b.price,
    },
    {
      key: 'products',
      header: 'Added Products',
      align: 'right',
      render: (b) => <span className="adm-num">{num(productsWithBadge(b.name).length)}</span>,
      sortValue: (b) => productsWithBadge(b.name).length,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <span className="adm-row-actions">
          <button
            type="button"
            className="adm-icon-btn"
            title="Edit"
            aria-label={`Edit ${b.name}`}
            onClick={() => setForm({ open: true, badge: b })}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="adm-icon-btn adm-btn--danger"
            title="Delete"
            aria-label={`Delete ${b.name}`}
            onClick={() => setConfirm(b)}
          >
            <Trash size={16} />
          </button>
        </span>
      ),
    },
  ]

  const noSponsorsYet = typeFilter === 'Sponsor Badge' && countOf('Sponsor Badge') === 0 && !query

  return (
    <div className="adm-stack">
      <PageHeader
        title="Badges"
        subtitle="Normal badges and sponsor badges shown on product cards and product pages."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={openAdd}>
            <Plus size={16} aria-hidden="true" /> Add badge
          </button>
        }
      />

      <div className="adm-badge-tabs">
        <SegmentedControl
          label="Badge type"
          value={typeFilter}
          onChange={changeType}
          options={TYPE_FILTER_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} · ${countOf(o.value)}` }))}
        />
      </div>

      <Card flush>
        <div className="adm-toolbar">
          <SearchInput value={query} onChange={changeQuery} placeholder="Search name or type…" label="Search badges" />
          <SelectFilter
            label="Type"
            value={typeFilter}
            onChange={(v) => changeType(v as TypeFilter)}
            options={TYPE_FILTER_OPTIONS}
          />
          <span className="adm-toolbar__spacer" />
          <ResultCount shown={rows.length} total={all.length} noun="badges" />
        </div>
        {noSponsorsYet ? (
          <EmptyState
            icon={Handshake}
            title="No sponsor badges yet"
            text="Add a badge and choose the Sponsor Badge type. Its image is shown as the sponsor logo on the products it is added to."
            action={
              <button type="button" className="adm-btn adm-btn--primary" style={{ marginTop: 10 }} onClick={openAdd}>
                <Plus size={16} aria-hidden="true" /> Add badge
              </button>
            }
          />
        ) : (
          <div className="adm-badge-table">
            <DataTable
              caption="Badges"
              columns={columns}
              rows={pagination.pageItems}
              rowKey={(b) => b.id}
              empty={<EmptyState icon={Award} title="No badges match" text="Adjust the search or type filter, or add a new badge." />}
            />
          </div>
        )}
        {!noSponsorsYet && <Pagination state={pagination} noun="badges" showPageSize={false} showPageCount />}
      </Card>

      <Dialog
        open={form.open}
        onClose={() => setForm({ open: false, badge: null })}
        title={form.badge ? 'Edit badge' : 'Add badge'}
        subtitle={form.badge ? form.badge.name : 'Normal Badge or Sponsor Badge'}
      >
        {form.open && (
          <BadgeForm
            key={form.badge?.id ?? 'new'}
            badge={form.badge}
            initialType={typeFilter === 'all' ? 'Normal Badge' : typeFilter}
            onDone={() => setForm({ open: false, badge: null })}
          />
        )}
      </Dialog>

      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        size="sm"
        title="Delete badge?"
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--destructive"
              onClick={() => {
                if (!confirm) return
                const name = confirm.name
                commit(() => deleteBadge(confirm), `Badge “${name}” deleted.`)
                setConfirm(null)
              }}
            >
              <Trash size={15} aria-hidden="true" /> Delete
            </button>
          </>
        }
      >
        {confirm && (
          <p style={{ fontSize: 14, color: 'var(--adm-text-2)' }}>
            <strong style={{ color: 'var(--adm-text)' }}>“{confirm.name}”</strong> ({confirm.type}) will be deleted and
            removed from {num(confirmCount)} product{confirmCount === 1 ? '' : 's'}. Other badges on those products are not
            affected.
            {confirm.builtIn ? ' This is one of the original catalog badges.' : ''}
          </p>
        )}
      </Dialog>
    </div>
  )
}

const BADGE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const BADGE_IMAGE_MAX_BYTES = 300 * 1024

/** Add / Edit Badge form: Name, Name in Arabic, Price, Type, Badge Image. */
function BadgeForm({
  badge,
  initialType,
  onDone,
}: {
  badge: BadgeDefinition | null
  /** Type pre-selected when adding (from the current listing filter). */
  initialType: BadgeType
  onDone: () => void
}) {
  const { commit } = useAdminData()
  const [values, setValues] = useState<BadgeInput>(() => {
    if (!badge) return { name: '', nameAr: '', price: '', type: initialType, image: '' }
    // Untouched catalog badges have no stored Arabic name yet: start from the
    // storefront's existing Arabic wording when there is one.
    const existingAr = badge.nameAr || defaultLabel(badge.name, 'ar')
    return {
      name: badge.name,
      nameAr: hasArabic(existingAr) ? existingAr : '',
      price: String(badge.price),
      type: badge.type,
      image: badge.image,
    }
  })
  const [errors, setErrors] = useState<Partial<Record<keyof BadgeInput, string>>>({})
  const set = <K extends keyof BadgeInput>(key: K, value: BadgeInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again after replacing
    if (!file) return
    if (!BADGE_IMAGE_TYPES.includes(file.type)) {
      setErrors((er) => ({ ...er, image: 'Use a PNG, JPG, WebP or SVG image.' }))
      return
    }
    if (file.size > BADGE_IMAGE_MAX_BYTES) {
      setErrors((er) => ({ ...er, image: 'Image must be 300 KB or smaller.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => set('image', String(reader.result))
    reader.onerror = () => setErrors((er) => ({ ...er, image: 'Could not read that file. Try another image.' }))
    reader.readAsDataURL(file)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validateBadge(values, badge ?? undefined)
    setErrors(errs)
    const firstInvalid = (['name', 'nameAr', 'price', 'type'] as const).find((k) => errs[k])
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    const name = values.name.trim()
    commit(
      () => {
        if (badge) updateBadge(badge, values)
        else createBadge(values)
      },
      badge ? `Badge “${name}” updated.` : `Badge “${name}” added.`
    )
    onDone()
  }

  const fieldError = (key: keyof BadgeInput) =>
    errors[key] ? (
      <span id={`badge-${key}-error`} className="adm-field-error" role="alert">
        {errors[key]}
      </span>
    ) : null
  const invalid = (key: keyof BadgeInput) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `badge-${key}-error` : undefined,
  })

  return (
    <form onSubmit={submit} noValidate>
      <div className="adm-form-grid">
        <label className="adm-field">
          <span className="adm-label">
            Name <span className="adm-required" aria-hidden="true">*</span>
          </span>
          <input
            className="adm-input"
            name="name"
            value={values.name}
            data-autofocus
            maxLength={BADGE_NAME_MAX}
            placeholder="e.g. Exclusive"
            autoComplete="off"
            required
            onChange={(e) => set('name', e.target.value)}
            {...invalid('name')}
          />
          {fieldError('name')}
        </label>

        <label className="adm-field">
          <span className="adm-label">
            Name in Arabic <span className="adm-required" aria-hidden="true">*</span>
          </span>
          <input
            className="adm-input"
            name="nameAr"
            dir="rtl"
            lang="ar"
            value={values.nameAr}
            maxLength={BADGE_NAME_MAX}
            placeholder="مثال: حصري"
            autoComplete="off"
            required
            onChange={(e) => set('nameAr', e.target.value)}
            {...invalid('nameAr')}
          />
          {fieldError('nameAr')}
        </label>

        <label className="adm-field">
          <span className="adm-label">
            Price (QAR) <span className="adm-required" aria-hidden="true">*</span>
          </span>
          <input
            className="adm-input adm-num"
            name="price"
            type="text"
            inputMode="decimal"
            value={values.price}
            placeholder="0.00"
            autoComplete="off"
            required
            onKeyDown={(e) => {
              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault()
            }}
            onChange={(e) => set('price', e.target.value.replace(',', '.'))}
            {...invalid('price')}
          />
          {fieldError('price') ?? <span className="adm-hint">Up to 2 decimal places. Use 0 for free.</span>}
        </label>

        <label className="adm-field">
          <span className="adm-label">
            Type <span className="adm-required" aria-hidden="true">*</span>
          </span>
          <select
            className="adm-select"
            name="type"
            value={values.type}
            required
            onChange={(e) => set('type', e.target.value as BadgeType)}
            {...invalid('type')}
          >
            {BADGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {fieldError('type')}
        </label>

        <div className="adm-field adm-field--full">
          <span className="adm-label" id="badge-image-label">
            Badge Image
          </span>
          <div className="adm-sponsor-logo-row">
            <div className="adm-sponsor-logo-preview adm-badge-image-preview">
              {values.image ? (
                <img src={values.image} alt="Selected badge image preview" />
              ) : (
                <ImagePlus size={22} aria-hidden="true" />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label className="adm-btn adm-btn--sm">
                  <Upload size={14} aria-hidden="true" /> {values.image ? 'Replace image' : 'Choose image'}
                  <input
                    type="file"
                    name="image"
                    accept={BADGE_IMAGE_TYPES.join(',')}
                    onChange={onImage}
                    className="adm-sr-only"
                    aria-labelledby="badge-image-label"
                  />
                </label>
                {values.image && (
                  <button type="button" className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => set('image', '')}>
                    Remove
                  </button>
                )}
              </div>
              <p className="adm-hint" style={{ marginTop: 6 }}>
                PNG, JPG, WebP or SVG, up to 300 KB. Kept for this session only (no file storage yet).
              </p>
              {fieldError('image')}
            </div>
          </div>
        </div>
      </div>
      <div className="adm-dialog__footer" style={{ margin: '20px -24px -20px' }}>
        <button type="button" className="adm-btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="adm-btn adm-btn--primary">
          {badge ? 'Save badge' : 'Add Badge'}
        </button>
      </div>
    </form>
  )
}
