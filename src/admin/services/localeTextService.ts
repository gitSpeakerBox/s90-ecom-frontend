import i18n from '../../user/i18n'

/**
 * Read/write access to the storefront's existing translation resources
 * (src/user/locales/*.json, loaded into the storefront i18next instance).
 * Writes use i18next's runtime resource API, so edited copy appears on the
 * storefront for the rest of the browser session. Nothing is written to disk.
 */

export type AdminLocale = 'en' | 'ar'

export const ADMIN_LOCALES: { code: AdminLocale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
]

export function getText(key: string | undefined, lang: AdminLocale): string {
  if (!key) return ''
  const value: unknown = i18n.getResource(lang, 'translation', key)
  return typeof value === 'string' ? value : ''
}

export function setText(key: string, lang: AdminLocale, value: string): void {
  i18n.addResource(lang, 'translation', key, value)
}

/** Copy is stored with "\n" line breaks for the hero layout; show it flattened. */
export function singleLine(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').trim()
}
