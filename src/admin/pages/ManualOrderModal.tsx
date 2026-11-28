import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CircleAlert, LoaderCircle, Minus, PackageSearch, Plus, Search, Trash } from 'lucide-react'
import type { Order } from '../../shared/types/order'
import { Dialog } from '../components/Dialog'
import { useAdminData } from '../context/AdminDataContext'
import {
  MAX_QUANTITY,
  PAYMENT_METHODS,
  countryOptions,
  findCoupon,
  findOrderableProduct,
  hasErrors,
  jerseyBadgeOptions,
  manualOrderTotals,
  newLine,
  placeManualOrder,
  priceLine,
  regionsFor,
  phoneCountryCodeOf,
  phoneHint,
  validateManualPhone,
  searchProducts,
  validateManualOrder,
} from '../services/manualOrderService'
import type {
  ManualOrderCustomer,
  ManualOrderErrors,
  ManualOrderLine,
  ManualPaymentMethod,
  PricedLine,
} from '../services/manualOrderService'
import { JERSEY_OPTION_PRICES } from '../../user/constants/jerseyOptions'
import { selectableSizes, shortsOptionFor } from '../../shared/services/productOptions'
import { money } from '../utils/format'
import './ManualOrderModal.css'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (order: Order) => void
}

/** "+ Manual Order" modal (Admin › Orders). Mounted fresh each time it opens. */
export function ManualOrderModal({ open, onClose, onCreated }: Props) {
  if (!open) return null
  return <ManualOrderDialog onClose={onClose} onCreated={onCreated} />
}

const EMPTY_CUSTOMER: ManualOrderCustomer = { name: '', email: '', country: '', region: '', phoneCountry: '', phone: '', city: '', address: '', postalCode: '' }

