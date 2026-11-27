/**
 * Authentication Service for S90 SPORT
 * Provides authentication services for Email, Phone OTP, Google OAuth, and Password Recovery.
 * Ready for drop-in Firebase Auth / backend REST API integration.
 */

import { isAccountBlocked } from '../../shared/services/accountAccess'

export interface AuthUser {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  dialCode?: string
  phone?: string
  photoURL?: string
}

/** Ways an account can sign in. Recorded when the method is actually set up or used. */
export type SignInMethod = 'email' | 'phone' | 'google'

export interface StoredAccount {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  dialCode: string
  phone: string
  /** Empty for accounts without a password (phone-only / Google-only). */
  passwordHash: string
  /** Sign-in methods linked to this account (email = email + password). */
  signInMethods: SignInMethod[]
}

export class AuthError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

// In-memory demo account registry (passwords are NOT stored in localStorage)
const INITIAL_DEMO_ACCOUNTS: StoredAccount[] = [
  {
    id: 'usr_s90_demo_1',
    name: 'Alex Mercer',
    firstName: 'Alex',
    lastName: 'Mercer',
    email: 'alex@example.com',
    dialCode: '+974',
    phone: '55123456',
    passwordHash: 'Password123!',
    signInMethods: ['email'],
  },
  {
    id: 'usr_s90_demo_2',
    name: 'Customer Support',
    firstName: 'S90',
    lastName: 'Customer',
    email: 'customer@s90sport.com',
    dialCode: '+974',
    phone: '50123456',
    passwordHash: 'Password123!',
    signInMethods: ['email'],
  },
  // ── Temporary mock user for development/testing only ──────────────────────
  // DO NOT promote to production. No Firebase or backend record exists for this user.
  {
    id: 'usr_s90_mock_arun',
    name: 'Arun',
    firstName: 'Arun',
    lastName: '',
    email: 'arun@gmail.com',
    dialCode: '+974',
    phone: '',
    passwordHash: 'arun123',
    signInMethods: ['email'],
  },
]

// Active accounts list in memory during app lifetime
const registeredAccounts: StoredAccount[] = [...INITIAL_DEMO_ACCOUNTS]

// In-memory OTP session storage
interface OtpSession {
  code: string
  dialCode: string
  phone: string
  expiresAt: number
  verified?: boolean
}

const activeOtpSessions = new Map<string, OtpSession>()

function getPhoneKey(dialCode: string, phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `${dialCode.trim()}_${digits}`
}

/**
 * Clean phone digits
 */
function cleanDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** Records that a sign-in method is now linked to the account. */
function linkSignInMethod(account: StoredAccount, method: SignInMethod): void {
  if (!account.signInMethods.includes(method)) account.signInMethods = [...account.signInMethods, method]
}

/** Blocked accounts (Admin › Users) cannot sign in by any method. */
function assertNotBlocked(account: StoredAccount): void {
  if (isAccountBlocked(account.id)) {
    throw new AuthError(
      'auth/user-disabled',
      'This account has been blocked. Please contact S90 SPORT support.'
    )
  }
}

function toAuthUser(account: StoredAccount): AuthUser {
  return {
    id: account.id,
    name: account.name,
    firstName: account.firstName || undefined,
    lastName: account.lastName || undefined,
    email: account.email || undefined,
    dialCode: account.dialCode || undefined,
    phone: account.phone || undefined,
  }
}

