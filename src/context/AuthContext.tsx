/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { authService, type AuthUser } from '../services/authService'

export interface User {
  id?: string
  name: string
  email?: string
  phone?: string
  dialCode?: string
  firstName?: string
  lastName?: string
  photoURL?: string
}

export interface AuthContextType {
  user: User | null
  login: (name?: string, email?: string) => void
  logout: () => void
  loginWithEmail: (email: string, password: string) => Promise<User>
  loginWithPhone: (dialCode: string, phone: string, otp: string) => Promise<User>
  sendPhoneOtp: (dialCode: string, phone: string) => Promise<void>
  loginWithGoogle: () => Promise<User>
  signup: (data: {
    firstName: string
    lastName: string
    email: string
    dialCode: string
    phone: string
    password: string
  }) => Promise<User>
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; message: string }>
  sendPasswordResetPhoneOtp: (dialCode: string, phone: string) => Promise<{ success: boolean; message: string }>
  verifyPasswordResetPhoneOtp: (
    dialCode: string,
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; message: string }>
  resetPasswordWithPhoneOtp: (
    dialCode: string,
    phone: string,
    otp: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY_AUTH = 's90_mock_user'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return null
  })

  useEffect(() => {
    try {
      if (user) {
        // Only persist public user identity, never credentials or sensitive tokens
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH)
      }
    } catch {
      // ignore
    }
  }, [user])

  const mapAuthUser = (authUser: AuthUser): User => ({
    id: authUser.id,
    name: authUser.name,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    dialCode: authUser.dialCode,
    phone: authUser.phone,
    photoURL: authUser.photoURL,
  })

  // Backwards-compatible mock login handler
  const login = useCallback((name: string = 'Alex Mercer', email: string = 'alex@example.com') => {
    setUser({ name, email })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<User> => {
    const authUser = await authService.loginWithEmail(email, password)
    const mapped = mapAuthUser(authUser)
    setUser(mapped)
    return mapped
  }, [])

  const loginWithPhone = useCallback(
    async (dialCode: string, phone: string, otp: string): Promise<User> => {
      const authUser = await authService.verifyPhoneOtp(dialCode, phone, otp)
      const mapped = mapAuthUser(authUser)
      setUser(mapped)
      return mapped
    },
    []
  )

  const sendPhoneOtp = useCallback(async (dialCode: string, phone: string): Promise<void> => {
    await authService.sendPhoneOtp(dialCode, phone)
  }, [])

  const loginWithGoogle = useCallback(async (): Promise<User> => {
    const authUser = await authService.loginWithGoogle()
    const mapped = mapAuthUser(authUser)
    setUser(mapped)
    return mapped
  }, [])

  const signup = useCallback(
    async (data: {
      firstName: string
      lastName: string
      email: string
      dialCode: string
      phone: string
      password: string
    }): Promise<User> => {
      const authUser = await authService.signup(data)
      const mapped = mapAuthUser(authUser)
      setUser(mapped)
      return mapped
    },
    []
  )

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    return authService.sendPasswordResetEmail(email)
  }, [])

  const sendPasswordResetPhoneOtp = useCallback(async (dialCode: string, phone: string) => {
    return authService.sendPasswordResetPhoneOtp(dialCode, phone)
  }, [])

  const verifyPasswordResetPhoneOtp = useCallback(
    async (dialCode: string, phone: string, otp: string) => {
      return authService.verifyPasswordResetPhoneOtp(dialCode, phone, otp)
    },
    []
  )

  const resetPasswordWithPhoneOtp = useCallback(
    async (dialCode: string, phone: string, otp: string, newPassword: string) => {
      return authService.resetPasswordWithPhoneOtp(dialCode, phone, otp, newPassword)
    },
    []
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loginWithEmail,
        loginWithPhone,
        sendPhoneOtp,
        loginWithGoogle,
        signup,
        sendPasswordResetEmail,
        sendPasswordResetPhoneOtp,
        verifyPasswordResetPhoneOtp,
        resetPasswordWithPhoneOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
