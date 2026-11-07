import React, { useState, useId } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  CreditCard,
  Lock,
  ShieldCheck,
  Check,
  AlertCircle,
  ShoppingBag,
  ChevronDown,
  PackageCheck,
} from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/formatters'
import { COUNTRIES } from '../../data/countries'
import {
  CartTotalsBlock,
  type CouponDefinition,
} from '../../components/cart/CartTotalsBlock'
import { CartEmptyState } from '../../components/cart/CartDrawer'
import visaLogo from '../../assets/payment/visa.svg'
import mastercardLogo from '../../assets/payment/mastercard.svg'
import applePayLogo from '../../assets/payment/apple-pay.svg'
import tabbyLogo from '../../assets/payment/tabby.svg'
import tamaraLogo from '../../assets/payment/tamara.svg'
import './Checkout.css'

export const Checkout: React.FC = () => {
  const { t, language, country, setCountry, currency } = useLocale()
  const { items, cartCount, clearCart } = useCart()
  const { user } = useAuth()

  // Generate unique accessible element IDs
  const emailInputId = useId()
  const dialCodeId = useId()
  const phoneInputId = useId()
  const firstNameId = useId()
  const lastNameId = useId()
  const countrySelectId = useId()
  const streetAddressId = useId()
  const municipalitySelectId = useId()
  const cityDistrictId = useId()
  const postalCodeId = useId()

  // ── Step Navigation State (1: Contact, 2: Delivery, 3: Payment) ───────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [completedSteps, setCompletedSteps] = useState<{ 1: boolean; 2: boolean }>({
    1: false,
    2: false,
  })

  // Mobile order summary accordion toggle
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false)

  // ── Step 1: Contact Information State ─────────────────────────────────────
  const [email, setEmail] = useState(() => user?.email || '')
  const [dialCode, setDialCode] = useState(() => country.dialCode || '+974')
  const [phone, setPhone] = useState('')
  const [step1Errors, setStep1Errors] = useState<{ email?: string; phone?: string }>({})
  const [step1Touched, setStep1Touched] = useState<{ email?: boolean; phone?: boolean }>({})

  // ── Step 2: Delivery Information State ────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedCountryName, setSelectedCountryName] = useState(() => country.name)
  const [streetAddress, setStreetAddress] = useState('')
  const [municipality, setMunicipality] = useState(() => {
    const activeC = COUNTRIES.find((c) => c.name === country.name) || country
    return activeC.regions?.[0] || 'Al Wakrah'
  })
  const [cityDistrict, setCityDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [step2Errors, setStep2Errors] = useState<{
    firstName?: string
    lastName?: string
    country?: string
    streetAddress?: string
    municipality?: string
    cityDistrict?: string
    postalCode?: string
  }>({})
  const [step2Touched, setStep2Touched] = useState<Record<string, boolean>>({})

  // Find active country definition for regions & validation
  const currentCountryObj =
    COUNTRIES.find((c) => c.name === selectedCountryName) || country

  // ── Coupon & Totals Shared State ──────────────────────────────────────────
  const [appliedCoupon, setAppliedCoupon] = useState<CouponDefinition | null>(null)
  const [calculatedTotals, setCalculatedTotals] = useState<{
    subtotal: number
    discountAmount: number
    shippingCost: number
    finalTotal: number
    isFreeShipping: boolean
  }>({
    subtotal: 0,
    discountAmount: 0,
    shippingCost: 0,
    finalTotal: 0,
    isFreeShipping: false,
  })

  // ── Order Submission & Completion State ───────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<{
    orderId: string
    date: string
    total: number
    currency: string
    contactEmail: string
    contactPhone: string
    recipientName: string
    deliveryAddress: string
    itemCount: number
  } | null>(null)

  // ── Validation Handlers ───────────────────────────────────────────────────

  const validateStep1 = (values = { email, phone, dialCode }): boolean => {
    const errors: { email?: string; phone?: string } = {}
    const trimmedEmail = values.email.trim()
    const cleanDigits = values.phone.replace(/[\s\-()]/g, '')

    // Email validation
    if (!trimmedEmail) {
      errors.email = t('checkout.emailRequired', {
        defaultValue: 'Email address is required',
      })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = t('checkout.emailInvalid', {
        defaultValue: 'Please enter a valid email address (e.g. name@example.com)',
      })
    }

    // Phone validation based on selected country dial code
    if (!cleanDigits) {
      errors.phone = t('checkout.phoneRequired', {
        defaultValue: 'Phone number is required',
      })
    } else if (!/^\d+$/.test(cleanDigits)) {
      errors.phone = t('checkout.phoneInvalid', {
        defaultValue: 'Phone number should only contain numbers',
      })
    } else {
      const targetCountry = COUNTRIES.find((c) => c.dialCode === values.dialCode)
      const expectedDigits = targetCountry?.phoneDigits

      if (typeof expectedDigits === 'number') {
        if (cleanDigits.length !== expectedDigits) {
          errors.phone =
            language === 'ar'
              ? `يرجى إدخال رقم هاتف صالح (${expectedDigits} أرقام)`
              : `Please enter a valid ${expectedDigits}-digit phone number for ${targetCountry?.name || 'selected country'}`
        }
      } else if (Array.isArray(expectedDigits)) {
        const [min, max] = expectedDigits
        if (cleanDigits.length < min || cleanDigits.length > max) {
          errors.phone =
            language === 'ar'
              ? `يرجى إدخال رقم هاتف صالح (${min}-${max} أرقام)`
              : `Please enter a valid phone number (${min}-${max} digits)`
        }
      } else if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        errors.phone = t('checkout.phoneInvalid', {
          defaultValue: 'Please enter a valid phone number (7-15 digits)',
        })
      }
    }

    setStep1Errors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = (
    values = {
      firstName,
      lastName,
      selectedCountryName,
      streetAddress,
      municipality,
      cityDistrict,
      postalCode,
    }
  ): boolean => {
    const errors: {
      firstName?: string
      lastName?: string
      country?: string
      streetAddress?: string
      municipality?: string
      cityDistrict?: string
      postalCode?: string
    } = {}

    if (!values.firstName.trim()) {
      errors.firstName = t('checkout.firstNameRequired', {
        defaultValue: 'First name is required',
      })
    }

    if (!values.lastName.trim()) {
      errors.lastName = t('checkout.lastNameRequired', {
        defaultValue: 'Last name is required',
      })
    }

    if (!values.selectedCountryName.trim()) {
      errors.country = t('checkout.countryRequired', {
        defaultValue: 'Country is required',
      })
    }

    if (!values.streetAddress.trim()) {
      errors.streetAddress = t('checkout.addressRequired', {
        defaultValue: 'Street address / national short address is required',
      })
    }

    if (!values.municipality.trim()) {
      errors.municipality = t('checkout.municipalityRequired', {
        defaultValue: 'Municipality / region is required',
      })
    }

    if (!values.cityDistrict.trim()) {
      errors.cityDistrict = t('checkout.cityRequired', {
        defaultValue: 'City / district is required',
      })
    }

    const trimmedPostal = values.postalCode.trim()
    if (!trimmedPostal) {
      errors.postalCode = t('checkout.postalCodeRequired', {
        defaultValue: 'Postal code is required',
      })
    } else if (trimmedPostal.length < 3 || trimmedPostal.length > 10) {
      errors.postalCode = t('checkout.postalCodeInvalid', {
        defaultValue: 'Please enter a valid postal code (3-10 characters)',
      })
    }

    setStep2Errors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Step Navigation Handlers ──────────────────────────────────────────────

  const handleContinueToDelivery = (e: React.FormEvent) => {
    e.preventDefault()
    setStep1Touched({ email: true, phone: true })
    const isValid = validateStep1()
    if (isValid) {
      setCompletedSteps((prev) => ({ ...prev, 1: true }))
      setCurrentStep(2)
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    // Re-verify Step 1 first in case user edited it and made it invalid
    const isStep1Valid = validateStep1()
    if (!isStep1Valid) {
      setCurrentStep(1)
      return
    }

    setStep2Touched({
      firstName: true,
      lastName: true,
      country: true,
      streetAddress: true,
      municipality: true,
      cityDistrict: true,
      postalCode: true,
    })

    const isStep2Valid = validateStep2()
    if (isStep2Valid) {
      setCompletedSteps({ 1: true, 2: true })
      setCurrentStep(3)
      window.scrollTo({ top: 220, behavior: 'smooth' })
    }
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newName = e.target.value
    setSelectedCountryName(newName)

    const matched = COUNTRIES.find((c) => c.name === newName)
    if (matched) {
      setCountry(matched)
      if (matched.dialCode) {
        setDialCode(matched.dialCode)
      }
      if (matched.regions && matched.regions.length > 0) {
        setMunicipality(matched.regions[0])
      }
    }

    if (step2Touched.country) {
      validateStep2({
        firstName,
        lastName,
        selectedCountryName: newName,
        streetAddress,
        municipality,
        cityDistrict,
        postalCode,
      })
    }
  }

  // ── Payment Submission Handler ────────────────────────────────────────────

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault()

    // Enforce full sequential validation before allowing payment
    const isStep1Ok = validateStep1()
    if (!isStep1Ok) {
      setStep1Touched({ email: true, phone: true })
      setCurrentStep(1)
      return
    }

    const isStep2Ok = validateStep2()
    if (!isStep2Ok) {
      setStep2Touched({
        firstName: true,
        lastName: true,
        country: true,
        streetAddress: true,
        municipality: true,
        cityDistrict: true,
        postalCode: true,
      })
      setCurrentStep(2)
      return
    }

    if (items.length === 0) return

    setIsSubmitting(true)

    // Simulate safe encrypted handoff to Nomod hosted gateway
    setTimeout(() => {
      const orderNumber = `S90-${Math.floor(100000 + Math.random() * 900000)}`
      const orderSummaryRecord = {
        orderId: orderNumber,
        date: new Date().toLocaleDateString(language === 'ar' ? 'ar-QA' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        total: calculatedTotals.finalTotal,
        currency,
        contactEmail: email.trim(),
        contactPhone: `${dialCode} ${phone.trim()}`,
        recipientName: `${firstName.trim()} ${lastName.trim()}`,
        deliveryAddress: `${streetAddress.trim()}, ${cityDistrict.trim()}, ${municipality.trim()}, ${selectedCountryName} (${postalCode.trim()})`,
        itemCount: cartCount,
      }

      setSubmittedOrder(orderSummaryRecord)
      clearCart()
      setIsSubmitting(false)
      window.scrollTo({ top: 60, behavior: 'smooth' })
    }, 1200)
  }

  // Formatted button total string, e.g. "AED 496" or "QAR 496"
  const buttonTotalAmount = calculatedTotals.finalTotal
  const formatButtonAmount =
    buttonTotalAmount % 1 === 0 ? buttonTotalAmount : buttonTotalAmount.toFixed(2)
  const buttonTotalDisplay = `${currency} ${formatButtonAmount}`

  // ── Render: Order Success View ────────────────────────────────────────────
  if (submittedOrder) {
    return (
      <div className="checkout-page checkout-page--success">
        <div className="checkout-success-card">
          <div className="checkout-success-badge" aria-hidden="true">
            <PackageCheck size={36} strokeWidth={1.5} />
          </div>

          <h1 className="checkout-success-title">
            {t('checkout.orderSuccessTitle', {
              defaultValue: 'Order Placed Successfully!',
            })}
          </h1>

          <p className="checkout-success-message">
            {t('checkout.orderSuccessMessage', {
              defaultValue:
                'Thank you for your order. We have received your payment via Nomod secure checkout.',
            })}
          </p>

          <div className="checkout-success-reference-box">
            <div className="checkout-ref-row">
              <span className="checkout-ref-label">
                {t('checkout.orderIdLabel', { defaultValue: 'Order Reference' })}
              </span>
              <span className="checkout-ref-number">{submittedOrder.orderId}</span>
            </div>
            <div className="checkout-ref-row">
              <span className="checkout-ref-label">
                {t('cart.total', { defaultValue: 'Total Paid' })}
              </span>
              <span className="checkout-ref-total">
                {formatPrice(submittedOrder.total, language, submittedOrder.currency)}
              </span>
            </div>
          </div>

          <div className="checkout-success-details-grid">
            <div className="checkout-success-detail-item">
              <span className="checkout-detail-label">
                {t('checkout.step1Title', { defaultValue: 'Contact Information' })}
              </span>
              <span className="checkout-detail-val">{submittedOrder.contactEmail}</span>
              <span className="checkout-detail-val">{submittedOrder.contactPhone}</span>
            </div>
            <div className="checkout-success-detail-item">
              <span className="checkout-detail-label">
                {t('checkout.step2Title', { defaultValue: 'Delivery Information' })}
              </span>
              <span className="checkout-detail-val">{submittedOrder.recipientName}</span>
              <span className="checkout-detail-val">{submittedOrder.deliveryAddress}</span>
            </div>
          </div>

          <div className="checkout-success-actions">
            <Link to={`/track-order/${submittedOrder.orderId}`} className="checkout-btn-primary">
              {language === 'ar' ? 'تتبع طلبك' : 'TRACK ORDER'}
            </Link>
            <Link to="/" className="checkout-btn-secondary">
              {t('common.continueShopping', { defaultValue: 'Continue Shopping' })}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      {/* Breadcrumb Navigation */}
      <nav
        className="checkout-breadcrumb"
        aria-label={t('common.breadcrumb', { defaultValue: 'Breadcrumb' })}
      >
        <ol className="checkout-breadcrumb-list">
          <li className="checkout-breadcrumb-item">
            <Link to="/" className="checkout-breadcrumb-link">
              {t('common.home', { defaultValue: 'Home' })}
            </Link>
          </li>
          <li className="checkout-breadcrumb-sep" aria-hidden="true">
            <ChevronRight size={12} />
          </li>
          <li className="checkout-breadcrumb-item">
            <Link to="/jerseys" className="checkout-breadcrumb-link">
              {language === 'ar' ? 'القمصان' : 'Jerseys'}
            </Link>
          </li>
          <li className="checkout-breadcrumb-sep" aria-hidden="true">
            <ChevronRight size={12} />
          </li>
          <li className="checkout-breadcrumb-item">
            <Link to="/shoes" className="checkout-breadcrumb-link">
              {language === 'ar' ? 'الأحذية' : 'Shoes'}
            </Link>
          </li>
          <li className="checkout-breadcrumb-sep" aria-hidden="true">
            <ChevronRight size={12} />
          </li>
          <li
            className="checkout-breadcrumb-item checkout-breadcrumb-current"
            aria-current="page"
          >
            {t('checkout.title', { defaultValue: 'Checkout' })}
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="checkout-page-header">
        <h1 className="checkout-page-title">
          {t('checkout.title', { defaultValue: 'Checkout' })}
        </h1>
        {cartCount > 0 && (
          <span className="checkout-order-summary-badge">
            {t(
              cartCount === 1
                ? 'checkout.orderItems_one'
                : 'checkout.orderItems_other',
              {
                count: cartCount,
                defaultValue: `${cartCount} ${cartCount === 1 ? 'item' : 'items'}`,
              }
            )}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="checkout-page-empty-wrap">
          <CartEmptyState />
        </div>
      ) : (
        <>
          {/* Mobile Collapsible Order Summary Accordion Bar */}
          <div className="checkout-mobile-summary-toggle-bar">
            <button
              type="button"
              className="checkout-mobile-summary-toggle-btn"
              onClick={() => setIsMobileSummaryOpen((prev) => !prev)}
              aria-expanded={isMobileSummaryOpen}
              aria-controls="checkout-mobile-summary-panel"
            >
              <div className="checkout-mobile-summary-left">
                <ShoppingBag size={18} />
                <span>
                  {isMobileSummaryOpen
                    ? t('checkout.hideOrderSummary', { defaultValue: 'Hide order summary' })
                    : t('checkout.showOrderSummary', { defaultValue: 'Show order summary' })}
                </span>
                <ChevronDown
                  size={15}
                  className={`checkout-mobile-chevron ${
                    isMobileSummaryOpen ? 'checkout-mobile-chevron--open' : ''
                  }`}
                />
              </div>
              <span className="checkout-mobile-summary-total">
                {formatPrice(calculatedTotals.finalTotal, language, currency)}
              </span>
            </button>

            {isMobileSummaryOpen && (
              <div
                id="checkout-mobile-summary-panel"
                className="checkout-mobile-summary-content"
              >
                <CartTotalsBlock
                  variant="page"
                  showItems={true}
                  showActions={false}
                  showLogos={false}
                  appliedCoupon={appliedCoupon}
                  onCouponChange={setAppliedCoupon}
                  onTotalsChange={setCalculatedTotals}
                />
              </div>
            )}
          </div>

          <div className="checkout-page-layout">
            {/* ──────────────────────────────────────────────────────────────
                LEFT COLUMN: THREE SEQUENTIAL CHECKOUT SECTIONS
                ────────────────────────────────────────────────────────────── */}
            <main className="checkout-steps-column" aria-label="Checkout Progression Steps">
              {/* ── STEP 1: CONTACT INFORMATION ─────────────────────────── */}
              <section
                className={`checkout-step-card ${
                  currentStep === 1
                    ? 'checkout-step-card--active'
                    : completedSteps[1]
                      ? 'checkout-step-card--completed'
                      : 'checkout-step-card--pending'
                }`}
                aria-labelledby="step-1-title"
              >
                <div
                  className="checkout-step-header"
                  onClick={() => {
                    if (completedSteps[1] && currentStep !== 1) {
                      setCurrentStep(1)
                    }
                  }}
                  role={completedSteps[1] && currentStep !== 1 ? 'button' : undefined}
                  tabIndex={completedSteps[1] && currentStep !== 1 ? 0 : undefined}
                >
                  <div className="checkout-step-header-left">
                    <span
                      className={`checkout-step-badge ${
                        completedSteps[1] && currentStep !== 1
                          ? 'checkout-step-badge--completed'
                          : ''
                      }`}
                      aria-hidden="true"
                    >
                      {completedSteps[1] && currentStep !== 1 ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        '1'
                      )}
                    </span>
                    <h2 id="step-1-title" className="checkout-step-title">
                      {t('checkout.step1Title', { defaultValue: 'Contact Information' })}
                    </h2>
                  </div>

                  {completedSteps[1] && currentStep !== 1 && (
                    <button
                      type="button"
                      className="checkout-step-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentStep(1)
                      }}
                    >
                      {t('checkout.edit', { defaultValue: 'Edit' })}
                    </button>
                  )}
                </div>

                {/* Completed summary preview when Step 1 is collapsed */}
                {completedSteps[1] && currentStep !== 1 && (
                  <div className="checkout-step-summary-view">
                    <div className="checkout-summary-line">
                      <span className="checkout-summary-line-label">
                        {t('checkout.emailAddress', { defaultValue: 'Email' })}:
                      </span>
                      <span className="checkout-summary-line-val">{email}</span>
                    </div>
                    <div className="checkout-summary-line">
                      <span className="checkout-summary-line-label">
                        {t('checkout.phoneNumber', { defaultValue: 'Phone' })}:
                      </span>
                      <span className="checkout-summary-line-val">
                        {dialCode} {phone}
                      </span>
                    </div>
                  </div>
                )}

                {/* Active Form Fields */}
                {currentStep === 1 && (
                  <form
                    onSubmit={handleContinueToDelivery}
                    className="checkout-step-form"
                    noValidate
                  >
                    {/* Email Field */}
                    <div className="checkout-form-group">
                      <label htmlFor={emailInputId} className="checkout-label">
                        {t('checkout.emailAddress', { defaultValue: 'EMAIL ADDRESS' })}
                        <span className="checkout-required-mark">*</span>
                      </label>
                      <input
                        id={emailInputId}
                        type="email"
                        className={`checkout-input ${
                          step1Errors.email ? 'checkout-input--error' : ''
                        }`}
                        placeholder="customer@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (step1Touched.email) {
                            validateStep1({ email: e.target.value, phone, dialCode })
                          }
                        }}
                        onBlur={() => {
                          setStep1Touched((prev) => ({ ...prev, email: true }))
                          validateStep1({ email, phone, dialCode })
                        }}
                        autoComplete="email"
                        required
                      />
                      {step1Errors.email && (
                        <div className="checkout-field-error" role="alert">
                          <AlertCircle size={13} />
                          <span>{step1Errors.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Phone Number Field with Dialing Code Selector */}
                    <div className="checkout-form-group">
                      <label htmlFor={phoneInputId} className="checkout-label">
                        {t('checkout.phoneNumber', { defaultValue: 'PHONE NUMBER' })}
                        <span className="checkout-required-mark">*</span>
                      </label>

                      <div
                        className={`checkout-phone-input-group ${
                          step1Errors.phone ? 'checkout-phone-input-group--error' : ''
                        }`}
                      >
                        <label htmlFor={dialCodeId} className="visually-hidden">
                          Country Dialing Code
                        </label>
                        <select
                          id={dialCodeId}
                          className="checkout-dial-code-select"
                          value={dialCode}
                          onChange={(e) => {
                            const newDial = e.target.value
                            setDialCode(newDial)
                            if (step1Touched.phone) {
                              validateStep1({ email, phone, dialCode: newDial })
                            }
                          }}
                          aria-label="Country Dialing Code"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.dialCode || '+974'}>
                              {c.code} ({c.dialCode || '+974'})
                            </option>
                          ))}
                        </select>

                        <input
                          id={phoneInputId}
                          type="tel"
                          className="checkout-phone-number-input"
                          placeholder={
                            currentCountryObj.phoneDigits === 8
                              ? '5512 3456'
                              : '50 123 4567'
                          }
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value)
                            if (step1Touched.phone) {
                              validateStep1({ email, phone: e.target.value, dialCode })
                            }
                          }}
                          onBlur={() => {
                            setStep1Touched((prev) => ({ ...prev, phone: true }))
                            validateStep1({ email, phone, dialCode })
                          }}
                          autoComplete="tel"
                          required
                        />
                      </div>

                      {step1Errors.phone && (
                        <div className="checkout-field-error" role="alert">
                          <AlertCircle size={13} />
                          <span>{step1Errors.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Continue Button */}
                    <div className="checkout-step-actions-row">
                      <button
                        type="submit"
                        className="checkout-primary-action-btn"
                      >
                        {t('checkout.continueToDelivery', {
                          defaultValue:
                            language === 'ar'
                              ? 'المتابعة إلى التوصيل ←'
                              : 'CONTINUE TO DELIVERY →',
                        })}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* ── STEP 2: DELIVERY INFORMATION (Matching Screenshot 1) ── */}
              <section
                className={`checkout-step-card ${
                  currentStep === 2
                    ? 'checkout-step-card--active'
                    : completedSteps[2]
                      ? 'checkout-step-card--completed'
                      : 'checkout-step-card--pending'
                }`}
                aria-labelledby="step-2-title"
              >
                <div
                  className="checkout-step-header"
                  onClick={() => {
                    if (completedSteps[1] && currentStep !== 2) {
                      // Only allow entering Step 2 if Step 1 is valid
                      const isStep1Valid = validateStep1()
                      if (isStep1Valid) {
                        setCurrentStep(2)
                      } else {
                        setCurrentStep(1)
                      }
                    }
                  }}
                  role={completedSteps[1] && currentStep !== 2 ? 'button' : undefined}
                  tabIndex={completedSteps[1] && currentStep !== 2 ? 0 : undefined}
                >
                  <div className="checkout-step-header-left">
                    <span
                      className={`checkout-step-badge ${
                        completedSteps[2] && currentStep !== 2
                          ? 'checkout-step-badge--completed'
                          : ''
                      }`}
                      aria-hidden="true"
                    >
                      {completedSteps[2] && currentStep !== 2 ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        '2'
                      )}
                    </span>
                    <h2 id="step-2-title" className="checkout-step-title">
                      {t('checkout.step2Title', { defaultValue: 'Delivery Information' })}
                    </h2>
                  </div>

                  {completedSteps[2] && currentStep !== 2 && (
                    <button
                      type="button"
                      className="checkout-step-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentStep(2)
                      }}
                    >
                      {t('checkout.edit', { defaultValue: 'Edit' })}
                    </button>
                  )}
                </div>

                {/* Completed summary preview when Step 2 is collapsed */}
                {completedSteps[2] && currentStep !== 2 && (
                  <div className="checkout-step-summary-view">
                    <div className="checkout-summary-line">
                      <span className="checkout-summary-line-label">
                        {language === 'ar' ? 'المستلم' : 'Recipient'}:
                      </span>
                      <span className="checkout-summary-line-val">
                        {firstName} {lastName}
                      </span>
                    </div>
                    <div className="checkout-summary-line">
                      <span className="checkout-summary-line-label">
                        {language === 'ar' ? 'العنوان' : 'Address'}:
                      </span>
                      <span className="checkout-summary-line-val">
                        {streetAddress}, {cityDistrict}, {municipality}, {selectedCountryName} ({postalCode})
                      </span>
                    </div>
                  </div>
                )}

                {/* Active Form Fields – Pixel matched to Screenshot 1 */}
                {currentStep === 2 && (
                  <form
                    onSubmit={handleContinueToPayment}
                    className="checkout-step-form"
                    noValidate
                  >
                    {/* Row 1: FIRST NAME * and LAST NAME * */}
                    <div className="checkout-form-grid-2">
                      <div className="checkout-form-group">
                        <label htmlFor={firstNameId} className="checkout-label">
                          {t('checkout.firstName', { defaultValue: 'FIRST NAME' })}
                          <span className="checkout-required-mark">*</span>
                        </label>
                        <input
                          id={firstNameId}
                          type="text"
                          className={`checkout-input ${
                            step2Errors.firstName ? 'checkout-input--error' : ''
                          }`}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value)
                            if (step2Touched.firstName) {
                              validateStep2({
                                firstName: e.target.value,
                                lastName,
                                selectedCountryName,
                                streetAddress,
                                municipality,
                                cityDistrict,
                                postalCode,
                              })
                            }
                          }}
                          onBlur={() => {
                            setStep2Touched((prev) => ({ ...prev, firstName: true }))
                            validateStep2()
                          }}
                          autoComplete="given-name"
                          required
                        />
                        {step2Errors.firstName && (
                          <div className="checkout-field-error" role="alert">
                            <AlertCircle size={13} />
                            <span>{step2Errors.firstName}</span>
                          </div>
                        )}
                      </div>

                      <div className="checkout-form-group">
                        <label htmlFor={lastNameId} className="checkout-label">
                          {t('checkout.lastName', { defaultValue: 'LAST NAME' })}
                          <span className="checkout-required-mark">*</span>
                        </label>
                        <input
                          id={lastNameId}
                          type="text"
                          className={`checkout-input ${
                            step2Errors.lastName ? 'checkout-input--error' : ''
                          }`}
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value)
                            if (step2Touched.lastName) {
                              validateStep2({
                                firstName,
                                lastName: e.target.value,
                                selectedCountryName,
                                streetAddress,
                                municipality,
                                cityDistrict,
                                postalCode,
                              })
                            }
                          }}
                          onBlur={() => {
                            setStep2Touched((prev) => ({ ...prev, lastName: true }))
                            validateStep2()
                          }}
                          autoComplete="family-name"
                          required
                        />
                        {step2Errors.lastName && (
                          <div className="checkout-field-error" role="alert">
                            <AlertCircle size={13} />
                            <span>{step2Errors.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: COUNTRY * (Full width select matching screenshot) */}
                    <div className="checkout-form-group">
                      <label htmlFor={countrySelectId} className="checkout-label">
                        {t('checkout.countryLabel', { defaultValue: 'COUNTRY' })}
                        <span className="checkout-required-mark">*</span>
                      </label>
                      <div className="checkout-select-wrap">
                        <select
                          id={countrySelectId}
                          className="checkout-select"
                          value={selectedCountryName}
                          onChange={handleCountryChange}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.name} ({c.deliveryDays || '7-12 days'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="checkout-select-chevron" />
                      </div>
                    </div>

                    {/* Row 3: STREET ADDRESS / NATIONAL SHORT ADDRESS * */}
                    <div className="checkout-form-group">
                      <label htmlFor={streetAddressId} className="checkout-label">
                        {t('checkout.streetAddress', {
                          defaultValue: 'STREET ADDRESS / NATIONAL SHORT ADDRESS',
                        })}
                        <span className="checkout-required-mark">*</span>
                      </label>
                      <input
                        id={streetAddressId}
                        type="text"
                        className={`checkout-input ${
                          step2Errors.streetAddress ? 'checkout-input--error' : ''
                        }`}
                        placeholder={
                          language === 'ar'
                            ? 'مثال: شارع مطلق الزويابي، مبنى 14'
                            : 'e.g. Mutlaq Al Zouyabi'
                        }
                        value={streetAddress}
                        onChange={(e) => {
                          setStreetAddress(e.target.value)
                          if (step2Touched.streetAddress) {
                            validateStep2({
                              firstName,
                              lastName,
                              selectedCountryName,
                              streetAddress: e.target.value,
                              municipality,
                              cityDistrict,
                              postalCode,
                            })
                          }
                        }}
                        onBlur={() => {
                          setStep2Touched((prev) => ({ ...prev, streetAddress: true }))
                          validateStep2()
                        }}
                        autoComplete="street-address"
                        required
                      />
                      {step2Errors.streetAddress && (
                        <div className="checkout-field-error" role="alert">
                          <AlertCircle size={13} />
                          <span>{step2Errors.streetAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* Row 4: 3 Columns: MUNICIPALITY / REGION *, CITY / DISTRICT *, POSTAL CODE * */}
                    <div className="checkout-form-grid-3">
                      {/* Municipality / Region */}
                      <div className="checkout-form-group">
                        <label htmlFor={municipalitySelectId} className="checkout-label">
                          {t('checkout.municipalityRegion', {
                            defaultValue: 'MUNICIPALITY / REGION',
                          })}
                          <span className="checkout-required-mark">*</span>
                        </label>
                        {currentCountryObj.regions && currentCountryObj.regions.length > 0 ? (
                          <div className="checkout-select-wrap">
                            <select
                              id={municipalitySelectId}
                              className="checkout-select"
                              value={municipality}
                              onChange={(e) => {
                                setMunicipality(e.target.value)
                                if (step2Touched.municipality) {
                                  validateStep2({
                                    firstName,
                                    lastName,
                                    selectedCountryName,
                                    streetAddress,
                                    municipality: e.target.value,
                                    cityDistrict,
                                    postalCode,
                                  })
                                }
                              }}
                            >
                              {currentCountryObj.regions.map((reg) => (
                                <option key={reg} value={reg}>
                                  {reg}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={15} className="checkout-select-chevron" />
                          </div>
                        ) : (
                          <input
                            id={municipalitySelectId}
                            type="text"
                            className={`checkout-input ${
                              step2Errors.municipality ? 'checkout-input--error' : ''
                            }`}
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            required
                          />
                        )}
                        {step2Errors.municipality && (
                          <div className="checkout-field-error" role="alert">
                            <AlertCircle size={13} />
                            <span>{step2Errors.municipality}</span>
                          </div>
                        )}
                      </div>

                      {/* City / District */}
                      <div className="checkout-form-group">
                        <label htmlFor={cityDistrictId} className="checkout-label">
                          {t('checkout.cityDistrict', {
                            defaultValue: 'CITY / DISTRICT',
                          })}
                          <span className="checkout-required-mark">*</span>
                        </label>
                        <input
                          id={cityDistrictId}
                          type="text"
                          className={`checkout-input ${
                            step2Errors.cityDistrict ? 'checkout-input--error' : ''
                          }`}
                          placeholder={
                            language === 'ar'
                              ? 'مسيعيد / الدفنة'
                              : 'Mesaieed (Industrial / Coast)'
                          }
                          value={cityDistrict}
                          onChange={(e) => {
                            setCityDistrict(e.target.value)
                            if (step2Touched.cityDistrict) {
                              validateStep2({
                                firstName,
                                lastName,
                                selectedCountryName,
                                streetAddress,
                                municipality,
                                cityDistrict: e.target.value,
                                postalCode,
                              })
                            }
                          }}
                          onBlur={() => {
                            setStep2Touched((prev) => ({ ...prev, cityDistrict: true }))
                            validateStep2()
                          }}
                          autoComplete="address-level2"
                          required
                        />
                        {step2Errors.cityDistrict && (
                          <div className="checkout-field-error" role="alert">
                            <AlertCircle size={13} />
                            <span>{step2Errors.cityDistrict}</span>
                          </div>
                        )}
                      </div>

                      {/* Postal Code */}
                      <div className="checkout-form-group">
                        <label htmlFor={postalCodeId} className="checkout-label">
                          {t('checkout.postalCode', { defaultValue: 'POSTAL CODE' })}
                          <span className="checkout-required-mark">*</span>
                        </label>
                        <input
                          id={postalCodeId}
                          type="text"
                          className={`checkout-input ${
                            step2Errors.postalCode ? 'checkout-input--error' : ''
                          }`}
                          placeholder="24311"
                          value={postalCode}
                          onChange={(e) => {
                            setPostalCode(e.target.value)
                            if (step2Touched.postalCode) {
                              validateStep2({
                                firstName,
                                lastName,
                                selectedCountryName,
                                streetAddress,
                                municipality,
                                cityDistrict,
                                postalCode: e.target.value,
                              })
                            }
                          }}
                          onBlur={() => {
                            setStep2Touched((prev) => ({ ...prev, postalCode: true }))
                            validateStep2()
                          }}
                          autoComplete="postal-code"
                          required
                        />
                        {step2Errors.postalCode && (
                          <div className="checkout-field-error" role="alert">
                            <AlertCircle size={13} />
                            <span>{step2Errors.postalCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row matching Screenshot 1 */}
                    <div className="checkout-step-actions-row checkout-step-actions-row--split">
                      <button
                        type="submit"
                        className="checkout-primary-action-btn"
                      >
                        {t('checkout.continueToPayment', {
                          defaultValue:
                            language === 'ar'
                              ? 'المتابعة إلى الدفع ←'
                              : 'CONTINUE TO PAYMENT →',
                        })}
                      </button>

                      <button
                        type="button"
                        className="checkout-back-link-btn"
                        onClick={() => setCurrentStep(1)}
                      >
                        {t('checkout.backToContact', {
                          defaultValue:
                            language === 'ar'
                              ? '→ العودة إلى معلومات الاتصال'
                              : '← Back to Contact',
                        })}
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* ── STEP 3: PAYMENT (Matching Screenshot 2) ─────────────── */}
              <section
                className={`checkout-step-card ${
                  currentStep === 3
                    ? 'checkout-step-card--active'
                    : 'checkout-step-card--pending'
                }`}
                aria-labelledby="step-3-title"
              >
                <div className="checkout-step-header">
                  <div className="checkout-step-header-left">
                    <span className="checkout-step-badge" aria-hidden="true">
                      3
                    </span>
                    <div className="checkout-step-title-group">
                      <h2 id="step-3-title" className="checkout-step-title">
                        {t('checkout.step3Title', { defaultValue: 'Payment' })}
                      </h2>
                      <span className="checkout-step-subtitle">
                        {t('checkout.securePaymentNomod', {
                          defaultValue: 'Secure encrypted payment gateway via Nomod',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {currentStep === 3 ? (
                  <div className="checkout-payment-box-wrapper">
                    {/* Encrypted Gateway Box matching Screenshot 2 */}
                    <div className="checkout-payment-box">
                      <div className="checkout-payment-box-header">
                        <div className="checkout-payment-box-title-wrap">
                          <CreditCard size={18} className="checkout-payment-card-icon" />
                          <span className="checkout-payment-box-heading">
                            {t('checkout.cardOrApplePay', {
                              defaultValue: 'Credit / Debit Card / Apple Pay',
                            })}
                          </span>
                        </div>

                        <span className="checkout-encrypted-badge">
                          <ShieldCheck size={14} className="checkout-encrypted-shield" />
                          <span>{t('checkout.encrypted', { defaultValue: 'Encrypted' })}</span>
                        </span>
                      </div>

                      <p className="checkout-payment-box-desc">
                        {t('checkout.nomodRedirectNotice', {
                          defaultValue:
                            'After clicking "Complete Order & Pay", you will be safely redirected to the official encrypted checkout gateway to finalize your payment.',
                        })}
                      </p>

                      {/* Payment Brand Logos */}
                      <div
                        className="checkout-payment-logos-row"
                        aria-label={t('checkout.acceptedPaymentMethods', {
                          defaultValue: 'Accepted Payment Methods',
                        })}
                      >
                        <span className="checkout-brand-badge" title="Visa">
                          <img
                            src={visaLogo}
                            alt="Visa"
                            className="checkout-brand-img"
                            width="48"
                            height="28"
                            loading="lazy"
                          />
                        </span>
                        <span className="checkout-brand-badge" title="Mastercard">
                          <img
                            src={mastercardLogo}
                            alt="Mastercard"
                            className="checkout-brand-img"
                            width="42"
                            height="28"
                            loading="lazy"
                          />
                        </span>
                        <span className="checkout-brand-badge" title="Apple Pay">
                          <img
                            src={applePayLogo}
                            alt="Apple Pay"
                            className="checkout-brand-img"
                            width="48"
                            height="28"
                            loading="lazy"
                          />
                        </span>
                        <span className="checkout-brand-badge" title="Tabby">
                          <img
                            src={tabbyLogo}
                            alt="Tabby"
                            className="checkout-brand-img"
                            width="50"
                            height="28"
                            loading="lazy"
                          />
                        </span>
                        <span className="checkout-brand-badge" title="Tamara">
                          <img
                            src={tamaraLogo}
                            alt="Tamara"
                            className="checkout-brand-img"
                            width="54"
                            height="28"
                            loading="lazy"
                          />
                        </span>
                      </div>
                    </div>

                    {/* Prominent COMPLETE ORDER & PAY Button matching Screenshot 2 */}
                    <button
                      type="button"
                      className="checkout-complete-order-btn"
                      onClick={handleCompleteOrder}
                      disabled={isSubmitting || items.length === 0}
                      aria-label={`${t('checkout.completeOrderAndPay', { defaultValue: 'COMPLETE ORDER & PAY' })} (${buttonTotalDisplay})`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="checkout-btn-spinner" aria-hidden="true" />
                          <span>
                            {t('checkout.processingPayment', {
                              defaultValue: 'Processing Secure Payment...',
                            })}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock size={16} strokeWidth={2.2} />
                          <span>
                            {t('checkout.completeOrderAndPay', {
                              defaultValue: 'COMPLETE ORDER & PAY',
                            })}{' '}
                            ({buttonTotalDisplay})
                          </span>
                        </>
                      )}
                    </button>

                    {/* Back link to delivery */}
                    <div className="checkout-payment-back-row">
                      <button
                        type="button"
                        className="checkout-back-link-btn"
                        onClick={() => setCurrentStep(2)}
                      >
                        {t('checkout.backToDelivery', {
                          defaultValue:
                            language === 'ar'
                              ? '→ العودة إلى معلومات التوصيل'
                              : '← Back to Delivery',
                        })}
                      </button>
                    </div>

                    {/* Security Guarantee Note */}
                    <p className="checkout-encryption-note">
                      {t('checkout.encryptionGuarantee', {
                        defaultValue:
                          'Your transaction and personal information are protected with end-to-end industry encryption.',
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="checkout-step-locked-note">
                    <p>
                      {language === 'ar'
                        ? 'سيتم تفعيل خيارات الدفع فور اكتمال معلومات التوصيل.'
                        : 'Payment options will become available once delivery information is completed.'}
                    </p>
                  </div>
                )}
              </section>
            </main>

            {/* ──────────────────────────────────────────────────────────────
                RIGHT COLUMN: COMPLETE ORDER SUMMARY
                ────────────────────────────────────────────────────────────── */}
            <aside
              className="checkout-page-summary-aside"
              aria-label={t('checkout.orderSummaryHeading', {
                defaultValue: 'Order Summary',
              })}
            >
              <div className="checkout-desktop-summary-container">
                <CartTotalsBlock
                  variant="page"
                  showItems={true}
                  showActions={false}
                  showLogos={false}
                  appliedCoupon={appliedCoupon}
                  onCouponChange={setAppliedCoupon}
                  onTotalsChange={setCalculatedTotals}
                />
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
