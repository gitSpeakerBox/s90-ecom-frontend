import { useId, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Trash2, Upload } from 'lucide-react'
import type { Product, ProductType } from '../../shared/types/product'
import { Dialog } from '../components/Dialog'
import { Toggle } from '../components/Toggle'
import { useAdminData } from '../context/AdminDataContext'
import {
  MAX_PRODUCT_IMAGES,
  PRODUCT_NAME_MAX,
  PRODUCT_TYPE_OPTIONS,
  SIZE_OPTIONS,
  createProduct,
  emptyFormValues,
  extraBadgeNames,
  hasProductErrors,
  normalBadgeOptions,
  productCategoryOptions,
  sponsorBadgeOptions,
  toFormValues,
  updateProduct,
  validateProduct,
  valuesForType,
} from '../services/productAdminService'
import type { ProductFormErrors, ProductFormValues } from '../services/productAdminService'
import './ProductFormModal.css'

interface Props {
  open: boolean
  /** Product to edit; null to create a new one. */
  product: Product | null
  onClose: () => void
}

export function ProductFormModal({ open, product, onClose }: Props) {
  const formId = useId()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={product ? 'Edit product' : 'Add product'}
      subtitle={product ? product.name : 'Adds to the live catalog for this session'}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={formId} className="adm-btn adm-btn--primary">
            {product ? 'Save changes' : 'Add product'}
          </button>
        </>
      }
    >
      {open && <ProductForm key={product?.id ?? 'new'} formId={formId} product={product} onDone={onClose} />}
    </Dialog>
  )
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const IMAGE_MAX_BYTES = 2 * 1024 * 1024

