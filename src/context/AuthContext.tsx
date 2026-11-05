/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

export interface User {
  name: string
  email?: string
}

export interface AuthContextType {
  user: User | null
  login: (name?: string) => void
  logout: () => void
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
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH)
      }
    } catch {
      // ignore
    }
  }, [user])

  const login = (name: string = 'Alex Mercer') => {
    setUser({ name, email: 'alex@example.com' })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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

