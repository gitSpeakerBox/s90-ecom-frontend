import React, { useState, useId } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { COUNTRIES } from '../../../shared/data/countries'
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validatePhoneNumber,
  validateName,
  validateTerms,
} from '../../../shared/utils/authValidation'
import { GoogleIcon } from './Login'
import './AuthCommon.css'
import './Signup.css'

export const Signup: React.FC = () => {
  const { user, signup, loginWithGoogle } = useAuth()
  const { t, country } = useLocale()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect target after signup (e.g. from checkout)
  const from = (location.state as { from?: string })?.from || '/'

  // Element IDs for accessibility
  const firstNameId = useId()
  const lastNameId = useId()
  const emailId = useId()
  const dialCodeId = useId()
  const phoneId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const termsId = useId()

  // ── Form State ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [dialCode, setDialCode] = useState(() => country.dialCode || '+974')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Show / Hide Password Toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Field Errors & Touched State
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Loading & Global Notification State
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null)

  // Active country definition for phone length
  const activeCountryObj =
    COUNTRIES.find((c) => c.dialCode === dialCode) ||
    COUNTRIES.find((c) => c.name === country.name) ||
    country

  // ── Form Validation ─────────────────────────────────────────────────────
  const validateField = (
    field: string,
    val?: unknown,
    allValues = {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      acceptTerms,
    }
  ): string | undefined => {
    switch (field) {
      case 'firstName': {
        const v = typeof val === 'string' ? val : allValues.firstName
        const res = validateName(v, 'First name', {
          required: t('auth.errors.firstNameRequired', {
            defaultValue: 'First name is required (min 2 characters)',
          }),
          minLength: t('auth.errors.firstNameRequired', {
            defaultValue: 'First name is required (min 2 characters)',
          }),
        })
        return res.isValid ? undefined : res.error
      }
      case 'lastName': {
        const v = typeof val === 'string' ? val : allValues.lastName
        const res = validateName(v, 'Last name', {
          required: t('auth.errors.lastNameRequired', {
            defaultValue: 'Last name is required (min 2 characters)',
          }),
          minLength: t('auth.errors.lastNameRequired', {
            defaultValue: 'Last name is required (min 2 characters)',
          }),
        })
        return res.isValid ? undefined : res.error
      }
      case 'email': {
        const v = typeof val === 'string' ? val : allValues.email
        const res = validateEmail(v, {
          required: t('auth.errors.emailRequired', {
            defaultValue: 'Email address is required',
          }),
          invalid: t('auth.errors.emailInvalid', {
            defaultValue: 'Please enter a valid email address',
          }),
        })
        return res.isValid ? undefined : res.error
      }
      case 'phone': {
        const v = typeof val === 'string' ? val : allValues.phone
        const res = validatePhoneNumber(v, activeCountryObj.phoneDigits, {
          required: t('auth.errors.phoneRequired', {
            defaultValue: 'Phone number is required',
          }),
          invalid: t('auth.errors.phoneInvalid', {
            defaultValue: 'Please enter a valid phone number',
          }),
        })
        return res.isValid ? undefined : res.error
      }
      case 'password': {
        const v = typeof val === 'string' ? val : allValues.password
        const res = validatePassword(v, {
          required: t('auth.errors.passwordRequired', {
            defaultValue: 'Password is required',
          }),
          minLength: t('auth.errors.passwordMinLength', {
            defaultValue: 'Password must be at least 8 characters long',
          }),
          complexity: t('auth.errors.passwordComplexity', {
            defaultValue: 'Password must include at least one letter and one number',
          }),
        })
        return res.isValid ? undefined : res.error
      }
      case 'confirmPassword': {
        const v = typeof val === 'string' ? val : allValues.confirmPassword
        const pwd = allValues.password
        const res = validateConfirmPassword(pwd, v, {
          required: t('auth.errors.confirmPasswordRequired', {
            defaultValue: 'Please confirm your password',
          }),
          mismatch: t('auth.errors.passwordMismatch', {
            defaultValue: 'Passwords do not match',
          }),
        })
        return res.isValid ? undefined : res.error
      }
      case 'acceptTerms': {
        const v = typeof val === 'boolean' ? val : allValues.acceptTerms
        const res = validateTerms(v, t('auth.errors.termsRequired', {
          defaultValue: 'You must agree to the Terms & Conditions and Privacy Policy',
        }))
        return res.isValid ? undefined : res.error
      }
      default:
        return undefined
    }
  }

  const validateAll = (): boolean => {
    const fields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'password',
      'confirmPassword',
      'acceptTerms',
    ]
    const nextErrors: Record<string, string | undefined> = {}
    let allValid = true

    fields.forEach((f) => {
      const err = validateField(f)
      if (err) {
        nextErrors[f] = err
        allValid = false
      }
    })

    setErrors(nextErrors)
    return allValid
  }

  // ── Signup Submit Handler ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    // Mark all as touched on submit
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    })

    if (!validateAll()) return

    setIsLoading(true)
    try {
      await signup({
        firstName,
        lastName,
        email,
        dialCode,
        phone,
        password,
      })
      setGeneralSuccess(
        t('auth.accountCreatedSuccess', {
          defaultValue: 'Account created successfully! Welcome to S90 SPORT.',
        })
      )
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 700)
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setGeneralError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Google Sign-Up Handler ──────────────────────────────────────────────
  const handleGoogleSignUp = async () => {
    setGeneralError(null)
    setGeneralSuccess(null)
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Google sign-up failed. Please try again.'
      setGeneralError(errorMsg)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // If already logged in, redirect or display info
  if (user) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 className="auth-title">
            {t('common.welcomeBack', { name: user.name, defaultValue: `Welcome, ${user.name}` })}
          </h2>
          <p className="auth-subtitle" style={{ marginBottom: 20 }}>
            {t('common.currentlySignedIn', {
              defaultValue: 'You are already registered and signed in to S90 SPORT.',
            })}
          </p>
          <Link to="/" className="auth-submit-btn">
            {t('common.continueShopping', { defaultValue: 'Continue Shopping' })}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      {/* Breadcrumb Navigation */}
      <nav
        className="auth-breadcrumb"
        aria-label={t('common.breadcrumb', { defaultValue: 'Breadcrumb' })}
      >
        <ol className="auth-breadcrumb-list">
          <li className="auth-breadcrumb-item">
            <Link to="/">{t('common.home', { defaultValue: 'Home' })}</Link>
          </li>
          <li className="auth-breadcrumb-sep" aria-hidden="true">
            <ChevronRight size={12} />
          </li>
          <li className="auth-breadcrumb-item">
            <Link to="/login">{t('auth.signInTitle', { defaultValue: 'Account' })}</Link>
          </li>
          <li className="auth-breadcrumb-sep" aria-hidden="true">
            <ChevronRight size={12} />
          </li>
          <li className="auth-breadcrumb-item auth-breadcrumb-current" aria-current="page">
            {t('auth.signUpTitle', { defaultValue: 'CREATE ACCOUNT' })}
          </li>
        </ol>
      </nav>

      {/* Main Registration Card */}
      <div className="auth-card">
        {/* Card Header */}
        <header className="auth-header">
          <span className="auth-eyebrow">S90 SPORT</span>
          <h1 className="auth-title">
            {t('auth.signUpTitle', { defaultValue: 'CREATE ACCOUNT' })}
          </h1>
          <p className="auth-subtitle">
            {t('auth.signUpSubtitle', {
              defaultValue:
                'Join S90 SPORT to enjoy personalized shopping and order tracking.',
            })}
          </p>
        </header>

        {/* Global Error Banner */}
        {generalError && (
          <div className="auth-banner auth-banner--error" role="alert">
            <AlertCircle size={16} className="auth-banner-icon" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {generalSuccess && (
          <div className="auth-banner auth-banner--success" role="status">
            <CheckCircle2 size={16} className="auth-banner-icon" />
            <span>{generalSuccess}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Name Row: First Name & Last Name */}
          <div className="auth-form-row">
            {/* First Name */}
            <div className="auth-form-group">
              <label htmlFor={firstNameId} className="auth-label">
                {t('auth.firstName', { defaultValue: 'FIRST NAME' })}
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id={firstNameId}
                  type="text"
                  className={`auth-input ${
                    errors.firstName && touched.firstName ? 'auth-input--error' : ''
                  }`}
                  placeholder="Alex"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    if (touched.firstName) {
                      const err = validateField('firstName', e.target.value)
                      setErrors((prev) => ({ ...prev, firstName: err }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, firstName: true }))
                    const err = validateField('firstName', firstName)
                    setErrors((prev) => ({ ...prev, firstName: err }))
                  }}
                  autoComplete="given-name"
                  required
                />
              </div>
              {errors.firstName && touched.firstName && (
                <div className="auth-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{errors.firstName}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="auth-form-group">
              <label htmlFor={lastNameId} className="auth-label">
                {t('auth.lastName', { defaultValue: 'LAST NAME' })}
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id={lastNameId}
                  type="text"
                  className={`auth-input ${
                    errors.lastName && touched.lastName ? 'auth-input--error' : ''
                  }`}
                  placeholder="Mercer"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    if (touched.lastName) {
                      const err = validateField('lastName', e.target.value)
                      setErrors((prev) => ({ ...prev, lastName: err }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, lastName: true }))
                    const err = validateField('lastName', lastName)
                    setErrors((prev) => ({ ...prev, lastName: err }))
                  }}
                  autoComplete="family-name"
                  required
                />
              </div>
              {errors.lastName && touched.lastName && (
                <div className="auth-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{errors.lastName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className="auth-form-group">
            <label htmlFor={emailId} className="auth-label">
              {t('auth.emailAddress', { defaultValue: 'EMAIL ADDRESS' })}
              <span className="auth-required-mark">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id={emailId}
                type="email"
                className={`auth-input ${
                  errors.email && touched.email ? 'auth-input--error' : ''
                }`}
                placeholder="alex.mercer@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (touched.email) {
                    const err = validateField('email', e.target.value)
                    setErrors((prev) => ({ ...prev, email: err }))
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, email: true }))
                  const err = validateField('email', email)
                  setErrors((prev) => ({ ...prev, email: err }))
                }}
                autoComplete="email"
                required
              />
            </div>
            {errors.email && touched.email && (
              <div className="auth-field-error" role="alert">
                <AlertCircle size={13} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Phone Number with Dialing Code Selector */}
          <div className="auth-form-group">
            <label htmlFor={phoneId} className="auth-label">
              {t('auth.phoneNumber', { defaultValue: 'PHONE NUMBER' })}
              <span className="auth-required-mark">*</span>
            </label>

            <div
              className={`auth-phone-group ${
                errors.phone && touched.phone ? 'auth-phone-group--error' : ''
              }`}
            >
              <label htmlFor={dialCodeId} className="visually-hidden">
                Country Dialing Code
              </label>
              <select
                id={dialCodeId}
                className="auth-dial-select"
                value={dialCode}
                onChange={(e) => {
                  const newDial = e.target.value
                  setDialCode(newDial)
                  if (touched.phone) {
                    const err = validateField('phone', phone)
                    setErrors((prev) => ({ ...prev, phone: err }))
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
                id={phoneId}
                type="tel"
                className="auth-phone-input"
                placeholder={
                  activeCountryObj.phoneDigits === 8 ? '5512 3456' : '50 123 4567'
                }
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (touched.phone) {
                    const err = validateField('phone', e.target.value)
                    setErrors((prev) => ({ ...prev, phone: err }))
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, phone: true }))
                  const err = validateField('phone', phone)
                  setErrors((prev) => ({ ...prev, phone: err }))
                }}
                autoComplete="tel"
                required
              />
            </div>

            {errors.phone && touched.phone && (
              <div className="auth-field-error" role="alert">
                <AlertCircle size={13} />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="auth-form-group">
            <label htmlFor={passwordId} className="auth-label">
              {t('auth.password', { defaultValue: 'PASSWORD' })}
              <span className="auth-required-mark">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                className={`auth-input auth-input--password ${
                  errors.password && touched.password ? 'auth-input--error' : ''
                }`}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touched.password) {
                    const err = validateField('password', e.target.value)
                    setErrors((prev) => ({ ...prev, password: err }))
                  }
                  if (touched.confirmPassword) {
                    const confirmErr = validateField(
                      'confirmPassword',
                      confirmPassword,
                      {
                        firstName,
                        lastName,
                        email,
                        phone,
                        password: e.target.value,
                        confirmPassword,
                        acceptTerms,
                      }
                    )
                    setErrors((prev) => ({ ...prev, confirmPassword: confirmErr }))
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, password: true }))
                  const err = validateField('password', password)
                  setErrors((prev) => ({ ...prev, password: err }))
                }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && touched.password && (
              <div className="auth-field-error" role="alert">
                <AlertCircle size={13} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="auth-form-group">
            <label htmlFor={confirmPasswordId} className="auth-label">
              {t('auth.confirmPassword', { defaultValue: 'CONFIRM PASSWORD' })}
              <span className="auth-required-mark">*</span>
            </label>
            <div className="auth-input-wrap">
              <input
                id={confirmPasswordId}
                type={showConfirmPassword ? 'text' : 'password'}
                className={`auth-input auth-input--password ${
                  errors.confirmPassword && touched.confirmPassword
                    ? 'auth-input--error'
                    : ''
                }`}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (touched.confirmPassword) {
                    const err = validateField(
                      'confirmPassword',
                      e.target.value,
                      {
                        firstName,
                        lastName,
                        email,
                        phone,
                        password,
                        confirmPassword: e.target.value,
                        acceptTerms,
                      }
                    )
                    setErrors((prev) => ({ ...prev, confirmPassword: err }))
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, confirmPassword: true }))
                  const err = validateField('confirmPassword', confirmPassword)
                  setErrors((prev) => ({ ...prev, confirmPassword: err }))
                }}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="auth-field-error" role="alert">
                <AlertCircle size={13} />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          {/* Terms and Conditions Acceptance */}
          <div className="auth-form-group">
            <label htmlFor={termsId} className="auth-checkbox-label">
              <input
                id={termsId}
                type="checkbox"
                className="auth-checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked)
                  if (touched.acceptTerms) {
                    const err = validateField('acceptTerms', e.target.checked)
                    setErrors((prev) => ({ ...prev, acceptTerms: err }))
                  }
                }}
              />
              <span style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                {t('auth.termsAccept', {
                  defaultValue:
                    'I agree to the Terms & Conditions and Privacy Policy',
                })}
                <span className="auth-required-mark">*</span>
              </span>
            </label>
            {errors.acceptTerms && touched.acceptTerms && (
              <div className="auth-field-error" role="alert">
                <AlertCircle size={13} />
                <span>{errors.acceptTerms}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                <span>
                  {t('auth.creatingAccount', { defaultValue: 'Creating Account...' })}
                </span>
              </>
            ) : (
              <span>
                {t('auth.signUpBtn', { defaultValue: 'CREATE ACCOUNT' })}
              </span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">
            {t('auth.orContinueWith', { defaultValue: 'OR CONTINUE WITH' })}
          </span>
          <div className="auth-divider-line" />
        </div>

        {/* Official Google Sign-Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="auth-google-btn"
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <>
              <span className="auth-spinner auth-spinner--dark" aria-hidden="true" />
              <span>{t('auth.verifying', { defaultValue: 'Verifying...' })}</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>
                {t('auth.continueWithGoogle', { defaultValue: 'Continue with Google' })}
              </span>
            </>
          )}
        </button>

        {/* Login Navigation */}
        <div className="auth-footer-prompt">
          <span>{t('auth.alreadyHaveAccount', { defaultValue: 'Already have an account?' })}</span>
          <Link to="/login" className="auth-footer-link">
            {t('auth.loginLink', { defaultValue: 'Login' })}
          </Link>
        </div>
      </div>
    </div>
  )
}