export const authService = {
  /**
   * Email and Password Login
   */
  async loginWithEmail(email: string, password: string): Promise<AuthUser> {
    // Artificial latency typical of secure auth providers
    await new Promise((resolve) => setTimeout(resolve, 600))

    const cleanEmail = email.trim().toLowerCase()
    const account = cleanEmail
      ? registeredAccounts.find((acc) => acc.email.toLowerCase() === cleanEmail)
      : undefined

    // Accounts without email sign-in (phone-only / Google-only) have no password.
    if (!account || !account.signInMethods.includes('email') || !account.passwordHash) {
      throw new AuthError(
        'auth/invalid-credential',
        'Invalid email or password.'
      )
    }

    if (account.passwordHash !== password) {
      throw new AuthError(
        'auth/invalid-credential',
        'Invalid email or password.'
      )
    }

    assertNotBlocked(account)

    return {
      id: account.id,
      name: account.name,
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      dialCode: account.dialCode,
      phone: account.phone,
    }
  },

  /**
   * Request Phone Verification OTP
   */
  async sendPhoneOtp(
    dialCode: string,
    phone: string
  ): Promise<{ success: boolean; message: string; testCode?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const digits = cleanDigits(phone)
    if (digits.length < 7) {
      throw new AuthError(
        'auth/invalid-phone-number',
        'Please enter a valid phone number.'
      )
    }

    // Generate 6-digit OTP code (default standard test code 123456 or random)
    const code = '123456'
    const expiresAt = Date.now() + 3 * 60 * 1000 // 3 minutes validity

    const key = getPhoneKey(dialCode, phone)
    activeOtpSessions.set(key, {
      code,
      dialCode,
      phone: digits,
      expiresAt,
    })

    if (typeof console !== 'undefined') {
      console.info(
        `%c[S90 SPORT Auth] Verification OTP for ${dialCode} ${digits} is: ${code}`,
        'color: #0088ff; font-weight: bold;'
      )
    }

    return {
      success: true,
      message: 'Verification code sent successfully via SMS.',
      testCode: code,
    }
  },

  /**
   * Verify Phone OTP and log in / create user session
   */
  async verifyPhoneOtp(
    dialCode: string,
    phone: string,
    code: string
  ): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    const key = getPhoneKey(dialCode, phone)
    const session = activeOtpSessions.get(key)
    const digits = cleanDigits(phone)
    const trimmedCode = code.trim()

    // Test bypass code 123456 is always accepted in development/preview
    const isValidCode =
      (session && session.code === trimmedCode && Date.now() <= session.expiresAt) ||
      trimmedCode === '123456'

    if (!isValidCode) {
      if (session && Date.now() > session.expiresAt) {
        throw new AuthError(
          'auth/code-expired',
          'The verification code has expired. Please request a new code.'
        )
      }
      throw new AuthError(
        'auth/invalid-verification-code',
        'Invalid verification code. Please check the code and try again.'
      )
    }

    // Clear verified session
    activeOtpSessions.delete(key)

    // Check if phone matches existing account or create a phone user session
    const existing = registeredAccounts.find(
      (acc) =>
        acc.dialCode === dialCode && cleanDigits(acc.phone) === digits
    )

    if (existing) {
      assertNotBlocked(existing)
      linkSignInMethod(existing, 'phone')
      return {
        id: existing.id,
        name: existing.name,
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        dialCode: existing.dialCode,
        phone: existing.phone,
      }
    }

    // New phone verified user — recorded so the account (and its phone
    // sign-in) is known to the Admin and the same number maps to it next time.
    const newAccount: StoredAccount = {
      id: `usr_phone_${Date.now()}`,
      name: `User ${digits.slice(-4)}`,
      firstName: '',
      lastName: '',
      email: '',
      dialCode,
      phone: digits,
      passwordHash: '',
      signInMethods: ['phone'],
    }
    registeredAccounts.push(newAccount)

    return toAuthUser(newAccount)
  },

  /**
   * Official Google Sign-In
   */
  async loginWithGoogle(): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Demo Google profile (no real OAuth yet). Recorded as an account with
    // Google sign-in; an existing account with the same email gets Google linked.
    const profile = {
      id: 'usr_google_s90',
      name: 'Google Customer',
      firstName: 'Google',
      lastName: 'Customer',
      email: 'customer@gmail.com',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
    }
    let account = registeredAccounts.find(
      (acc) => acc.id === profile.id || acc.email.toLowerCase() === profile.email
    )
    if (account) {
      assertNotBlocked(account)
      linkSignInMethod(account, 'google')
    } else {
      account = {
        id: profile.id,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        dialCode: '',
        phone: '',
        passwordHash: '',
        signInMethods: ['google'],
      }
      registeredAccounts.push(account)
    }

    return { ...toAuthUser(account), photoURL: profile.photoURL }
  },

  /**
   * Register a new account
   */
  async signup(data: {
    firstName: string
    lastName: string
    email: string
    dialCode: string
    phone: string
    password: string
  }): Promise<AuthUser> {
    await new Promise((resolve) => setTimeout(resolve, 700))

    const cleanEmail = data.email.trim().toLowerCase()
    const cleanPhoneDigits = cleanDigits(data.phone)

    const emailExists = registeredAccounts.some(
      (acc) => acc.email.toLowerCase() === cleanEmail
    )
    if (emailExists) {
      throw new AuthError(
        'auth/email-already-in-use',
        'An account with this email address already exists. Please sign in instead.'
      )
    }

    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}`,
      name: `${data.firstName.trim()} ${data.lastName.trim()}`,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: cleanEmail,
      dialCode: data.dialCode,
      phone: cleanPhoneDigits,
      passwordHash: data.password, // In memory only
      signInMethods: ['email'],
    }

    registeredAccounts.push(newAccount)

    return {
      id: newAccount.id,
      name: newAccount.name,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
      email: newAccount.email,
      dialCode: newAccount.dialCode,
      phone: newAccount.phone,
    }
  },

  /**
   * Request password reset instructions via email
   */
  async sendPasswordResetEmail(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      throw new AuthError('auth/invalid-email', 'Please enter your email address.')
    }

    // Always succeed generically to prevent user enumeration attacks
    return {
      success: true,
      message: `A password reset link has been sent to ${cleanEmail}. Please check your inbox and follow the instructions.`,
    }
  },

  /**
   * Request password reset OTP via Phone
   */
  async sendPasswordResetPhoneOtp(
    dialCode: string,
    phone: string
  ): Promise<{ success: boolean; message: string; testCode?: string }> {
    return this.sendPhoneOtp(dialCode, phone)
  },

  /**
   * Verify Password Reset Phone OTP (Step 2)
   */
  async verifyPasswordResetPhoneOtp(
    dialCode: string,
    phone: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const key = getPhoneKey(dialCode, phone)
    const session = activeOtpSessions.get(key)
    const trimmedCode = otp.trim()

    const isValidCode =
      (session && session.code === trimmedCode && Date.now() <= session.expiresAt) ||
      trimmedCode === '123456'

    if (!isValidCode) {
      if (session && Date.now() > session.expiresAt) {
        throw new AuthError(
          'auth/code-expired',
          'The verification code has expired. Please request a new code.'
        )
      }
      throw new AuthError(
        'auth/invalid-verification-code',
        'Invalid verification code. Please try again.'
      )
    }

    if (session) {
      session.verified = true
    }

    return {
      success: true,
      message: 'Verification code verified successfully.',
    }
  },

  /**
   * Confirm password reset with phone OTP (Step 3)
   */
  async resetPasswordWithPhoneOtp(
    dialCode: string,
    phone: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    const key = getPhoneKey(dialCode, phone)
    const session = activeOtpSessions.get(key)
    const trimmedCode = otp.trim()
    const digits = cleanDigits(phone)

    const isValidCode =
      (session && (session.code === trimmedCode || session.verified) && Date.now() <= session.expiresAt) ||
      trimmedCode === '123456'

    if (!isValidCode) {
      throw new AuthError(
        'auth/invalid-verification-code',
        'Invalid verification code. Please try again.'
      )
    }

    // Clear session
    activeOtpSessions.delete(key)

    // Update password if account exists
    const account = registeredAccounts.find(
      (acc) => acc.dialCode === dialCode && cleanDigits(acc.phone) === digits
    )
    if (account) {
      account.passwordHash = newPassword
    }

    return {
      success: true,
      message: 'Your password has been successfully reset. You can now log in.',
    }
  },
}

/**
 * Read-only snapshot of the in-memory demo account registry, without password
 * fields. Used by the Admin Dashboard's Users page; includes accounts created
 * through Sign Up during the current browser session.
 */
export function listRegisteredAccounts(): AuthUser[] {
  return registeredAccounts.map((acc) => ({
    id: acc.id,
    name: acc.name,
    firstName: acc.firstName,
    lastName: acc.lastName,
    email: acc.email,
    dialCode: acc.dialCode,
    phone: acc.phone,
  }))
}

/** Account as listed in Admin › Users: public fields plus its linked sign-in methods. */
export interface AdminAccountRecord extends AuthUser {
  signInMethods: SignInMethod[]
}

/**
 * Read-only snapshot for the Admin Users page (no password fields). Sign-in
 * methods are those actually set up / used, recorded by the flows above.
 */
export function listAccountsWithSignIn(): AdminAccountRecord[] {
  return registeredAccounts.map((acc) => ({ ...toAuthUser(acc), signInMethods: [...acc.signInMethods] }))
}
