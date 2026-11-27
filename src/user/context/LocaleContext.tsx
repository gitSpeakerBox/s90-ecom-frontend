/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import {
  type Country,
  COUNTRIES,
  DEFAULT_COUNTRY,
  COUNTRY_CURRENCY_MAP,
  findCountryByCodeOrName,
} from '../../shared/data/countries'
import { BASE_CURRENCY, CHECKOUT_PAYMENT_CURRENCY } from '../../shared/constants/currency'
import { detectUserCountry } from '../services/geoService'
import i18n from '../i18n'

export type Language = 'en' | 'ar'

export interface LocaleContextType {
  language: Language
  setLanguage: (lang: Language) => void
  country: Country
  setCountry: (country: Country) => void
  /** Active display currency mapped to user's country or selection */
  currency: string
  /** Canonical base currency of product data in catalog (QAR) */
  baseCurrency: string
  /** Settlement/checkout payment currency (USD per requirement) */
  paymentCurrency: string
  countries: Country[]
  isDetectingCountry?: boolean
  t: (key: string, options?: Record<string, unknown>) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export const STORAGE_KEY_LANG = 's90_locale_lang'
export const STORAGE_KEY_COUNTRY = 's90_locale_country'
export const STORAGE_KEY_MANUAL_COUNTRY = 's90_country_manual'

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
        const found = findCountryByCodeOrName(saved) || COUNTRIES.find((c) => c.name === saved)
        if (found) return found
      }
    } catch {
      // localStorage unavailable
    }
    return DEFAULT_COUNTRY
  })

  const [isDetectingCountry, setIsDetectingCountry] = useState(false)

  // Track whether the country was manually chosen by the user
  const isManualRef = useRef<boolean>(false)
  useEffect(() => {
    try {
      isManualRef.current = localStorage.getItem(STORAGE_KEY_MANUAL_COUNTRY) === 'true'
    } catch {
      isManualRef.current = false
    }
  }, [])

  // Automatic IP-based country detection on website load
  useEffect(() => {
    let isCancelled = false

    // If user has already made a manual selection, do not overwrite it
    try {
      if (localStorage.getItem(STORAGE_KEY_MANUAL_COUNTRY) === 'true') {
        isManualRef.current = true
        return
      }
    } catch {
      // ignore
    }

    const runDetection = async () => {
      setIsDetectingCountry(true)
      try {
        const result = await detectUserCountry()
        if (isCancelled || isManualRef.current) return

        if (result.country) {
          setCountryState(result.country)
          try {
            localStorage.setItem(STORAGE_KEY_COUNTRY, result.country.name)
          } catch {
            // ignore
          }
        }
      } catch {
        // Fail gracefully to default country without disrupting UI
      } finally {
        if (!isCancelled) {
          setIsDetectingCountry(false)
        }
      }
    }

    runDetection()

    return () => {
      isCancelled = true
    }
  }, [])

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

  // Explicit handlers ensuring country changes NEVER mutate language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const setCountry = (newCountry: Country) => {
    // Explicit user action: flag as manual selection so IP detection won't override it
    isManualRef.current = true
    try {
      localStorage.setItem(STORAGE_KEY_MANUAL_COUNTRY, 'true')
      localStorage.setItem(STORAGE_KEY_COUNTRY, newCountry.name)
    } catch {
      // ignore
    }
    setCountryState(newCountry)
  }

  const currency = COUNTRY_CURRENCY_MAP[country.name] || country.currency || BASE_CURRENCY
  const baseCurrency = BASE_CURRENCY
  const paymentCurrency = CHECKOUT_PAYMENT_CURRENCY

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
        baseCurrency,
        paymentCurrency,
        countries: COUNTRIES,
        isDetectingCountry,
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
