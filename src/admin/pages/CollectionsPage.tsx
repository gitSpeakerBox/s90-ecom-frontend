import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Layers, Pencil, Plus, Upload } from 'lucide-react'
import type { CollectionConfig } from '../../user/data/collections'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { ResultCount, SearchInput, SelectFilter } from '../components/Filters'
import { DataTable } from '../components/DataTable'
import { sortRows } from '../utils/table'
import type { Column } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/StatusBadge'
import { Toggle } from '../components/Toggle'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import {
  CATEGORY_NAME_MAX,
  categoryImage,
  collectionName,
  createCategory,
  listCollections,
  setActive,
  typeLabel,
  updateCategory,
  validateCategory,
} from '../services/collectionAdminService'
import type { CategoryInput, CollectionView } from '../services/collectionAdminService'
import { adminPath } from '../routes/navConfig'
import { includesText, num } from '../utils/format'
import './pages.css'
import './CollectionsPage.css'

export function CollectionsPage() {
  const { commit } = useAdminData()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [form, setForm] = useState<{ open: boolean; config: CollectionConfig | null }>({ open: false, config: null })

  const all = listCollections()

  const toggleActive = (c: CollectionView, active: boolean) =>
    commit(
      () => setActive(c.config, active),
      active ? `“${c.name}” is active — visible on the storefront.` : `“${c.name}” deactivated — hidden from the storefront.`
    )

  const columns: Column<CollectionView>[] = [
    {
      key: 'name',
      header: 'Collection Name',
      render: (c) => <span className="adm-cell-primary">{c.name}</span>,
      sortValue: (c) => c.name,
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => <Badge tone="neutral">{c.type}</Badge>,
      sortValue: (c) => c.type,
    },
    {
      key: 'products',
      header: 'Products',
      align: 'right',
      render: (c) =>
        c.productCount > 0 ? (
          <Link
            to={`${adminPath('products')}?collection=${encodeURIComponent(c.config.slug)}`}
            className="adm-link adm-num"
            title={`View the ${num(c.productCount)} products in this collection`}
          >
            {num(c.productCount)}
          </Link>
        ) : (
          <span className="adm-num adm-muted">0</span>
        ),
      sortValue: (c) => c.productCount,
    },
    {
      key: 'active',
      header: 'Active',
      render: (c) => (
        <div className="adm-collection-status">
          <Toggle
            checked={c.active}
            onChange={(v) => toggleActive(c, v)}
            label={c.active ? `Deactivate ${c.name}` : `Activate ${c.name}`}
            hideLabel
            title={c.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
          />
          {c.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
        </div>
      ),
      sortValue: (c) => (c.active ? 0 : 1),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <button
          type="button"
          className="adm-icon-btn"
          title="Edit"
          aria-label={`Edit ${c.name}`}
          onClick={() => setForm({ open: true, config: c.config })}
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ]

  const filtered = (() => {
    const rows = all.filter((c) => {
      if (type !== 'all' && c.config.type !== type) return false
      return includesText([c.name, c.nameAr, c.config.slug, ...(c.config.aliases ?? [])], query)
    })
    return sortRows(rows, columns, sort)
  })()

  const pagination = usePagination(filtered, 10)
  const activeCount = all.filter((c) => c.active).length

  return (
    <div className="adm-stack">
      <PageHeader
        title="Categories"
        subtitle={`${num(all.length)} categories · ${num(activeCount)} active on the storefront`}
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setForm({ open: true, config: null })}>
            <Plus size={16} aria-hidden="true" /> Add Category
          </button>
        }
      />

      <Card
        flush
        footer="Inactive collections are hidden from customers (collection menu, collection cards, home-page category strips and their collection page). Products are not changed. The Active status is saved in this browser only until a backend is connected."
      >
        <div className="adm-toolbar">
          <SearchInput value={query} onChange={setQuery} placeholder="Search collections…" label="Search collections" />
          <SelectFilter
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'jersey', label: 'Jerseys' },
              { value: 'shoe', label: 'Shoes' },
            ]}
          />
          <span className="adm-toolbar__spacer" />
          <ResultCount shown={filtered.length} total={all.length} noun="collections" />
        </div>
        <div className="adm-collections-table">
          <DataTable
            caption="Collections"
            columns={columns}
            rows={pagination.pageItems}
            rowKey={(c) => c.config.slug}
            sortState={sort}
            onSortChange={setSort}
            empty={<EmptyState icon={Layers} title="No collections match" text="Adjust the search or type filter." />}
          />
        </div>
        <Pagination state={pagination} noun="collections" />
      </Card>

      <Dialog
        open={form.open}
        onClose={() => setForm({ open: false, config: null })}
        title={form.config ? 'Edit Category' : 'Add Category'}
        subtitle={form.config ? collectionName(form.config, 'en') : 'New category on the storefront'}
      >
        {form.open && (
          <CategoryForm
            key={form.config?.slug ?? 'new'}
            config={form.config}
            onDone={() => setForm({ open: false, config: null })}
          />
        )}
      </Dialog>
    </div>
  )
}

