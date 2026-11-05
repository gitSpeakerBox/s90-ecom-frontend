/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import {
  type Country,
  COUNTRIES,
  DEFAULT_COUNTRY,
  COUNTRY_CURRENCY_MAP,
} from '../data/countries'
import i18n from '../i18n'

export type Language = 'en' | 'ar'

export interface LocaleContextType {
  language: Language
  setLanguage: (lang: Language) => void
  country: Country
  setCountry: (country: Country) => void
  currency: string
  countries: Country[]
  t: (key: string, options?: Record<string, unknown>) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const STORAGE_KEY_LANG = 's90_locale_lang'
const STORAGE_KEY_COUNTRY = 's90_locale_country'

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG)
      if (saved === 'ar' || saved === 'en') {
        // Sync document attributes immediately on load
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved
          document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
        }
        if (i18n.language !== saved) {
          i18n.changeLanguage(saved)
        }
        return saved
      }
    } catch {
      // localStorage unavailable (e.g. incognito)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en'
      document.documentElement.dir = 'ltr'
    }
    return 'en'
  })

  const [country, setCountryState] = useState<Country>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNTRY)
      if (saved) {
        const found = COUNTRIES.find((c) => c.name === saved)
        if (found) return found
      }
    } catch {
      // localStorage unavailable
    }
    return DEFAULT_COUNTRY
  })

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    if (i18n.language !== language) {
      i18n.changeLanguage(language)
    }
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language)
    } catch {
      // ignore
    }
  }, [language])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COUNTRY, country.name)
    } catch {
      // ignore
    }
  }, [country])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry)
  }

  const currency = COUNTRY_CURRENCY_MAP[country.name] || country.currency

  const t = (key: string, options?: Record<string, unknown>): string => {
    return i18n.t(key, { lng: language, ...options })
  }

  return (
    <LocaleContext.Provider
      value={{
        language,
        setLanguage,
        country,
        setCountry,
        currency,
        countries: COUNTRIES,
        t,
      }}
    >
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
