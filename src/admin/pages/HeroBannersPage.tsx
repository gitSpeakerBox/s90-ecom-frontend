import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { GalleryHorizontalEnd, ImagePlus, Pencil, Plus, Trash, Upload } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { DataTable } from '../components/DataTable'
import type { Column } from '../utils/table'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/StatusBadge'
import { Toggle } from '../components/Toggle'
import { useAdminData } from '../context/AdminDataContext'
import {
  HERO_BANNER_TYPES,
  HERO_NAME_MAX,
  HERO_TEXT_MAX,
  createHeroBanner,
  deleteHeroBanner,
  heroBannerValues,
  heroCategoryOptions,
  listHeroBanners,
  setHeroBannerActive,
  updateHeroBanner,
  validateHeroBanner,
} from '../services/bannerAdminService'
import type { HeroBannerInput, HeroBannerView } from '../services/bannerAdminService'
import './pages.css'
import './HeroBannersPage.css'

export function HeroBannersPage() {
  const { commit } = useAdminData()
  const [form, setForm] = useState<{ open: boolean; row: HeroBannerView | null }>({ open: false, row: null })
  const [confirm, setConfirm] = useState<HeroBannerView | null>(null)

  const rows = listHeroBanners()

  const columns: Column<HeroBannerView>[] = [
    {
      key: 'image',
      header: 'Image',
      render: (r) => (
        <span className="adm-hero-thumb">
          <img src={r.image} alt={r.name} loading="lazy" />
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Banner Type',
      render: (r) => <Badge tone="neutral">{r.type}</Badge>,
      sortValue: (r) => r.type,
    },
    {
      key: 'active',
      header: 'Active',
      render: (r) => (
        <div className="adm-hero-status">
          <Toggle
            checked={r.active}
            onChange={(v) =>
              commit(
                () => setHeroBannerActive(r, v),
                v ? `“${r.name}” unblocked — shown on the storefront.` : `“${r.name}” blocked — hidden from the storefront.`
              )
            }
            label={r.active ? `Block ${r.name}` : `Unblock ${r.name}`}
            hideLabel
            title={r.active ? 'Active — click to block' : 'Blocked — click to unblock'}
          />
          {r.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Blocked</Badge>}
        </div>
      ),
      sortValue: (r) => (r.active ? 0 : 1),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <span className="adm-row-actions">
          <button
            type="button"
            className="adm-icon-btn"
            title="Edit"
            aria-label={`Edit ${r.name}`}
            onClick={() => setForm({ open: true, row: r })}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="adm-icon-btn adm-btn--danger"
            title="Delete"
            aria-label={`Delete ${r.name}`}
            onClick={() => setConfirm(r)}
          >
            <Trash size={16} />
          </button>
        </span>
      ),
    },
  ]

  return (
    <div className="adm-stack">
      <PageHeader
        title="Hero Banners"
        subtitle="Full-width banners at the top of the Home, Jerseys and Shoes pages."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setForm({ open: true, row: null })}>
            <Plus size={16} aria-hidden="true" /> Add Hero Banner
          </button>
        }
      />

      <Card flush>
        <div className="adm-hero-table">
          <DataTable
            caption="Hero banners"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.key}
            empty={<EmptyState icon={GalleryHorizontalEnd} title="No hero banners" text="Add a hero banner to show it on the storefront." />}
          />
        </div>
      </Card>

      <Dialog
        open={form.open}
        onClose={() => setForm({ open: false, row: null })}
        title={form.row ? 'Edit Hero Banner' : 'Add Hero Banner'}
        subtitle={form.row ? form.row.name : 'Shown in its section while active'}
      >
        {form.open && (
          <HeroBannerForm key={form.row?.key ?? 'new'} row={form.row} onDone={() => setForm({ open: false, row: null })} />
        )}
      </Dialog>

      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        size="sm"
        title="Delete hero banner?"
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => setConfirm(null)}>
              No
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--destructive"
              onClick={() => {
                if (!confirm) return
                const name = confirm.name
                commit(() => deleteHeroBanner(confirm), `Hero banner “${name}” deleted.`)
                setConfirm(null)
              }}
            >
              Yes
            </button>
          </>
        }
      >
        {confirm && (
          <p style={{ fontSize: 14, color: 'var(--adm-text-2)' }}>
            Delete the {confirm.type} banner <strong style={{ color: 'var(--adm-text)' }}>“{confirm.name}”</strong>? It
            will be removed from the storefront.
          </p>
        )}
      </Dialog>
    </div>
  )
}

const HERO_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const HERO_IMAGE_MAX_BYTES = 2 * 1024 * 1024

