import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import ar from '../locales/ar.json'

const isDev = import.meta.env.DEV

// Determine initial language from localStorage or default to 'en'
const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('s90_locale_lang')
      if (saved === 'ar' || saved === 'en') return saved
    } catch {
      // localStorage unavailable
    }
  }
  return 'en'
}

const initialLang = getInitialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    saveMissing: isDev,
    missingKeyHandler: (lngs, ns, key) => {
      if (isDev) {
        console.warn(`[i18n] Missing key "${key}" for language(s): ${lngs.join(', ')} in namespace "${ns}"`)
      }
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n

