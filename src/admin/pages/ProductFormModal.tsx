import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Product } from '../../shared/types/product'
import { Dialog } from '../components/Dialog'
import { ImagePicker } from '../components/ImagePicker'
import { Toggle } from '../components/Toggle'
import { useAdminData } from '../context/AdminDataContext'
import {
  productBadgeNames,
  categoriesFor,
  createProduct,
  emptyFormValues,
  toFormValues,
  updateProduct,
  validateProduct,
} from '../services/productAdminService'
import type { ProductFormValues } from '../services/productAdminService'
import { listKnownImages } from '../services/assetService'

interface Props {
  open: boolean
  /** Product to edit; null to create a new one. */
  product: Product | null
  onClose: () => void
}

export function ProductFormModal({ open, product, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={product ? 'Edit product' : 'Add product'}
      subtitle={product ? product.name : 'Adds to the live catalog for this session'}
    >
      {open && <ProductForm key={product?.id ?? 'new'} product={product} onDone={onClose} />}
    </Dialog>
  )
}

function ProductForm({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const { commit } = useAdminData()
  const [values, setValues] = useState<ProductFormValues>(() =>
    product ? toFormValues(product) : emptyFormValues('jersey')
  )
  const [errors, setErrors] = useState<string[]>([])
  const images = useMemo(() => listKnownImages('products'), [])
  const categories = useMemo(() => {
    const list = categoriesFor(values.type)
    return list.includes(values.category) || !values.category ? list : [values.category, ...list]
  }, [values.type, values.category])

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const errs = validateProduct(values, product ?? undefined)
    setErrors(errs)
    if (errs.length) return
    if (product) {
      commit(() => updateProduct(product, values), `Saved “${values.name.trim()}”.`)
    } else {
      commit(() => {
        createProduct(values)
      }, `Added “${values.name.trim()}” to the catalog for this session.`)
    }
    onDone()
  }

  const numberValue = (raw: string): number => (raw === '' ? NaN : Number(raw))

  return (
    <form id="adm-product-form" onSubmit={submit} noValidate>
      {errors.length > 0 && (
        <div className="adm-form-errors" role="alert" style={{ marginBottom: 16 }}>
          Please fix the following:
          <ul>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="adm-form-grid">
        <label className="adm-field">
          <span className="adm-label">Product type</span>
          <select
            className="adm-select"
            value={values.type}
            disabled={Boolean(product)}
            onChange={(e) => {
              const type = e.target.value as 'jersey' | 'shoe'
              setValues((v) => ({ ...v, type, category: categoriesFor(type)[0] ?? '' }))
            }}
          >
            <option value="jersey">Jersey</option>
            <option value="shoe">Shoe</option>
          </select>
          {product && <span className="adm-hint">Type cannot be changed after creation.</span>}
        </label>

        <label className="adm-field">
          <span className="adm-label">Category</span>
          <select className="adm-select" value={values.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="adm-field adm-field--full">
          <span className="adm-label">Product name</span>
          <input
            className="adm-input"
            value={values.name}
            data-autofocus
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </label>

        <label className="adm-field">
          <span className="adm-label">SKU</span>
          <input className="adm-input adm-mono" value={values.sku} onChange={(e) => set('sku', e.target.value)} />
        </label>

        <label className="adm-field">
          <span className="adm-label">{values.type === 'jersey' ? 'Team' : 'Brand'}</span>
          <input className="adm-input" value={values.brandOrTeam} onChange={(e) => set('brandOrTeam', e.target.value)} />
        </label>

        <label className="adm-field">
          <span className="adm-label">Price (QAR)</span>
          <input
            className="adm-input adm-num"
            type="number"
            min={0}
            step="0.01"
            value={Number.isNaN(values.price) ? '' : values.price}
            onChange={(e) => set('price', numberValue(e.target.value))}
          />
        </label>

        <label className="adm-field">
          <span className="adm-label">Compare-at price (QAR)</span>
          <input
            className="adm-input adm-num"
            type="number"
            min={0}
            step="0.01"
            placeholder="Optional"
            value={values.originalPrice ?? ''}
            onChange={(e) => set('originalPrice', e.target.value === '' ? null : Number(e.target.value))}
          />
        </label>

        <label className="adm-field">
          <span className="adm-label">{values.type === 'jersey' ? 'Material' : 'Upper material'}</span>
          <input className="adm-input" value={values.material} onChange={(e) => set('material', e.target.value)} />
        </label>

        <div className="adm-field adm-field--full">
          <span className="adm-label">Badges</span>
          <div className="adm-checkbox-row">
            {productBadgeNames().map((b) => (
              <label key={b} className="adm-chip-check">
                <input
                  type="checkbox"
                  checked={values.badges.includes(b)}
                  onChange={(e) =>
                    set('badges', e.target.checked ? [...values.badges, b] : values.badges.filter((x) => x !== b))
                  }
                />
                {b}
              </label>
            ))}
          </div>
        </div>

        <div className="adm-field adm-field--full">
          <Toggle checked={values.featured} onChange={(v) => set('featured', v)} label="Featured product" />
        </div>

        <label className="adm-field adm-field--full">
          <span className="adm-label">Description</span>
          <textarea
            className="adm-textarea"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <div className="adm-field--full" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16 }}>
          {values.image ? (
            <img src={values.image} alt="Selected product" className="adm-image-preview adm-image-preview--square" />
          ) : (
            <div className="adm-image-preview adm-image-preview--square" aria-hidden="true" />
          )}
          <ImagePicker
            label="Product image (existing assets)"
            value={values.image}
            onChange={(p) => set('image', p)}
            options={images}
          />
        </div>
      </div>

      <div className="adm-dialog__footer" style={{ margin: '20px -24px -20px' }}>
        <button type="button" className="adm-btn" onClick={onDone}>
          Cancel
        </button>
        <button type="submit" className="adm-btn adm-btn--primary">
          {product ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  )
}