/** Add / Edit Hero Banner form: names (EN/AR), Banner Type, banner text (EN/AR), Banner Image. */
function HeroBannerForm({ row, onDone }: { row: HeroBannerView | null; onDone: () => void }) {
  const { commit } = useAdminData()
  const [values, setValues] = useState<HeroBannerInput>(() =>
    row ? heroBannerValues(row) : { name: '', nameAr: '', type: '', text: '', textAr: '', category: '', image: '' }
  )
  const [errors, setErrors] = useState<Partial<Record<keyof HeroBannerInput, string>>>({})
  const categoryOptions = heroCategoryOptions()
  const set = <K extends keyof HeroBannerInput>(key: K, value: HeroBannerInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again after replacing
    if (!file) return
    if (!HERO_IMAGE_TYPES.includes(file.type)) {
      setErrors((er) => ({ ...er, image: 'Use a PNG, JPG or WebP image.' }))
      return
    }
    if (file.size > HERO_IMAGE_MAX_BYTES) {
      setErrors((er) => ({ ...er, image: 'Image must be 2 MB or smaller.' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => set('image', String(reader.result))
    reader.onerror = () => setErrors((er) => ({ ...er, image: 'Could not read that file. Try another image.' }))
    reader.readAsDataURL(file)
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validateHeroBanner(values)
    setErrors(errs)
    const firstInvalid = (['name', 'nameAr', 'type', 'category', 'text', 'textAr', 'image'] as const).find((k) => errs[k])
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    const name = values.name.trim()
    commit(
      () => {
        if (row) updateHeroBanner(row, values)
        else createHeroBanner(values)
      },
      row ? `Hero banner “${name}” updated.` : `Hero banner “${name}” added.`
    )
    onDone()
  }

  const fieldError = (key: keyof HeroBannerInput) =>
    errors[key] ? (
      <span id={`hero-${key}-error`} className="adm-field-error" role="alert">
        {errors[key]}
      </span>
    ) : null
  const invalid = (key: keyof HeroBannerInput) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `hero-${key}-error` : undefined,
  })
  const required = <span className="adm-required" aria-hidden="true">*</span>

  return (
    <form onSubmit={submit} noValidate>
      <div className="adm-form-grid">
        <label className="adm-field">
          <span className="adm-label">Name (English) {required}</span>
          <input
            className="adm-input"
            name="name"
            value={values.name}
            data-autofocus
            maxLength={HERO_NAME_MAX}
            placeholder="e.g. More Than A Game"
            autoComplete="off"
            onChange={(e) => set('name', e.target.value)}
            {...invalid('name')}
          />
          {fieldError('name')}
        </label>

        <label className="adm-field">
          <span className="adm-label">Name (Arabic) {required}</span>
          <input
            className="adm-input"
            name="nameAr"
            dir="rtl"
            lang="ar"
            value={values.nameAr}
            maxLength={HERO_NAME_MAX}
            placeholder="مثال: أكثر من مجرد لعبة"
            autoComplete="off"
            onChange={(e) => set('nameAr', e.target.value)}
            {...invalid('nameAr')}
          />
          {fieldError('nameAr')}
        </label>

        <label className="adm-field adm-field--full">
          <span className="adm-label">Banner Type {required}</span>
          <select
            className="adm-select"
            name="type"
            value={values.type}
            onChange={(e) => set('type', e.target.value as HeroBannerInput['type'])}
            {...invalid('type')}
          >
            <option value="" disabled>
              Select a type
            </option>
            {HERO_BANNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {fieldError('type')}
        </label>

        <label className="adm-field adm-field--full">
          <span className="adm-label">Categories {required}</span>
          <select
            className="adm-select"
            name="category"
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            {...invalid('category')}
          >
            <option value="" disabled>
              Select a category
            </option>
            {(['Jerseys', 'Shoes'] as const).map((group) => (
              <optgroup key={group} label={group}>
                {categoryOptions
                  .filter((o) => o.type === group)
                  .map((o) => (
                    <option key={o.value} value={o.value}>
                      {/* The ID tells apart categories that share a name. */}
                      {`${o.label} (${o.value})${o.active ? '' : ' — inactive'}`}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {fieldError('category') ?? (
            <span className="adm-hint">Customers clicking the banner go to this category’s page.</span>
          )}
        </label>

        <label className="adm-field adm-field--full">
          <span className="adm-label">Banner Text (English)</span>
          <textarea
            className="adm-textarea"
            name="text"
            rows={2}
            value={values.text}
            maxLength={HERO_TEXT_MAX}
            placeholder="Text shown inside the banner, under the name"
            onChange={(e) => set('text', e.target.value)}
            {...invalid('text')}
          />
          {fieldError('text')}
        </label>

        <label className="adm-field adm-field--full">
          <span className="adm-label">Banner Text (Arabic)</span>
          <textarea
            className="adm-textarea"
            name="textAr"
            dir="rtl"
            lang="ar"
            rows={2}
            value={values.textAr}
            maxLength={HERO_TEXT_MAX}
            placeholder="النص الظاهر داخل البانر، أسفل الاسم"
            onChange={(e) => set('textAr', e.target.value)}
            {...invalid('textAr')}
          />
          {fieldError('textAr')}
        </label>

        <div className="adm-field adm-field--full">
          <span className="adm-label" id="hero-image-label">
            Banner Image {required}
          </span>
          <div className="adm-hero-image-preview">
            {values.image ? (
              <img src={values.image} alt="Selected banner image preview" />
            ) : (
              <ImagePlus size={24} aria-hidden="true" />
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="adm-btn adm-btn--sm">
              <Upload size={14} aria-hidden="true" /> {values.image ? 'Replace image' : 'Choose image'}
              <input
                type="file"
                name="image"
                accept={HERO_IMAGE_TYPES.join(',')}
                onChange={onImage}
                className="adm-sr-only"
                aria-labelledby="hero-image-label"
              />
            </label>
            <span className="adm-hint">PNG, JPG or WebP, up to 2 MB. Kept for this session only (no file storage yet).</span>
          </div>
          {fieldError('image')}
        </div>
      </div>
      <div className="adm-dialog__footer" style={{ margin: '20px -24px -20px' }}>
        <button type="button" className="adm-btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="adm-btn adm-btn--primary">
          {row ? 'Save Hero Banner' : 'Add Hero Banner'}
        </button>
      </div>
    </form>
  )
}
