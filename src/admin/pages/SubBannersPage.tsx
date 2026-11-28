import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ImagePlus, Images, Pencil, Plus, Trash, Upload } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { DataTable } from '../components/DataTable'
import type { Column } from '../utils/table'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/StatusBadge'
import { Toggle } from '../components/Toggle'
import { useAdminData } from '../context/AdminDataContext'
import { usePagination } from '../hooks/usePagination'
import {
  SUB_BANNER_TYPE_LABEL,
  SUB_BANNER_TYPE_OPTIONS,
  HOME_PLACEMENTS,
  createSubBanner,
  deleteSubBanner,
  heroCategoryOptions,
  listSubBanners,
  setSubBannerActive,
  subBannerValues,
  updateSubBanner,
  validateSubBanner,
} from '../services/bannerAdminService'
import type { SubBannerInput, SubBannerView } from '../services/bannerAdminService'
import './pages.css'
import './SubBannersPage.css'

const SUB_BANNERS_PER_PAGE = 10

export function SubBannersPage() {
  const { commit } = useAdminData()
  const [form, setForm] = useState<{ open: boolean; row: SubBannerView | null }>({ open: false, row: null })
  const [confirm, setConfirm] = useState<SubBannerView | null>(null)

  const rows = listSubBanners()
  const pagination = usePagination(rows, SUB_BANNERS_PER_PAGE)

  const columns: Column<SubBannerView>[] = [
    {
      key: 'image',
      header: 'Image',
      render: (r) => (
        <span className="adm-sub-thumb">
          <img src={r.image} alt={r.name} loading="lazy" />
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <Badge tone="neutral">{SUB_BANNER_TYPE_LABEL[r.type]}</Badge>,
      sortValue: (r) => SUB_BANNER_TYPE_LABEL[r.type],
    },
    {
      key: 'active',
      header: 'Active',
      render: (r) => (
        <div className="adm-sub-status">
          <Toggle
            checked={r.active}
            onChange={(v) =>
              commit(
                () => setSubBannerActive(r, v),
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
        title="Sub Banners"
        subtitle="Category banners in the sub banner sections of the Home, Jerseys and Shoes pages."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setForm({ open: true, row: null })}>
            <Plus size={16} aria-hidden="true" /> Add Sub Banner
          </button>
        }
      />

      <Card flush>
        <DataTable
          caption="Sub banners"
          columns={columns}
          rows={pagination.pageItems}
          rowKey={(r) => r.key}
          empty={<EmptyState icon={Images} title="No sub banners" text="Add a sub banner to show it on the storefront." />}
        />
        <Pagination state={pagination} noun="banners" showPageSize={false} showPageCount />
      </Card>

      <Dialog
        open={form.open}
        onClose={() => setForm({ open: false, row: null })}
        title={form.row ? 'Edit Sub Banner' : 'Add Sub Banner'}
        subtitle={form.row ? form.row.name : 'Shown in its section while active'}
      >
        {form.open && (
          <SubBannerForm key={form.row?.key ?? 'new'} row={form.row} onDone={() => setForm({ open: false, row: null })} />
        )}
      </Dialog>

      <Dialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        size="sm"
        title="Delete sub banner?"
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
                commit(() => deleteSubBanner(confirm), `Sub banner “${name}” deleted.`)
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
            Delete the {SUB_BANNER_TYPE_LABEL[confirm.type]} banner{' '}
            <strong style={{ color: 'var(--adm-text)' }}>“{confirm.name}”</strong>? It will be removed from the storefront.
          </p>
        )}
      </Dialog>
    </div>
  )
}

const SUB_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const SUB_IMAGE_MAX_BYTES = 2 * 1024 * 1024

/** Add / Edit Sub Banner form: Type, Category, Image. The storefront shows the category's name on the banner. */
function SubBannerForm({ row, onDone }: { row: SubBannerView | null; onDone: () => void }) {
  const { commit } = useAdminData()
  const [values, setValues] = useState<SubBannerInput>(() =>
    row ? subBannerValues(row) : { type: '', homePlacement: '', category: '', image: '' }
  )
  const [errors, setErrors] = useState<Partial<Record<keyof SubBannerInput, string>>>({})
  const categoryOptions = heroCategoryOptions()
  const set = <K extends keyof SubBannerInput>(key: K, value: SubBannerInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  /** Changing the type clears Home Placement unless the type is home. */
  const chooseType = (type: SubBannerInput['type']) => {
    setValues((v) => ({ ...v, type, homePlacement: type === 'home' ? v.homePlacement : '' }))
    setErrors((e) => ({ ...e, type: undefined, homePlacement: undefined }))
  }

  const onImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow choosing the same file again after replacing
    if (!file) return
    if (!SUB_IMAGE_TYPES.includes(file.type)) {
      setErrors((er) => ({ ...er, image: 'Use a PNG, JPG or WebP image.' }))
      return
    }
    if (file.size > SUB_IMAGE_MAX_BYTES) {
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
    const errs = validateSubBanner(values)
    setErrors(errs)
    const firstInvalid = (['type', 'homePlacement', 'category', 'image'] as const).find((k) => errs[k])
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    const name = categoryOptions.find((o) => o.value === values.category)?.label ?? values.category
    commit(
      () => {
        if (row) updateSubBanner(row, values)
        else createSubBanner(values)
      },
      row ? `Sub banner “${name}” updated.` : `Sub banner “${name}” added.`
    )
    onDone()
  }

  const fieldError = (key: keyof SubBannerInput) =>
    errors[key] ? (
      <span id={`sub-${key}-error`} className="adm-field-error" role="alert">
        {errors[key]}
      </span>
    ) : null
  const invalid = (key: keyof SubBannerInput) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `sub-${key}-error` : undefined,
  })
  const required = <span className="adm-required" aria-hidden="true">*</span>

  return (
    <form onSubmit={submit} noValidate>
      <div className="adm-form-grid">
        <label className="adm-field adm-field--full">
          <span className="adm-label">Type {required}</span>
          <select
            className="adm-select"
            name="type"
            value={values.type}
            data-autofocus
            onChange={(e) => chooseType(e.target.value as SubBannerInput['type'])}
            {...invalid('type')}
          >
            <option value="" disabled>
              Select a type
            </option>
            {SUB_BANNER_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {fieldError('type')}
        </label>

        {values.type === 'home' && (
          <label className="adm-field adm-field--full">
            <span className="adm-label">Home Placement {required}</span>
            <select
              className="adm-select"
              name="homePlacement"
              value={values.homePlacement}
              onChange={(e) => set('homePlacement', e.target.value as SubBannerInput['homePlacement'])}
              {...invalid('homePlacement')}
            >
              <option value="" disabled>
                Select a section
              </option>
              {HOME_PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {fieldError('homePlacement') ?? <span className="adm-hint">The Home page section this banner appears in.</span>}
          </label>
        )}

        <label className="adm-field adm-field--full">
          <span className="adm-label">Select Category {required}</span>
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
            <span className="adm-hint">The category’s name is shown on the banner, and clicking it opens the category’s page.</span>
          )}
        </label>

        <div className="adm-field adm-field--full">
          <span className="adm-label" id="sub-image-label">
            Image {required}
          </span>
          <div className="adm-sub-image-preview">
            {values.image ? <img src={values.image} alt="Selected banner image preview" /> : <ImagePlus size={24} aria-hidden="true" />}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <label className="adm-btn adm-btn--sm">
              <Upload size={14} aria-hidden="true" /> {values.image ? 'Replace image' : 'Choose image'}
              <input
                type="file"
                name="image"
                accept={SUB_IMAGE_TYPES.join(',')}
                onChange={onImage}
                className="adm-sr-only"
                aria-labelledby="sub-image-label"
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
          {row ? 'Save Sub Banner' : 'Add Sub Banner'}
        </button>
      </div>
    </form>
  )
}
