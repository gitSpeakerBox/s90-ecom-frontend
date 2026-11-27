/** Visual appearance of a regular badge on product cards. */
export type BadgeStyle = 'light' | 'dark' | 'sale' | 'gold' | 'green'

/** Badge category types supported in Admin › Badges. */
export type BadgeType = 'Normal Badge' | 'Sponsor Badge'

/**
 * A badge of either type (Normal Badge or Sponsor Badge) — the single badge
 * record. Products reference it by `name` through their existing `badges` array.
 */
export interface BadgeDefinition {
  id: string
  /**
   * Badge name in English. Also the reference stored on products
   * (`product.badges`); renaming updates those references.
   */
  name: string
  /** Badge name in Arabic. Empty only for untouched catalog badges (storefront translation applies). */
  nameAr: string
  /** Badge price in the catalog base currency (QAR). Not charged on the storefront in this phase. */
  price: number
  type: BadgeType
  /** Badge image (uploaded data URL), or '' when none. Sponsor Badges use it as their storefront logo. */
  image: string
  /**
   * Text the storefront shows per language, kept in sync with name / nameAr
   * whenever the badge is saved. Empty = keep the storefront's existing
   * translation (catalog badges that were never edited).
   */
  label: { en: string; ar: string }
  style: BadgeStyle
  active: boolean
  /** True for the badges that already existed in the catalog data. */
  builtIn: boolean
}

/**
 * Storefront view of an active Sponsor Badge (derived from a BadgeDefinition
 * of type 'Sponsor Badge' by visibleSponsorsFor). Not stored separately.
 */
export interface SponsorBadge {
  id: string
  name: string
  /** The badge image, shown as the sponsor logo. */
  logo: string
  active: boolean
}
