import React, { useState, useId } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { COUNTRIES } from '../../../shared/data/countries'
import { useOtpCountdown } from '../../hooks/useOtpCountdown'
import {
  validateEmail,
  validatePhoneNumber,
  validateOtp,
} from '../../../shared/utils/authValidation'
import './AuthCommon.css'
import './Login.css'

export const GoogleIcon: React.FC<{ className?: string }> = ({
  className = 'auth-google-icon',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="18"
    height="18"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
)

export const Login: React.FC = () => {
  const { user, loginWithEmail, loginWithPhone, sendPhoneOtp, loginWithGoogle, logout } =
    useAuth()
  const { t, country } = useLocale()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect target after login (e.g. from checkout or account)
  const from = (location.state as { from?: string })?.from || '/'

  // Active Login Method: 'email' | 'phone'
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')

  // Form IDs for accessibility
  const emailInputId = useId()
  const passwordInputId = useId()
  const phoneInputId = useId()
  const dialCodeId = useId()
  const otpInputId = useId()
  const rememberMeId = useId()

  // ── Email Login State ───────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [emailErrors, setEmailErrors] = useState<{ email?: string; password?: string }>({})
  const [emailTouched, setEmailTouched] = useState<{ email?: boolean; password?: boolean }>({})

  // ── Phone Login State ───────────────────────────────────────────────────
  const [dialCode, setDialCode] = useState(() => country.dialCode || '+974')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [phoneErrors, setPhoneErrors] = useState<{ phone?: string; otp?: string }>({})
  const [phoneTouched, setPhoneTouched] = useState<{ phone?: boolean; otp?: boolean }>({})

  // ── Status & Feedback State ─────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null)

  // Reusable OTP countdown timer hook (starts only when OTP sent)
  const {
    isActive: isTimerActive,
    formattedTime,
    start: startTimer,
  } = useOtpCountdown({
    initialSeconds: 30,
    autoStart: false,
  })

  // Find country specs for phone length
  const activeCountryObj =
    COUNTRIES.find((c) => c.dialCode === dialCode) ||
    COUNTRIES.find((c) => c.name === country.name) ||
    country

  // ── Validation Helpers ──────────────────────────────────────────────────
  const validateEmailFields = (values = { email, password }): boolean => {
    const errs: { email?: string; password?: string } = {}

    const emailRes = validateEmail(values.email, {
      required: t('auth.errors.emailRequired', { defaultValue: 'Email address is required' }),
      invalid: t('auth.errors.emailInvalid', { defaultValue: 'Please enter a valid email address' }),
    })
    if (!emailRes.isValid) errs.email = emailRes.error

    if (!values.password) {
      errs.password = t('auth.errors.passwordRequired', {
        defaultValue: 'Password is required',
      })
    }

    setEmailErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validatePhoneField = (val = phone): boolean => {
    const res = validatePhoneNumber(val, activeCountryObj.phoneDigits, {
      required: t('auth.errors.phoneRequired', { defaultValue: 'Phone number is required' }),
      invalid: t('auth.errors.phoneInvalid', { defaultValue: 'Please enter a valid phone number' }),
    })
    setPhoneErrors((prev) => ({ ...prev, phone: res.isValid ? undefined : res.error }))
    return res.isValid
  }

  const validateOtpField = (val = otpCode): boolean => {
    const res = validateOtp(val, 6, {
      required: t('auth.errors.otpRequired', { defaultValue: 'Please enter the 6-digit verification code' }),
      invalid: t('auth.errors.otpInvalid', { defaultValue: 'Verification code must be 6 digits' }),
    })
    setPhoneErrors((prev) => ({ ...prev, otp: res.isValid ? undefined : res.error }))
    return res.isValid
  }

  // ── Email Login Handler ─────────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setEmailTouched({ email: true, password: true })
    if (!validateEmailFields()) return

    setIsLoading(true)
    try {
      await loginWithEmail(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.'
      setGeneralError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Phone OTP Request Handler ───────────────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setPhoneTouched((prev) => ({ ...prev, phone: true }))
    if (!validatePhoneField()) return

    setIsLoading(true)
    try {
      await sendPhoneOtp(dialCode, phone)
      setIsOtpSent(true)
      startTimer(30)
      setGeneralSuccess(
        t('auth.otpSentSuccess', {
          phone: `${dialCode} ${phone.trim()}`,
          defaultValue: `Verification code sent to ${dialCode} ${phone.trim()}`,
        })
      )
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to send verification code.'
      setGeneralError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Phone OTP Verify & Login Handler ────────────────────────────────────
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setPhoneTouched({ phone: true, otp: true })
    const isPhoneValid = validatePhoneField()
    const isOtpValid = validateOtpField()
    if (!isPhoneValid || !isOtpValid) return

    setIsLoading(true)
    try {
      await loginWithPhone(dialCode, phone, otpCode)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Invalid verification code. Please try again.'
      setGeneralError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Google Sign-In Handler ──────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGeneralError(null)
    setGeneralSuccess(null)
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Google authentication failed. Please try again.'
      setGeneralError(errorMsg)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // ── Signed In Card View ─────────────────────────────────────────────────
  if (user) {
    return (
      <div className="auth-page">
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
            <li className="auth-breadcrumb-item auth-breadcrumb-current" aria-current="page">
              {t('common.authentication', { defaultValue: 'Account' })}
            </li>
          </ol>
        </nav>

        <div className="auth-card">
          <div className="auth-signedin-card">
            <div className="auth-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="auth-header" style={{ marginBottom: 12 }}>
              <span className="auth-eyebrow">
                {t('common.authentication', { defaultValue: 'Account' })}
              </span>
              <h1 className="auth-title">
                {t('common.welcomeBack', { name: user.name, defaultValue: `Welcome, ${user.name}` })}
              </h1>
              <p className="auth-subtitle">
                {user.email || (user.phone ? `${user.dialCode || ''} ${user.phone}` : '')}
              </p>
            </div>

            <p className="auth-subtitle">
              {t('common.currentlySignedIn', {
                defaultValue: 'You are currently signed in to your customer account.',
              })}
            </p>

            <div className="auth-signedin-actions">
              <Link to="/orders" className="auth-submit-btn">
                <span>{t('header.myOrders', { defaultValue: 'My Orders' })}</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/"
                className="auth-google-btn"
                style={{ textDecoration: 'none' }}
              >
                {t('common.continueShopping', { defaultValue: 'Continue Shopping' })}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="auth-resend-btn"
                style={{ marginTop: 8 }}
              >
                {t('header.signOut', { defaultValue: 'Sign Out' })}
              </button>
            </div>
          </div>
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
          <li className="auth-breadcrumb-item auth-breadcrumb-current" aria-current="page">
            {t('auth.signInTitle', { defaultValue: 'SIGN IN' })}
          </li>
        </ol>
      </nav>

      {/* Main Authentication Card */}
      <div className="auth-card">
        {/* Card Header */}
        <header className="auth-header">
          <span className="auth-eyebrow">S90 SPORT</span>
          <h1 className="auth-title">
            {t('auth.signInTitle', { defaultValue: 'SIGN IN' })}
          </h1>
          <p className="auth-subtitle">
            {t('auth.signInSubtitle', {
              defaultValue:
                'Sign in to access your orders, saved items and express checkout.',
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

        {/* Tabs: Email Login vs Phone Login */}
        <div className="auth-tabs" role="tablist" aria-label="Sign In Method">
          <button
            type="button"
            role="tab"
            id="tab-email"
            aria-selected={activeTab === 'email'}
            aria-controls="panel-email"
            className={`auth-tab-btn ${activeTab === 'email' ? 'auth-tab-btn--active' : ''}`}
            onClick={() => {
              setActiveTab('email')
              setGeneralError(null)
            }}
          >
            <Mail size={15} />
            <span>{t('auth.emailTab', { defaultValue: 'Email Login' })}</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-phone"
            aria-selected={activeTab === 'phone'}
            aria-controls="panel-phone"
            className={`auth-tab-btn ${activeTab === 'phone' ? 'auth-tab-btn--active' : ''}`}
            onClick={() => {
              setActiveTab('phone')
              setGeneralError(null)
            }}
          >
            <Phone size={15} />
            <span>{t('auth.phoneTab', { defaultValue: 'Phone Login' })}</span>
          </button>
        </div>

        {/* ── EMAIL LOGIN FORM ────────────────────────────────────────────── */}
        {activeTab === 'email' && (
          <form
            id="panel-email"
            role="tabpanel"
            aria-labelledby="tab-email"
            onSubmit={handleEmailLogin}
            className="auth-form"
            noValidate
          >
            {/* Email Field */}
            <div className="auth-form-group">
              <label htmlFor={emailInputId} className="auth-label">
                {t('auth.emailAddress', { defaultValue: 'EMAIL ADDRESS' })}
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id={emailInputId}
                  type="email"
                  className={`auth-input ${
                    emailErrors.email && emailTouched.email ? 'auth-input--error' : ''
                  }`}
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailTouched.email) {
                      validateEmailFields({ email: e.target.value, password })
                    }
                  }}
                  onBlur={() => {
                    setEmailTouched((prev) => ({ ...prev, email: true }))
                    validateEmailFields({ email, password })
                  }}
                  autoComplete="email"
                  required
                />
              </div>
              {emailErrors.email && emailTouched.email && (
                <div className="auth-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{emailErrors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="auth-form-group">
              <label htmlFor={passwordInputId} className="auth-label">
                {t('auth.password', { defaultValue: 'PASSWORD' })}
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id={passwordInputId}
                  type={showPassword ? 'text' : 'password'}
                  className={`auth-input auth-input--password ${
                    emailErrors.password && emailTouched.password
                      ? 'auth-input--error'
                      : ''
                  }`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (emailTouched.password) {
                      validateEmailFields({ email, password: e.target.value })
                    }
                  }}
                  onBlur={() => {
                    setEmailTouched((prev) => ({ ...prev, password: true }))
                    validateEmailFields({ email, password })
                  }}
                  autoComplete="current-password"
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
              {emailErrors.password && emailTouched.password && (
                <div className="auth-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{emailErrors.password}</span>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="auth-options-row">
              <label htmlFor={rememberMeId} className="auth-checkbox-label">
                <input
                  id={rememberMeId}
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>{t('auth.rememberMe', { defaultValue: 'Remember me' })}</span>
              </label>

              <Link to="/forgot-password" className="auth-link">
                {t('auth.forgotPasswordLink', { defaultValue: 'Forgot password?' })}
              </Link>
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
                  <span>{t('auth.signingIn', { defaultValue: 'Signing In...' })}</span>
                </>
              ) : (
                <span>{t('auth.signInBtn', { defaultValue: 'SIGN IN' })}</span>
              )}
            </button>
          </form>
        )}

        {/* ── PHONE OTP LOGIN FORM ────────────────────────────────────────── */}
        {activeTab === 'phone' && (
          <form
            id="panel-phone"
            role="tabpanel"
            aria-labelledby="tab-phone"
            onSubmit={isOtpSent ? handleVerifyPhoneOtp : handleSendOtp}
            className="auth-form"
            noValidate
          >
            {/* Phone Number Field with Dialing Code Selector */}
            <div className="auth-form-group">
              <label htmlFor={phoneInputId} className="auth-label">
                {t('auth.phoneNumber', { defaultValue: 'PHONE NUMBER' })}
                <span className="auth-required-mark">*</span>
              </label>

              <div
                className={`auth-phone-group ${
                  phoneErrors.phone && phoneTouched.phone ? 'auth-phone-group--error' : ''
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
                    if (phoneTouched.phone) {
                      validatePhoneNumber(phone, activeCountryObj.phoneDigits)
                    }
                  }}
                  disabled={isOtpSent && isTimerActive}
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
                  className="auth-phone-input"
                  placeholder={
                    activeCountryObj.phoneDigits === 8 ? '5512 3456' : '50 123 4567'
                  }
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (phoneTouched.phone) {
                      validatePhoneField(e.target.value)
                    }
                  }}
                  onBlur={() => {
                    setPhoneTouched((prev) => ({ ...prev, phone: true }))
                    validatePhoneField(phone)
                  }}
                  disabled={isOtpSent && isTimerActive}
                  autoComplete="tel"
                  required
                />
              </div>

              {phoneErrors.phone && phoneTouched.phone && (
                <div className="auth-field-error" role="alert">
                  <AlertCircle size={13} />
                  <span>{phoneErrors.phone}</span>
                </div>
              )}
            </div>

            {/* OTP Verification Input (Visible once OTP is sent) */}
            {isOtpSent && (
              <div className="auth-form-group">
                <label htmlFor={otpInputId} className="auth-label">
                  {t('auth.verificationCode', { defaultValue: 'VERIFICATION CODE' })}
                  <span className="auth-required-mark">*</span>
                </label>

                <div className="auth-input-wrap">
                  <input
                    id={otpInputId}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    className={`auth-input auth-otp-input ${
                      phoneErrors.otp && phoneTouched.otp ? 'auth-input--error' : ''
                    }`}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '')
                      setOtpCode(clean)
                      if (phoneTouched.otp) {
                        validateOtpField(clean)
                      }
                    }}
                    onBlur={() => {
                      setPhoneTouched((prev) => ({ ...prev, otp: true }))
                      validateOtpField(otpCode)
                    }}
                    autoFocus
                  />
                </div>

                {phoneErrors.otp && phoneTouched.otp && (
                  <div className="auth-field-error" role="alert">
                    <AlertCircle size={13} />
                    <span>{phoneErrors.otp}</span>
                  </div>
                )}

                {/* Resend OTP Row with Live Countdown Timer */}
                <div className="auth-otp-timer-row">
                  {isTimerActive ? (
                    <span className="auth-otp-timer-text">
                      <Clock size={14} />
                      <span>
                        {t('auth.resendOtpIn', {
                          time: formattedTime,
                          defaultValue: `Resend OTP in ${formattedTime}`,
                        })}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="auth-resend-btn"
                      onClick={() => handleSendOtp()}
                      disabled={isLoading}
                    >
                      <RefreshCw size={14} />
                      <span>{t('auth.resendOtp', { defaultValue: 'Resend Code' })}</span>
                    </button>
                  )}

                  <span
                    style={{
                      fontSize: '11px',
                      color: '#a1a1aa',
                      fontFamily: 'monospace',
                    }}
                  >
                    {t('auth.otpTestHint', { defaultValue: 'Test code: 123456' })}
                  </span>
                </div>
              </div>
            )}

            {/* Submit / Action Button */}
            {!isOtpSent ? (
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>{t('auth.sending', { defaultValue: 'Sending OTP...' })}</span>
                  </>
                ) : (
                  <span>{t('auth.sendOtp', { defaultValue: 'SEND OTP' })}</span>
                )}
              </button>
            ) : (
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || isGoogleLoading || otpCode.length < 6}
              >
                {isLoading ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>{t('auth.verifying', { defaultValue: 'Verifying...' })}</span>
                  </>
                ) : (
                  <span>
                    {t('auth.verifyAndLogin', { defaultValue: 'VERIFY & SIGN IN' })}
                  </span>
                )}
              </button>
            )}
          </form>
        )}

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">
            {t('auth.orContinueWith', { defaultValue: 'OR CONTINUE WITH' })}
          </span>
          <div className="auth-divider-line" />
        </div>

        {/* Official Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="auth-google-btn"
          disabled={isLoading || isGoogleLoading}
          aria-label={t('auth.continueWithGoogle', {
            defaultValue: 'Continue with Google',
          })}
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

        {/* Sign Up Navigation */}
        <div className="auth-footer-prompt">
          <span>{t('auth.dontHaveAccount', { defaultValue: "Don't have an account?" })}</span>
          <Link to="/signup" className="auth-footer-link">
            {t('auth.signUpLink', { defaultValue: 'Sign Up' })}
          </Link>
        </div>
      </div>
    </div>
  )
}