function ManualOrderDialog({ onClose, onCreated }: Omit<Props, 'open'>) {
  const { commit } = useAdminData()
  const formId = useId()
  const [customer, setCustomer] = useState<ManualOrderCustomer>(EMPTY_CUSTOMER)
  const [lines, setLines] = useState<ManualOrderLine[]>([])
  const [payment, setPayment] = useState<ManualPaymentMethod | ''>('')
  const [couponCode, setCouponCode] = useState('')
  const [query, setQuery] = useState('')
  const [errors, setErrors] = useState<ManualOrderErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // Synchronous guard: extra clicks before React re-renders never start a second save.
  const inFlight = useRef(false)

  const coupon = couponCode.trim() ? findCoupon(couponCode) : null
  const priced = lines.map(priceLine).filter((p): p is PricedLine => p !== null)
  const totals = manualOrderTotals(lines, coupon)
  const results = searchProducts(query)

  const setField = <K extends keyof ManualOrderCustomer>(key: K, value: string) => {
    setCustomer((c) => ({ ...c, [key]: value, ...(key === 'country' ? { region: '' } : {}) }))
    setErrors((e) => ({ ...e, [key]: undefined, ...(key === 'country' ? { region: undefined } : {}) }))
  }
  /* Phone: the calling code follows Country, and an entered number is
     re-checked against the new country's rules straight away. */
  const setPhone = (patch: Partial<Pick<ManualOrderCustomer, 'country' | 'phoneCountry' | 'phone'>>, check: boolean) => {
    const next = { ...customer, ...patch }
    if ('country' in patch) {
      next.region = ''
      next.phoneCountry = phoneCountryCodeOf(next.country) || next.phoneCountry
    }
    setCustomer(next)
    setErrors((e) => ({
      ...e,
      ...('country' in patch ? { country: undefined, region: undefined } : {}),
      phone: check && next.phone.trim() ? validateManualPhone(next.phoneCountry, next.phone) : undefined,
    }))
  }
  const updateLine = (key: string, patch: Partial<ManualOrderLine>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
    setErrors((e) => ({ ...e, lines: e.lines ? { ...e.lines, [key]: '' } : undefined }))
  }
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const addProduct = (slug: string) => {
    const product = findOrderableProduct(slug)
    if (!product) return
    setLines((ls) => [...ls, newLine(product)])
    setErrors((e) => ({ ...e, products: undefined }))
    setQuery('')
  }

  const close = () => {
    if (!submitting) onClose()
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (inFlight.current) return // no duplicate submissions
    setSaveError(null)
    const input = { customer, lines, payment, couponCode }
    const errs = validateManualOrder(input)
    setErrors(errs)
    if (hasErrors(errs)) {
      const form = e.currentTarget
      const first = (['name', 'email', 'country', 'region', 'phone', 'city', 'address', 'postalCode'] as const).find((k) => errs[k])
      const badLine = Object.keys(errs.lines ?? {})[0]
      const target = first
        ? form.querySelector<HTMLElement>(`[name="${first === 'phone' && !customer.phoneCountry ? 'phoneCountry' : first}"]`)
        : errs.products
          ? form.querySelector<HTMLElement>('[name="productSearch"]')
          : badLine
            ? form.querySelector<HTMLElement>(`[data-line="${badLine}"] select, [data-line="${badLine}"] button`)
            : form.querySelector<HTMLElement>(errs.payment ? '[name="payment"]' : '[name="couponCode"]')
      target?.focus()
      return
    }
    inFlight.current = true
    setSubmitting(true)
    try {
      const order = await placeManualOrder(input)
      // Success is shown only now that the order is saved.
      commit(() => {}, 'Manual order created successfully!')
      onCreated(order)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'The order could not be created. Please try again.')
      setSubmitting(false)
      inFlight.current = false
    }
  }

  const err = (key: keyof ManualOrderCustomer | 'payment' | 'couponCode' | 'products') =>
    errors[key] ? (
      <span id={`mo-${key}-error`} className="adm-field-error" role="alert">
        {errors[key]}
      </span>
    ) : null
  const aria = (key: keyof ManualOrderCustomer | 'payment' | 'couponCode') => ({
    'aria-invalid': Boolean(errors[key]) || undefined,
    'aria-describedby': errors[key] ? `mo-${key}-error` : undefined,
  })
  const req = <span className="adm-required" aria-hidden="true">*</span>
  const regions = regionsFor(customer.country)

  return (
    <Dialog
      open
      onClose={close}
      title="Manual Order"
      subtitle="Create an order on behalf of a customer"
      footer={
        <div className="adm-mo-footer">
          {saveError && (
            <p className="adm-mo-save-error" role="alert">
              <CircleAlert size={16} aria-hidden="true" /> {saveError}
            </p>
          )}
          <span className="adm-mo-footer__total">
            Total <strong className="adm-num">{money(totals.finalTotal)}</strong>
          </span>
          <button type="button" className="adm-btn" onClick={close} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form={formId} className="adm-btn adm-btn--primary adm-mo-place" disabled={submitting} aria-busy={submitting}>
            {submitting ? (
              <>
                <LoaderCircle size={16} className="adm-mo-spin" aria-hidden="true" /> Placing order…
              </>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      }
    >
      <form id={formId} className="adm-mo" onSubmit={submit} noValidate>
        <fieldset className="adm-mo-section" disabled={submitting}>
          <legend className="adm-dialog-section__title">Customer information</legend>
          <div className="adm-form-grid">
            <label className="adm-field">
              <span className="adm-label">Customer Name {req}</span>
              <input className="adm-input" name="name" value={customer.name} data-autofocus autoComplete="off" onChange={(e) => setField('name', e.target.value)} {...aria('name')} />
              {err('name')}
            </label>
            <label className="adm-field">
              <span className="adm-label">Email {req}</span>
              <input className="adm-input" name="email" type="email" value={customer.email} autoComplete="off" onChange={(e) => setField('email', e.target.value)} {...aria('email')} />
              {err('email')}
            </label>
            <label className="adm-field">
              <span className="adm-label">Country {req}</span>
              <select className="adm-select" name="country" value={customer.country} onChange={(e) => setPhone({ country: e.target.value }, true)} {...aria('country')}>
                <option value="" disabled>
                  Select a country
                </option>
                {countryOptions().map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err('country')}
            </label>
            <label className="adm-field">
              <span className="adm-label">Region / State {req}</span>
              <select className="adm-select" name="region" value={customer.region} disabled={!regions.length} onChange={(e) => setField('region', e.target.value)} {...aria('region')}>
                <option value="" disabled>
                  {customer.country ? 'Select a region' : 'Choose a country first'}
                </option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {err('region')}
            </label>
            <div className="adm-field adm-field--full">
              <span className="adm-label" id={`${formId}-phone`}>
                Phone Number {req}
              </span>
              <div className={`adm-mo-phone${errors.phone ? ' adm-mo-phone--invalid' : ''}`} role="group" aria-labelledby={`${formId}-phone`}>
                <select
                  className="adm-select adm-mo-phone__code"
                  name="phoneCountry"
                  aria-label="Country calling code"
                  value={customer.phoneCountry}
                  onChange={(e) => setPhone({ phoneCountry: e.target.value }, true)}
                >
                  <option value="" disabled>
                    Code
                  </option>
                  {countryOptions()
                    .filter((c) => c.dialCode)
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.dialCode}
                      </option>
                    ))}
                </select>
                <input
                  className="adm-input"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  value={customer.phone}
                  autoComplete="off"
                  aria-labelledby={`${formId}-phone`}
                  placeholder={customer.phoneCountry ? phoneHint(customer.phoneCountry).split(': ')[1] : 'Choose a country or calling code'}
                  onChange={(e) => setPhone({ phone: e.target.value }, Boolean(errors.phone))}
                  onBlur={() => setPhone({}, true)}
                  {...aria('phone')}
                />
              </div>
              {errors.phone ? err('phone') : customer.phoneCountry ? <span className="adm-hint">{phoneHint(customer.phoneCountry)}</span> : null}
            </div>
            <label className="adm-field">
              <span className="adm-label">City {req}</span>
              <input className="adm-input" name="city" value={customer.city} autoComplete="off" onChange={(e) => setField('city', e.target.value)} {...aria('city')} />
              {err('city')}
            </label>
            <label className="adm-field">
              <span className="adm-label">Postal Code {req}</span>
              <input className="adm-input" name="postalCode" value={customer.postalCode} autoComplete="off" onChange={(e) => setField('postalCode', e.target.value)} {...aria('postalCode')} />
              {err('postalCode')}
            </label>
            <label className="adm-field adm-field--full">
              <span className="adm-label">Address {req}</span>
              <input className="adm-input" name="address" value={customer.address} placeholder="Street, building, apartment" autoComplete="off" onChange={(e) => setField('address', e.target.value)} {...aria('address')} />
              {err('address')}
            </label>
          </div>
        </fieldset>

        <fieldset className="adm-mo-section" disabled={submitting}>
          <legend className="adm-dialog-section__title">Products</legend>
          <div className="adm-mo-search">
            <span className="adm-search">
              <Search size={16} aria-hidden="true" />
              <input
                className="adm-input"
                name="productSearch"
                type="search"
                value={query}
                placeholder="Search products by name…"
                aria-label="Search products by name"
                aria-describedby={errors.products ? 'mo-products-error' : undefined}
                autoComplete="off"
                onChange={(e) => setQuery(e.target.value)}
              />
            </span>
            {query.trim() && (
              <ul className="adm-mo-results" aria-label="Matching products">
                {results.length === 0 && (
                  <li className="adm-mo-results__empty">
                    <PackageSearch size={16} aria-hidden="true" /> No products match “{query.trim()}”.
                  </li>
                )}
                {results.map((p) => (
                  <li key={p.slug}>
                    <button type="button" className="adm-mo-result" onClick={() => addProduct(p.slug)}>
                      <img src={p.images[0]} alt="" />
                      <span className="adm-mo-result__name">
                        {p.name}
                        <span className="adm-cell-secondary">
                          {p.productType === 'jersey' ? 'Jersey' : 'Shoes'} · {p.brandOrTeam}
                        </span>
                      </span>
                      <span className="adm-num adm-mo-result__price">{money(p.price)}</span>
                      <span className="adm-mo-result__add" aria-hidden="true">
                        <Plus size={14} /> Add
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {err('products')}

          {lines.length > 0 && (
            <ul className="adm-mo-lines" aria-label="Selected products">
              {lines.map((line) => {
                const p = priceLine(line)
                const remove = () => setLines((ls) => ls.filter((l) => l.key !== line.key))
                return p ? (
                  <LineEditor
                    key={line.key}
                    priced={p}
                    error={errors.lines?.[line.key]}
                    onChange={(patch) => updateLine(line.key, patch)}
                    onRemove={remove}
                    toggle={toggle}
                  />
                ) : (
                  // The product was blocked / removed after it was added.
                  <li key={line.key} className="adm-mo-line adm-mo-line--gone" data-line={line.key}>
                    <span className="adm-field-error" role="alert">
                      A selected product is no longer available. Remove it to continue.
                    </span>
                    <button type="button" className="adm-btn adm-btn--sm" onClick={remove}>
                      <Trash size={14} aria-hidden="true" /> Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        <fieldset className="adm-mo-section" disabled={submitting}>
          <legend className="adm-dialog-section__title">Payment & discount</legend>
          <div className="adm-form-grid">
            <label className="adm-field">
              <span className="adm-label">Payment Method {req}</span>
              <select
                className="adm-select"
                name="payment"
                value={payment}
                onChange={(e) => {
                  setPayment(e.target.value as ManualPaymentMethod)
                  setErrors((x) => ({ ...x, payment: undefined }))
                }}
                {...aria('payment')}
              >
                <option value="" disabled>
                  Select a payment method
                </option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {err('payment')}
            </label>
            <label className="adm-field">
              <span className="adm-label">Coupon Code</span>
              <input
                className="adm-input"
                name="couponCode"
                value={couponCode}
                placeholder="Optional"
                autoComplete="off"
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  setErrors((x) => ({ ...x, couponCode: undefined }))
                }}
                {...aria('couponCode')}
              />
              {err('couponCode') ??
                (coupon ? <span className="adm-hint">{coupon.code}: {coupon.discountPercent}% off the subtotal</span> : null)}
            </label>
          </div>
        </fieldset>

        <section className="adm-mo-section" aria-label="Order summary">
          <h3 className="adm-dialog-section__title">Order summary</h3>
          {priced.length === 0 ? (
            <p className="adm-muted adm-mo-summary-empty">No products selected yet.</p>
          ) : (
            <ul className="adm-mo-summary">
              {priced.map((p) => (
                <li key={p.line.key}>
                  <div>
                    <div className="adm-cell-primary">{p.product.name}</div>
                    <div className="adm-cell-secondary">
                      {[p.line.size ? `Size ${p.line.size}` : 'Size not chosen', ...p.options].join(' · ')}
                    </div>
                  </div>
                  <span className="adm-num adm-mo-summary__qty">
                    {p.line.quantity} × {money(p.unitPrice)}
                  </span>
                  <span className="adm-num adm-cell-primary">{money(p.lineTotal)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="adm-order-totals adm-num adm-mo-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span>{priced.length === 0 ? money(0) : totals.isFreeShipping ? `Free (${money(0)})` : money(totals.shippingCost)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div>
                <span>Discount ({coupon?.code})</span>
                <span>− {money(totals.discountAmount)}</span>
              </div>
            )}
            <div className="is-total">
              <span>Total</span>
              <span>{money(totals.finalTotal)}</span>
            </div>
          </div>
        </section>
      </form>
    </Dialog>
  )
}

function LineEditor({
  priced,
  error,
  onChange,
  onRemove,
  toggle,
}: {
  priced: PricedLine
  error?: string
  onChange: (patch: Partial<ManualOrderLine>) => void
  onRemove: () => void
  toggle: (list: string[], id: string) => string[]
}) {
  const { line, product, isJersey } = priced
  const sizes = selectableSizes(product)
  const shorts = shortsOptionFor(product)
  const options = isJersey ? jerseyBadgeOptions(product) : null
  const setQty = (q: number) => onChange({ quantity: Math.max(1, Math.min(MAX_QUANTITY, Math.round(q) || 1)) })
  const errorId = `mo-line-${line.key}-error`

  return (
    <li className="adm-mo-line" data-line={line.key} aria-label={product.name}>
      <div className="adm-mo-line__head">
        <img src={product.images[0]} alt="" className="adm-thumb" />
        <div className="adm-mo-line__name">
          <div className="adm-cell-primary">{product.name}</div>
          <div className="adm-cell-secondary">
            {isJersey ? 'Jersey' : 'Shoes'} · {money(product.price)}
          </div>
        </div>
        <button type="button" className="adm-icon-btn adm-btn--danger" onClick={onRemove} aria-label={`Remove ${product.name}`} title="Remove">
          <Trash size={16} />
        </button>
      </div>

      <div className="adm-mo-line__controls">
        <label className="adm-field">
          <span className="adm-label">Size</span>
          <select
            className="adm-select"
            value={line.size}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange({ size: e.target.value })}
          >
            <option value="" disabled>
              Select
            </option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="adm-field">
          <span className="adm-label">Quantity</span>
          <div className="adm-mo-qty">
            <button type="button" className="adm-icon-btn" onClick={() => setQty(line.quantity - 1)} disabled={line.quantity <= 1} aria-label="Decrease quantity">
              <Minus size={14} />
            </button>
            <input
              className="adm-input adm-num"
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={line.quantity}
              aria-label={`Quantity of ${product.name}`}
              onChange={(e) => setQty(Number(e.target.value))}
            />
            <button type="button" className="adm-icon-btn" onClick={() => setQty(line.quantity + 1)} disabled={line.quantity >= MAX_QUANTITY} aria-label="Increase quantity">
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="adm-mo-line__price">
          <span className="adm-label">Line total</span>
          <span className="adm-num adm-cell-primary">{money(priced.lineTotal)}</span>
          {priced.unitPrice !== product.price && <span className="adm-cell-secondary adm-num">{money(priced.unitPrice)} each</span>}
        </div>
      </div>
      {error && (
        <span id={errorId} className="adm-field-error" role="alert">
          {error}
        </span>
      )}

      {isJersey && options && (
        <div className="adm-mo-jersey" aria-label="Jersey customization">
          <div className="adm-mo-opt">
            <span className="adm-label">Jersey version</span>
            <div className="adm-segmented" role="group" aria-label="Jersey version">
              <button type="button" aria-pressed={line.version === 'stadium'} onClick={() => onChange({ version: 'stadium' })}>
                Stadium
              </button>
              <button type="button" aria-pressed={line.version === 'authentic'} onClick={() => onChange({ version: 'authentic' })}>
                Authentic (+ {money(JERSEY_OPTION_PRICES.authentic)})
              </button>
            </div>
          </div>
          {shorts && (
            <div className="adm-mo-opt">
              <span className="adm-label">Shorts</span>
              <label className="adm-chip-check">
                <input type="checkbox" checked={line.shorts} onChange={(e) => onChange({ shorts: e.target.checked })} />
                Add matching shorts (+ {money(shorts.price)})
              </label>
            </div>
          )}
          <div className="adm-mo-opt">
            <span className="adm-label">Badges</span>
            {options.badges.length ? (
              <div className="adm-checkbox-row" role="group" aria-label="Badges">
                {options.badges.map((b) => (
                  <label key={b.id} className="adm-chip-check">
                    <input type="checkbox" checked={line.badgeIds.includes(b.id)} onChange={() => onChange({ badgeIds: toggle(line.badgeIds, b.id) })} />
                    {b.name} {b.price ? `(+ ${money(b.price)})` : ''}
                  </label>
                ))}
              </div>
            ) : (
              <span className="adm-hint">No active badges are assigned to this jersey (Admin › Badges).</span>
            )}
          </div>
          <div className="adm-mo-opt">
            <span className="adm-label">Sponsor Badges</span>
            {options.sponsors.length ? (
              <div className="adm-checkbox-row" role="group" aria-label="Sponsor Badges">
                {options.sponsors.map((s) => (
                  <label key={s.id} className="adm-chip-check">
                    <input type="checkbox" checked={line.sponsorIds.includes(s.id)} onChange={() => onChange({ sponsorIds: toggle(line.sponsorIds, s.id) })} />
                    {s.image && <img src={s.image} alt="" className="adm-mo-sponsor-logo" />}
                    {s.name} {s.price ? `(+ ${money(s.price)})` : ''}
                  </label>
                ))}
              </div>
            ) : (
              <span className="adm-hint">No active sponsor badges are assigned to this jersey (Admin › Badges).</span>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
