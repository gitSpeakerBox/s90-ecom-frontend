/**
 * Authentication Form Validation Utilities
 * Validates email, password strength, phone numbers, and confirmation fields.
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export function validateEmail(
  email: string,
  messages?: { required?: string; invalid?: string }
): ValidationResult {
  const trimmed = email.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: messages?.required || 'Email address is required',
    }
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: messages?.invalid || 'Please enter a valid email address (e.g. name@domain.com)',
    }
  }

  return { isValid: true }
}

export function validatePassword(
  password: string,
  messages?: { required?: string; minLength?: string; complexity?: string }
): ValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: messages?.required || 'Password is required',
    }
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: messages?.minLength || 'Password must be at least 8 characters long',
    }
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      error: messages?.complexity || 'Password must contain at least one letter and one number',
    }
  }

  return { isValid: true }
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
  messages?: { required?: string; mismatch?: string }
): ValidationResult {
  if (!confirmPassword) {
    return {
      isValid: false,
      error: messages?.required || 'Please confirm your password',
    }
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: messages?.mismatch || 'Passwords do not match',
    }
  }

  return { isValid: true }
}

export function validatePhoneNumber(
  phone: string,
  expectedDigits?: number | [number, number],
  messages?: { required?: string; invalid?: string }
): ValidationResult {
  const digits = phone.replace(/\D/g, '')

  if (!digits) {
    return {
      isValid: false,
      error: messages?.required || 'Phone number is required',
    }
  }

  if (expectedDigits) {
    if (typeof expectedDigits === 'number') {
      if (digits.length !== expectedDigits) {
        return {
          isValid: false,
          error:
            messages?.invalid ||
            `Phone number must be exactly ${expectedDigits} digits`,
        }
      }
    } else if (Array.isArray(expectedDigits) && expectedDigits.length === 2) {
      const [min, max] = expectedDigits
      if (digits.length < min || digits.length > max) {
        return {
          isValid: false,
          error:
            messages?.invalid ||
            `Phone number must be between ${min} and ${max} digits`,
        }
      }
    }
  } else {
    // Default international phone digit range: 7 to 15 digits
    if (digits.length < 7 || digits.length > 15) {
      return {
        isValid: false,
        error: messages?.invalid || 'Please enter a valid phone number (7-15 digits)',
      }
    }
  }

  return { isValid: true }
}

export function validateName(
  name: string,
  fieldName = 'Name',
  messages?: { required?: string; minLength?: string }
): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: messages?.required || `${fieldName} is required`,
    }
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: messages?.minLength || `${fieldName} must be at least 2 characters`,
    }
  }

  return { isValid: true }
}

export function validateOtp(
  otp: string,
  length = 6,
  messages?: { required?: string; invalid?: string }
): ValidationResult {
  const trimmed = otp.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: messages?.required || 'Verification code is required',
    }
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length !== length) {
    return {
      isValid: false,
      error: messages?.invalid || `Please enter the ${length}-digit verification code`,
    }
  }

  return { isValid: true }
}

export function validateTerms(
  accepted: boolean,
  message?: string
): ValidationResult {
  if (!accepted) {
    return {
      isValid: false,
      error: message || 'You must agree to the Terms & Conditions and Privacy Policy',
    }
  }
  return { isValid: true }
}
