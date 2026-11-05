import i18n from '../i18n'
import en from './en.json'
import ar from './ar.json'

export type Locale = 'en' | 'ar'
export type TranslationKey = keyof typeof en

export const translations = {
  en,
  ar,
} as const

export function t(
  key: string,
  langOrOptions?: Locale | Record<string, unknown>,
  options?: Record<string, unknown>
): string {
  if (typeof langOrOptions === 'string') {
    return i18n.t(key, { lng: langOrOptions, ...options })
  }
  return i18n.t(key, langOrOptions)
}

export { en, ar }
export default i18n
