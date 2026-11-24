import React, { useState, useId } from 'react'
import { Link } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { COUNTRIES } from '../../data/countries'
import { useOtpCountdown } from '../../hooks/useOtpCountdown'
import {
  validateEmail,
  validatePhoneNumber,
  validateOtp,
  validatePassword,
  validateConfirmPassword,
} from '../../utils/authValidation'
import './AuthCommon.css'
import './ForgotPassword.css'

export const ForgotPassword: React.FC = () => {
  const {
    sendPasswordResetEmail,
    sendPasswordResetPhoneOtp,
    verifyPasswordResetPhoneOtp,
    resetPasswordWithPhoneOtp,
  } = useAuth()
  const { t, country } = useLocale()

  // Recovery method: 'email' | 'phone'
  const [method, setMethod] = useState<'email' | 'phone'>('email')

  // Form IDs for accessibility
  const emailInputId = useId()
  const phoneInputId = useId()
  const dialCodeId = useId()
  const otpInputId = useId()
  const newPasswordId = useId()
  const confirmPasswordId = useId()

  // ── Email Flow State ────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [emailTouched, setEmailTouched] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  // ── Phone Flow State ────────────────────────────────────────────────────
  const [dialCode, setDialCode] = useState(() => country.dialCode || '+974')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false)
  // isOtpVerified: true only after backend confirms the OTP is correct
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [isPasswordResetSuccess, setIsPasswordResetSuccess] = useState(false)

  // Phone Validation Errors & Touched
  const [phoneErrors, setPhoneErrors] = useState<Record<string, string | undefined>>({})
  const [phoneTouched, setPhoneTouched] = useState<Record<string, boolean>>({})

  // General Status State
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null)

  // Reusable Countdown Timer for Phone OTP
  const {
    isActive: isTimerActive,
    formattedTime,
    start: startTimer,
  } = useOtpCountdown({
    initialSeconds: 30,
    autoStart: false,
  })

  // Active country definition
  const activeCountryObj =
    COUNTRIES.find((c) => c.dialCode === dialCode) ||
    COUNTRIES.find((c) => c.name === country.name) ||
    country

  // ── Validation Helpers ──────────────────────────────────────────────────
  const checkEmail = (val = email): boolean => {
    const res = validateEmail(val, {
      required: t('auth.errors.emailRequired', { defaultValue: 'Email address is required' }),
      invalid: t('auth.errors.emailInvalid', { defaultValue: 'Please enter a valid email address' }),
    })
    setEmailError(res.isValid ? undefined : res.error)
    return res.isValid
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

  const validatePasswordFields = (): boolean => {
    const errs: Record<string, string | undefined> = {}

    const pwdRes = validatePassword(newPassword, {
      required: t('auth.errors.passwordRequired', { defaultValue: 'Password is required' }),
      minLength: t('auth.errors.passwordMinLength', { defaultValue: 'Password must be at least 8 characters' }),
      complexity: t('auth.errors.passwordComplexity', { defaultValue: 'Must include at least one letter and one number' }),
    })
    if (!pwdRes.isValid) errs.newPassword = pwdRes.error

    const confRes = validateConfirmPassword(newPassword, confirmPassword, {
      required: t('auth.errors.confirmPasswordRequired', { defaultValue: 'Please confirm your password' }),
      mismatch: t('auth.errors.passwordMismatch', { defaultValue: 'Passwords do not match' }),
    })
    if (!confRes.isValid) errs.confirmPassword = confRes.error

    setPhoneErrors((prev) => ({ ...prev, ...errs }))
    return Object.keys(errs).length === 0
  }

  // ── Email Reset Request Handler ─────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setEmailTouched(true)
    if (!checkEmail()) return

    setIsLoading(true)
    try {
      const res = await sendPasswordResetEmail(email)
      setIsEmailSent(true)
      setGeneralSuccess(
        res.message ||
          t('auth.resetLinkSent', {
            defaultValue: 'Password reset link sent! Please check your email inbox.',
          })
      )
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to send password reset email.'
      setGeneralError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Phone OTP Send Handler ──────────────────────────────────────────────
  const handlePhoneSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setPhoneTouched((prev) => ({ ...prev, phone: true }))
    if (!validatePhoneField()) return

    setIsLoading(true)
    try {
      await sendPasswordResetPhoneOtp(dialCode, phone)
      setIsPhoneOtpSent(true)
      setIsOtpVerified(false)
      setOtpCode('')
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

  // ── Phone OTP Verify Handler (Step 2 → Step 3) ──────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setPhoneTouched((prev) => ({ ...prev, otp: true }))
    if (!validateOtpField()) return

    setIsLoading(true)
    try {
      await verifyPasswordResetPhoneOtp(dialCode, phone, otpCode)
      setIsOtpVerified(true)
      setGeneralSuccess(
        t('auth.otpVerified', {
          defaultValue: 'Verification successful! Please set your new password.',
        })
      )
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Invalid verification code. Please try again.'
      setGeneralError(errorMsg)
      setIsOtpVerified(false)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Phone Password Reset Handler (Step 3) ───────────────────────────────
  const handlePhoneResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    setGeneralSuccess(null)

    setPhoneTouched((prev) => ({
      ...prev,
      newPassword: true,
      confirmPassword: true,
    }))

    if (!validatePasswordFields()) return

    setIsLoading(true)
    try {
      const res = await resetPasswordWithPhoneOtp(
        dialCode,
        phone,
        otpCode,
        newPassword
      )
      setIsPasswordResetSuccess(true)
      setGeneralSuccess(
        res.message ||
          t('auth.passwordResetSuccess', {
            defaultValue:
              'Password has been successfully updated! You can now sign in.',
          })
      )
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to reset password. Please try again.'
      setGeneralError(errorMsg)
    } finally {
      setIsLoading(false)
    }
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
            {t('auth.forgotPasswordTitle', { defaultValue: 'FORGOT PASSWORD' })}
          </li>
        </ol>
      </nav>

      {/* Main Password Recovery Card */}
      <div className="auth-card">
        {/* Card Header */}
        <header className="auth-header">
          <span className="auth-eyebrow">S90 SPORT</span>
          <h1 className="auth-title">
            {t('auth.forgotPasswordTitle', { defaultValue: 'FORGOT PASSWORD' })}
          </h1>
          <p className="auth-subtitle">
            {t('auth.forgotPasswordSubtitle', {
              defaultValue:
                'Enter your registered email or phone number to recover your account.',
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

        {/* Segmented Tabs: Email Recovery vs Phone Recovery */}
        {!isEmailSent && !isPasswordResetSuccess && !isOtpVerified && (
          <div className="auth-tabs" role="tablist" aria-label="Recovery Method">
            <button
              type="button"
              role="tab"
              id="tab-email-recovery"
              aria-selected={method === 'email'}
              aria-controls="panel-email-recovery"
              className={`auth-tab-btn ${method === 'email' ? 'auth-tab-btn--active' : ''}`}
              onClick={() => {
                setMethod('email')
                setGeneralError(null)
              }}
            >
              <Mail size={15} />
              <span>{t('auth.emailRecovery', { defaultValue: 'Email Recovery' })}</span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-phone-recovery"
              aria-selected={method === 'phone'}
              aria-controls="panel-phone-recovery"
              className={`auth-tab-btn ${method === 'phone' ? 'auth-tab-btn--active' : ''}`}
              onClick={() => {
                setMethod('phone')
                setGeneralError(null)
              }}
            >
              <Phone size={15} />
              <span>{t('auth.phoneRecovery', { defaultValue: 'Phone Recovery' })}</span>
            </button>
          </div>
        )}

        {/* ── EMAIL RECOVERY FLOW ─────────────────────────────────────────── */}
        {method === 'email' && (
          <div id="panel-email-recovery" role="tabpanel" aria-labelledby="tab-email-recovery">
            {!isEmailSent ? (
              <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
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
                        emailError && emailTouched ? 'auth-input--error' : ''
                      }`}
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailTouched) checkEmail(e.target.value)
                      }}
                      onBlur={() => {
                        setEmailTouched(true)
                        checkEmail()
                      }}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {emailError && emailTouched && (
                    <div className="auth-field-error" role="alert">
                      <AlertCircle size={13} />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="auth-spinner" aria-hidden="true" />
                      <span>
                        {t('auth.sending', { defaultValue: 'Sending Link...' })}
                      </span>
                    </>
                  ) : (
                    <span>
                      {t('auth.sendResetLink', { defaultValue: 'SEND RESET LINK' })}
                    </span>
                  )}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p className="auth-subtitle" style={{ marginBottom: 20 }}>
                  {t('auth.resetLinkSent', {
                    defaultValue:
                      'A password recovery link has been dispatched to your email address. Follow the instructions to reset your password.',
                  })}
                </p>
                <Link to="/login" className="auth-submit-btn">
                  <span>{t('auth.backToLogin', { defaultValue: 'Back to Sign In' })}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── PHONE RECOVERY FLOW ─────────────────────────────────────────── */}
        {method === 'phone' && (
          <div id="panel-phone-recovery" role="tabpanel" aria-labelledby="tab-phone-recovery">
            {!isPasswordResetSuccess ? (
              <>
                {/* ── STEP 1 & 2: Phone number + OTP (hidden once OTP verified) */}
                {!isOtpVerified && (
                  <form
                    onSubmit={isPhoneOtpSent ? handleVerifyOtp : handlePhoneSendOtp}
                    className="auth-form"
                    noValidate
                  >
                    {/* Phone Number with Dialing Code Selector */}
                    <div className="auth-form-group">
                      <label htmlFor={phoneInputId} className="auth-label">
                        {t('auth.phoneNumber', { defaultValue: 'PHONE NUMBER' })}
                        <span className="auth-required-mark">*</span>
                      </label>

                      <div
                        className={`auth-phone-group ${
                          phoneErrors.phone && phoneTouched.phone
                            ? 'auth-phone-group--error'
                            : ''
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
                              validatePhoneField()
                            }
                          }}
                          disabled={isPhoneOtpSent && isTimerActive}
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
                            activeCountryObj.phoneDigits === 8
                              ? '5512 3456'
                              : '50 123 4567'
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
                          disabled={isPhoneOtpSent && isTimerActive}
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

                    {/* OTP Section — only shown after OTP is successfully sent */}
                    {isPhoneOtpSent && (
                      <div className="auth-form-group">
                        <label htmlFor={otpInputId} className="auth-label">
                          {t('auth.verificationCode', {
                            defaultValue: 'VERIFICATION CODE',
                          })}
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
                              phoneErrors.otp && phoneTouched.otp
                                ? 'auth-input--error'
                                : ''
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
                              onClick={() => handlePhoneSendOtp()}
                              disabled={isLoading}
                            >
                              <RefreshCw size={14} />
                              <span>
                                {t('auth.resendOtp', { defaultValue: 'Resend Code' })}
                              </span>
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

                    {/* Submit Action Button */}
                    {!isPhoneOtpSent ? (
                      <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="auth-spinner" aria-hidden="true" />
                            <span>
                              {t('auth.sending', { defaultValue: 'Sending OTP...' })}
                            </span>
                          </>
                        ) : (
                          <span>
                            {t('auth.sendOtp', { defaultValue: 'SEND OTP' })}
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={isLoading || otpCode.length < 6}
                      >
                        {isLoading ? (
                          <>
                            <span className="auth-spinner" aria-hidden="true" />
                            <span>
                              {t('auth.verifying', { defaultValue: 'Verifying...' })}
                            </span>
                          </>
                        ) : (
                          <span>
                            {t('auth.verifyBtn', { defaultValue: 'VERIFY' })}
                          </span>
                        )}
                      </button>
                    )}
                  </form>
                )}

                {/* ── STEP 3: Set new password (shown only after OTP verified) */}
                {isOtpVerified && (
                  <form
                    onSubmit={handlePhoneResetPassword}
                    className="auth-form"
                    noValidate
                  >
                    {/* New Password */}
                    <div className="auth-form-group">
                      <label htmlFor={newPasswordId} className="auth-label">
                        {t('auth.newPassword', { defaultValue: 'NEW PASSWORD' })}
                        <span className="auth-required-mark">*</span>
                      </label>
                      <div className="auth-input-wrap">
                        <input
                          id={newPasswordId}
                          type={showPassword ? 'text' : 'password'}
                          className={`auth-input auth-input--password ${
                            phoneErrors.newPassword && phoneTouched.newPassword
                              ? 'auth-input--error'
                              : ''
                          }`}
                          placeholder="Min. 8 characters"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value)
                            if (phoneTouched.newPassword) {
                              const res = validatePassword(e.target.value)
                              setPhoneErrors((prev) => ({
                                ...prev,
                                newPassword: res.isValid ? undefined : res.error,
                              }))
                            }
                            if (phoneTouched.confirmPassword) {
                              const confRes = validateConfirmPassword(
                                e.target.value,
                                confirmPassword
                              )
                              setPhoneErrors((prev) => ({
                                ...prev,
                                confirmPassword: confRes.isValid ? undefined : confRes.error,
                              }))
                            }
                          }}
                          onBlur={() => {
                            setPhoneTouched((prev) => ({ ...prev, newPassword: true }))
                            const res = validatePassword(newPassword)
                            setPhoneErrors((prev) => ({
                              ...prev,
                              newPassword: res.isValid ? undefined : res.error,
                            }))
                          }}
                          autoComplete="new-password"
                          autoFocus
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
                      {phoneErrors.newPassword && phoneTouched.newPassword && (
                        <div className="auth-field-error" role="alert">
                          <AlertCircle size={13} />
                          <span>{phoneErrors.newPassword}</span>
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div className="auth-form-group">
                      <label htmlFor={confirmPasswordId} className="auth-label">
                        {t('auth.confirmPassword', {
                          defaultValue: 'CONFIRM PASSWORD',
                        })}
                        <span className="auth-required-mark">*</span>
                      </label>
                      <div className="auth-input-wrap">
                        <input
                          id={confirmPasswordId}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className={`auth-input auth-input--password ${
                            phoneErrors.confirmPassword &&
                            phoneTouched.confirmPassword
                              ? 'auth-input--error'
                              : ''
                          }`}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value)
                            if (phoneTouched.confirmPassword) {
                              const res = validateConfirmPassword(
                                newPassword,
                                e.target.value
                              )
                              setPhoneErrors((prev) => ({
                                ...prev,
                                confirmPassword: res.isValid ? undefined : res.error,
                              }))
                            }
                          }}
                          onBlur={() => {
                            setPhoneTouched((prev) => ({
                              ...prev,
                              confirmPassword: true,
                            }))
                            const res = validateConfirmPassword(
                              newPassword,
                              confirmPassword
                            )
                            setPhoneErrors((prev) => ({
                              ...prev,
                              confirmPassword: res.isValid ? undefined : res.error,
                            }))
                          }}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          className="auth-password-toggle"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          aria-label={
                            showConfirmPassword
                              ? 'Hide password'
                              : 'Show password'
                          }
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      {phoneErrors.confirmPassword &&
                        phoneTouched.confirmPassword && (
                          <div className="auth-field-error" role="alert">
                            <AlertCircle size={13} />
                            <span>{phoneErrors.confirmPassword}</span>
                          </div>
                        )}
                    </div>

                    {/* Reset Password Button */}
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="auth-spinner" aria-hidden="true" />
                          <span>
                            {t('auth.verifying', { defaultValue: 'Updating...' })}
                          </span>
                        </>
                      ) : (
                        <span>
                          {t('auth.verifyAndReset', {
                            defaultValue: 'RESET PASSWORD',
                          })}
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p className="auth-subtitle" style={{ marginBottom: 20 }}>
                  {t('auth.passwordResetSuccess', {
                    defaultValue:
                      'Your password has been successfully updated! You can now sign in with your new credentials.',
                  })}
                </p>
                <Link to="/login" className="auth-submit-btn">
                  <span>{t('auth.backToLogin', { defaultValue: 'Back to Sign In' })}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Back to Login Footer Link */}
        <div className="auth-footer-prompt">
          <Link to="/login" className="auth-footer-link">
            {t('auth.backToLogin', { defaultValue: 'Back to Sign In' })}
          </Link>
        </div>
      </div>
    </div>
  )
}