function readImage(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) return Promise.reject(new Error(`“${file.name}” isn’t a PNG, JPG or WebP image.`))
  if (file.size > IMAGE_MAX_BYTES) return Promise.reject(new Error(`“${file.name}” is larger than 2 MB.`))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Could not read “${file.name}”.`))
    reader.readAsDataURL(file)
  })
}

const FIELD_ORDER: (keyof ProductFormValues)[] = [
  'name',
  'nameAr',
  'type',
  'category',
  'price',
  'description',
  'descriptionAr',
  'sizes',
  'images',
  'badge',
  'sponsorBadge',
  'shortsPrice',
]

function ProductForm({ formId, product, onDone }: { formId: string; product: Product | null; onDone: () => void }) {
  const { commit } = useAdminData()
  const [values, setValues] = useState<ProductFormValues>(() => (product ? toFormValues(product) : emptyFormValues()))
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const extraBadges = useMemo(() => (product ? extraBadgeNames(product) : []), [product])
  const categories = productCategoryOptions(values.type)
  const badges = normalBadgeOptions()
  const sponsors = sponsorBadgeOptions()
  const sponsor = sponsors.find((s) => s.id === values.sponsorBadge)
  const isJersey = values.type === 'jersey'

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const chooseType = (type: ProductType | '') => {
    setValues((v) => valuesForType(v, type))
    setErrors((e) => ({ ...e, type: undefined, category: undefined, sizes: undefined, shortsPrice: undefined }))
  }

  /* Sizes */
  const toggleSize = (size: string, offered: boolean) => {
    setValues((v) => ({
      ...v,
      sizes: offered ? [...v.sizes, size] : v.sizes.filter((s) => s !== size),
      unavailableSizes: v.unavailableSizes.filter((s) => s !== size),
    }))
    setErrors((e) => ({ ...e, sizes: undefined }))
  }
  const setSizeAvailable = (size: string, available: boolean) => {
    setValues((v) => ({
      ...v,
      unavailableSizes: available ? v.unavailableSizes.filter((s) => s !== size) : [...v.unavailableSizes, size],
    }))
    setErrors((e) => ({ ...e, sizes: undefined }))
  }

  /* Images */
  const addImages = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    const room = MAX_PRODUCT_IMAGES - values.images.length
    const results = await Promise.allSettled(files.slice(0, Math.max(0, room)).map(readImage))
    const added = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
    const problems = results.flatMap((r) => (r.status === 'rejected' ? [(r.reason as Error).message] : []))
    if (files.length > room) problems.push(`Only ${MAX_PRODUCT_IMAGES} images are allowed; ${files.length - Math.max(0, room)} not added.`)
    setValues((v) => ({ ...v, images: [...v.images, ...added].slice(0, MAX_PRODUCT_IMAGES) }))
    setErrors((er) => ({ ...er, images: problems.length ? problems.join(' ') : undefined }))
  }
  const replaceImage = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const src = await readImage(file)
      setValues((v) => ({ ...v, images: v.images.map((img, i) => (i === index ? src : img)) }))
      setErrors((er) => ({ ...er, images: undefined }))
    } catch (err) {
      setErrors((er) => ({ ...er, images: (err as Error).message }))
    }
  }
  const moveImage = (index: number, delta: -1 | 1) =>
    setValues((v) => {
      const images = [...v.images]
      const [img] = images.splice(index, 1)
      images.splice(index + delta, 0, img)
      return { ...v, images }
    })
  const removeImage = (index: number) => setValues((v) => ({ ...v, images: v.images.filter((_, i) => i !== index) }))

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validateProduct(values)
    setErrors(errs)
    if (hasProductErrors(errs)) {
      const first = FIELD_ORDER.find((k) => errs[k])
      e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    const name = values.name.trim()
    if (product) commit(() => updateProduct(product, values), `Saved “${name}”.`)
    else
      commit(() => {
        createProduct(values)
      }, `Added “${name}” to the catalog for this session.`)
    onDone()
  }

  const err = (key: keyof ProductFormValues) =>
    errors[key] ? (
      <span id={`pf-${key}-error`} className="adm-field-error" role="alert">
        {errors[key]}
      </span>
    ) : null
  const aria = (key: keyof ProductFormValues) => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `pf-${key}-error` : undefined,
  })
  const req = (
    <span className="adm-required" aria-hidden="true">
      *
    </span>
  )

  return (
    <form id={formId} className="adm-pf" onSubmit={submit} noValidate>
      {/* 1. Product information */}
      <fieldset className="adm-pf-section">
        <legend className="adm-dialog-section__title">Product information</legend>
        <div className="adm-form-grid">
          <label className="adm-field">
            <span className="adm-label">Product Name (English) {req}</span>
            <input className="adm-input" name="name" value={values.name} maxLength={PRODUCT_NAME_MAX + 20} data-autofocus autoComplete="off" onChange={(e) => set('name', e.target.value)} {...aria('name')} />
            {err('name')}
          </label>
          <label className="adm-field">
            <span className="adm-label">Product Name (Arabic) {req}</span>
            <input className="adm-input" name="nameAr" dir="rtl" lang="ar" value={values.nameAr} maxLength={PRODUCT_NAME_MAX + 20} autoComplete="off" onChange={(e) => set('nameAr', e.target.value)} {...aria('nameAr')} />
            {err('nameAr')}
          </label>
          <label className="adm-field">
            <span className="adm-label">Product Type {req}</span>
            <select className="adm-select" name="type" value={values.type} onChange={(e) => chooseType(e.target.value as ProductType | '')} {...aria('type')}>
              <option value="" disabled>
                Select a type
              </option>
              {PRODUCT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {err('type')}
          </label>
          <label className="adm-field">
            <span className="adm-label">Category {req}</span>
            <select className="adm-select" name="category" value={values.category} disabled={!values.type} onChange={(e) => set('category', e.target.value)} {...aria('category')}>
              <option value="" disabled>
                {values.type ? 'Select a category' : 'Choose a type first'}
              </option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                  {c.active ? '' : ' — inactive'}
                </option>
              ))}
            </select>
            {err('category')}
          </label>
          <label className="adm-field">
            <span className="adm-label">Price (QAR) {req}</span>
            <input className="adm-input adm-num" name="price" inputMode="decimal" placeholder="0.00" value={values.price} autoComplete="off" onChange={(e) => set('price', e.target.value)} {...aria('price')} />
            {err('price')}
          </label>
          <span aria-hidden="true" />
          <label className="adm-field adm-field--full">
            <span className="adm-label">Description (English)</span>
            <textarea className="adm-textarea" name="description" rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} {...aria('description')} />
            {err('description')}
          </label>
          <label className="adm-field adm-field--full">
            <span className="adm-label">Description (Arabic)</span>
            <textarea className="adm-textarea" name="descriptionAr" dir="rtl" lang="ar" rows={3} value={values.descriptionAr} onChange={(e) => set('descriptionAr', e.target.value)} {...aria('descriptionAr')} />
            {err('descriptionAr')}
          </label>
        </div>
      </fieldset>

      {/* 2. Sizes */}
      <fieldset className="adm-pf-section" aria-describedby={errors.sizes ? 'pf-sizes-error' : 'pf-sizes-hint'}>
        <legend className="adm-dialog-section__title">Size availability {req}</legend>
        {values.type ? (
          <>
            <p id="pf-sizes-hint" className="adm-hint adm-pf-intro">
              Tick the sizes this product comes in. A size marked unavailable is shown crossed out on the storefront and customers can’t select it. Stock is unlimited.
            </p>
            <ul className="adm-pf-sizes">
              {SIZE_OPTIONS[values.type].map((size) => {
                const offered = values.sizes.includes(size)
                const available = offered && !values.unavailableSizes.includes(size)
                return (
                  <li key={size} className={`adm-pf-size${offered ? ' is-offered' : ''}${offered && !available ? ' is-unavailable' : ''}`} data-size={size}>
                    <label className="adm-pf-size__check">
                      <input type="checkbox" name="sizes" checked={offered} onChange={(e) => toggleSize(size, e.target.checked)} aria-invalid={Boolean(errors.sizes) || undefined} />
                      <span>{size}</span>
                    </label>
                    {offered && (
                      <button type="button" className="adm-pf-size__state" aria-pressed={!available} aria-label={`Size ${size}: ${available ? 'available' : 'unavailable'} — mark ${available ? 'unavailable' : 'available'}`} onClick={() => setSizeAvailable(size, !available)}>
                        {available ? 'Available' : 'Unavailable'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="adm-hint adm-pf-intro">Choose the product type to see its sizes.</p>
        )}
        {err('sizes')}
      </fieldset>

      {/* 3. Images */}
      <fieldset className="adm-pf-section">
        <legend className="adm-dialog-section__title">Product images {req}</legend>
        <p className="adm-hint adm-pf-intro">The first image is the main image. Use the arrows to change the order.</p>
        {values.images.length > 0 && (
          <ol className="adm-pf-images">
            {values.images.map((src, i) => (
              <li key={`${i}-${src.slice(-24)}`} className="adm-pf-image">
                <img src={src} alt={`Product image ${i + 1}`} />
                <span className="adm-pf-image__tag">{i === 0 ? 'Main' : i + 1}</span>
                <div className="adm-pf-image__actions">
                  <button type="button" className="adm-icon-btn" aria-label={`Move image ${i + 1} left`} disabled={i === 0} onClick={() => moveImage(i, -1)}>
                    <ArrowLeft size={14} />
                  </button>
                  <button type="button" className="adm-icon-btn" aria-label={`Move image ${i + 1} right`} disabled={i === values.images.length - 1} onClick={() => moveImage(i, 1)}>
                    <ArrowRight size={14} />
                  </button>
                  <label className="adm-icon-btn" title="Replace">
                    <RefreshCw size={14} aria-hidden="true" />
                    <input type="file" accept={IMAGE_TYPES.join(',')} className="adm-sr-only" aria-label={`Replace image ${i + 1}`} onChange={(e) => void replaceImage(i, e)} />
                  </label>
                  <button type="button" className="adm-icon-btn adm-pf-image__remove" aria-label={`Remove image ${i + 1}`} onClick={() => removeImage(i)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="adm-pf-upload">
          <label className={`adm-btn adm-btn--sm${values.images.length >= MAX_PRODUCT_IMAGES ? ' is-disabled' : ''}`}>
            {values.images.length ? <Upload size={14} aria-hidden="true" /> : <ImagePlus size={14} aria-hidden="true" />} {values.images.length ? 'Add more images' : 'Upload images'}
            <input type="file" name="images" multiple accept={IMAGE_TYPES.join(',')} className="adm-sr-only" disabled={values.images.length >= MAX_PRODUCT_IMAGES} onChange={(e) => void addImages(e)} aria-describedby={errors.images ? 'pf-images-error' : undefined} />
          </label>
          <span className="adm-hint">
            PNG, JPG or WebP, up to 2 MB each · {values.images.length}/{MAX_PRODUCT_IMAGES} images. Kept for this session only.
          </span>
        </div>
        {err('images')}
      </fieldset>

      {/* 4. Badges */}
      <fieldset className="adm-pf-section">
        <legend className="adm-dialog-section__title">Badges</legend>
        <div className="adm-form-grid">
          <label className="adm-field">
            <span className="adm-label">Badge</span>
            <select className="adm-select" name="badge" value={values.badge} onChange={(e) => set('badge', e.target.value)} {...aria('badge')}>
              <option value="">No badge</option>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.active ? '' : ' — inactive'}
                </option>
              ))}
            </select>
            {err('badge')}
          </label>
          <label className="adm-field">
            <span className="adm-label">Sponsor Badge</span>
            <span className="adm-pf-sponsor">
              {sponsor?.image && <img src={sponsor.image} alt="" className="adm-pf-sponsor__logo" />}
              <select className="adm-select" name="sponsorBadge" value={values.sponsorBadge} onChange={(e) => set('sponsorBadge', e.target.value)} {...aria('sponsorBadge')}>
                <option value="">No sponsor badge</option>
                {sponsors.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.active ? '' : ' — inactive'}
                  </option>
                ))}
              </select>
            </span>
            {sponsors.length === 0 && <span className="adm-hint">No Sponsor Badges yet — add them in Admin › Badges.</span>}
            {err('sponsorBadge')}
          </label>
        </div>
        {extraBadges.length > 0 && (
          <p className="adm-hint adm-pf-note" role="note">
            This product also has {extraBadges.map((b) => `“${b}”`).join(', ')}. Saving keeps only the Badge and Sponsor Badge selected above.
          </p>
        )}
      </fieldset>

      {/* 5–6. Jersey options */}
      {isJersey && (
        <fieldset className="adm-pf-section">
          <legend className="adm-dialog-section__title">Jersey options</legend>
          <div className="adm-pf-option">
            <Toggle checked={values.nameNumber} onChange={(on) => set('nameNumber', on)} label="Allow Name & Number Customization" />
            <span className="adm-hint">{values.nameNumber ? 'Customers can add a name and number on the product page.' : 'Name and number fields are hidden on the product page.'}</span>
          </div>
          <div className="adm-pf-option">
            <Toggle
              checked={values.shorts}
              onChange={(on) => {
                set('shorts', on)
                setErrors((e) => ({ ...e, shortsPrice: undefined }))
              }}
              label="Add Shorts"
            />
            <span className="adm-hint">{values.shorts ? 'Customers can add matching shorts; the price is added only when they choose them.' : 'The shorts option is hidden on the product page.'}</span>
            {values.shorts && (
              <label className="adm-field adm-pf-shorts">
                <span className="adm-label">Shorts Price (QAR) {req}</span>
                <input className="adm-input adm-num" name="shortsPrice" inputMode="decimal" placeholder="0.00" value={values.shortsPrice} autoComplete="off" onChange={(e) => set('shortsPrice', e.target.value)} {...aria('shortsPrice')} />
                {err('shortsPrice')}
              </label>
            )}
          </div>
        </fieldset>
      )}
    </form>
  )
}