const CATEGORY_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const CATEGORY_IMAGE_MAX_BYTES = 300 * 1024

/** Add / Edit Category form: English name, Arabic name, image. */
function CategoryForm({
  config,
  onDone,
}: {
  config: CollectionConfig | null
  onDone: () => void
}) {
  const { commit } = useAdminData()
  const editing = Boolean(config)
  const [values, setValues] = useState<CategoryInput>(() =>
    config
      ? {
          name: collectionName(config, 'en'),
          nameAr: collectionName(config, 'ar'),
          type: config.type,
          image: categoryImage(config),
        }
      : { name: '', nameAr: '', type: '', image: '' }
  )
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryInput, string>>>({})
  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again after replacing
    if (!file) return
    if (!CATEGORY_IMAGE_TYPES.includes(file.type)) {
      setErrors((er) => ({ ...er, image: 'Use a PNG, JPG, WebP or SVG image.' }))
      return
    }
    if (file.size > CATEGORY_IMAGE_MAX_BYTES) {
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
    const errs = validateCategory(values, config ?? undefined)
    setErrors(errs)
    const firstInvalid = (['name', 'nameAr', 'type'] as const).find((k) => errs[k])
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    const name = values.name.trim()
    commit(
      () => {
        if (config) updateCategory(config, values)
        else createCategory(values)
      },
      config ? `Category “${name}” updated.` : `Category “${name}” added.`
    )
    onDone()
  }

  const fieldError = (key: keyof CategoryInput) =>
    errors[key] ? (
      <span id={`category-${key}-error`} className="adm-field-error" role="alert">
        {errors[key]}
      </span>
    ) : null
  const invalid = (key: keyof CategoryInput) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `category-${key}-error` : undefined,
  })

  return (
    <form onSubmit={submit} noValidate>
      <div className="adm-form-grid">
        <label className="adm-field">
          <span className="adm-label">
            Category Name (English) <span className="adm-required" aria-hidden="true">*</span>
          </span>
          <input
            className="adm-input"
            name="name"
            value={values.name}
            data-autofocus
            maxLength={CATEGORY_NAME_MAX}
            placeholder="e.g. Away Kits"
            autoComplete="off"
            required
            onChange={(e) => set('name', e.target.value)}
            {...invalid('name')}
          />
          {fieldError('name')}
        </label>

        <label className="adm-field">
          <span className="adm-label">
            Category Name (Arabic) <span className="adm-required" aria-hidden="true">*</span>
          </span>
          <input
            className="adm-input"
            name="nameAr"
            dir="rtl"
            lang="ar"
            value={values.nameAr}
            maxLength={CATEGORY_NAME_MAX}
            placeholder="مثال: أطقم خارج الأرض"
            autoComplete="off"
            required
            onChange={(e) => set('nameAr', e.target.value)}
            {...invalid('nameAr')}
          />
          {fieldError('nameAr')}
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
            onChange={(e) => set('type', e.target.value as CategoryInput['type'])}
            {...invalid('type')}
          >
            <option value="" disabled>
              Select a type
            </option>
            <option value="shoe">{typeLabel('shoe')}</option>
            <option value="jersey">{typeLabel('jersey')}</option>
          </select>
          {fieldError('type')}
        </label>

        <div className="adm-field adm-field--full">
          <span className="adm-label" id="category-image-label">
            Category Image
          </span>
          <div className="adm-category-image-row">
            <div className="adm-category-image-preview">
              {values.image ? (
                <img src={values.image} alt="Selected category image preview" />
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
                    accept={CATEGORY_IMAGE_TYPES.join(',')}
                    onChange={onImage}
                    className="adm-sr-only"
                    aria-labelledby="category-image-label"
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
          {editing ? 'Save Category' : 'Add Category'}
        </button>
      </div>
    </form>
  )
}
