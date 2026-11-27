/**
 * Badge registry — ONE data source for both badge types.
 *
 * Every badge (Normal Badge or Sponsor Badge) is a BadgeDefinition in the
 * single `badges` list below; its `type` field says which kind it is.
 * There is no separate sponsor dataset.
 *
 * Product associations use the products' existing `badges` array (badge
 * names) for both types, so changing a badge's type never touches product
 * data. On the storefront:
 * - Normal Badges show as the product-card overlay / product-page label
 *   (visibleBadgesFor).
 * - Sponsor Badges show as logos (visibleSponsorsFor).
 * Inactive badges stay attached to products but are never shown.
 *
 * Seeded from the badge names already in the catalog. Everything lives in
 * memory for the session (no backend yet), like the other Admin catalog edits.
 */

import { allProducts } from '../data/products'
import type { BuiltInProductBadge, Product } from '../types/product'
import type { BadgeDefinition, BadgeType, SponsorBadge } from '../types/badge'

/** Built-in badge names, in the order of the ProductBadge type. */
const BUILT_IN: BuiltInProductBadge[] = ['New Arrival', 'Best Seller', 'Sale', 'Featured', 'Limited Edition', 'Trending']

/** The two badge types — the only options of the Add / Edit Badge form. */
export const BADGE_TYPES: BadgeType[] = ['Normal Badge', 'Sponsor Badge']

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function seedBadges(): BadgeDefinition[] {
  const names: string[] = [...BUILT_IN]
  // Include any other badge names already present in the catalog data.
  for (const p of allProducts) for (const b of p.badges) if (!names.includes(b)) names.push(b)
  return names.map((name) => ({
    id: `badge-${slug(name)}`,
    name,
    // Empty until edited: the storefront keeps its existing Arabic translation.
    nameAr: '',
    // The catalog data has no badge prices or images.
    price: 0,
    type: 'Normal Badge',
    image: '',
    label: { en: '', ar: '' },
    style: 'light',
    active: true,
    builtIn: (BUILT_IN as string[]).includes(name),
  }))
}

const badges: BadgeDefinition[] = seedBadges()

/* ─────────────────────────────── Queries ─────────────────────────────── */

/** All badges, or only those of one type. */
export function listBadges(type: BadgeType | 'all' = 'all'): BadgeDefinition[] {
  return type === 'all' ? badges : badges.filter((b) => b.type === type)
}

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return badges.find((b) => b.id === id)
}

export function getBadgeByName(name: string): BadgeDefinition | undefined {
  return badges.find((b) => b.name.toLowerCase() === name.toLowerCase())
}

/** Products associated with this badge (by name), whether or not it is active. */
export function productsWithBadge(name: string): Product[] {
  return allProducts.filter((p) => p.badges.includes(name))
}

/**
 * Normal Badges a customer should see on a product, in the product's own
 * order. Names without a registry entry are treated as active Normal Badges,
 * preserving the previous behaviour for any unexpected data.
 */
export function visibleBadgesFor(product: Product): BadgeDefinition[] {
  const result: BadgeDefinition[] = []
  for (const name of product.badges) {
    const def = getBadgeByName(name)
    if (!def) {
      result.push({
        id: `badge-${slug(name)}`,
        name,
        nameAr: '',
        price: 0,
        type: 'Normal Badge',
        image: '',
        label: { en: '', ar: '' },
        style: 'light',
        active: true,
        builtIn: false,
      })
    } else if (def.active && def.type === 'Normal Badge') {
      result.push(def)
    }
  }
  return result
}

/** Active Sponsor Badges (with an image) to show as logos on a product. */
export function visibleSponsorsFor(product: Product): SponsorBadge[] {
  const result: SponsorBadge[] = []
  for (const name of product.badges) {
    const def = getBadgeByName(name)
    if (def && def.type === 'Sponsor Badge' && def.active && def.image) {
      result.push({ id: def.id, name: def.name, logo: def.image, active: def.active })
    }
  }
  return result
}

/* ───────────────────────────── Add / Edit ───────────────────────────── */

/** Fields of the Add / Edit Badge form. */
export interface BadgeInput {
  name: string
  nameAr: string
  /** Raw text from the price input (validated, then parsed). */
  price: string
  type: BadgeType
  image: string
}

const ARABIC_LETTERS = /\p{Script=Arabic}/u
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/
export const BADGE_NAME_MAX = 40
export const BADGE_PRICE_MAX = 100000

/** Field-keyed validation messages (empty object = valid). */
export function validateBadge(input: BadgeInput, editing?: BadgeDefinition): Partial<Record<keyof BadgeInput, string>> {
  const errors: Partial<Record<keyof BadgeInput, string>> = {}
  const name = input.name.trim()
  const nameAr = input.nameAr.trim()
  const price = input.price.trim()

  if (!name) errors.name = 'Enter the badge name in English.'
  else if (name.length > BADGE_NAME_MAX) errors.name = `Use ${BADGE_NAME_MAX} characters or fewer.`
  else if (badges.some((b) => b !== editing && b.name.toLowerCase() === name.toLowerCase())) {
    errors.name = `A badge named “${name}” already exists.`
  }

  if (!nameAr) errors.nameAr = 'Enter the badge name in Arabic.'
  else if (nameAr.length > BADGE_NAME_MAX) errors.nameAr = `Use ${BADGE_NAME_MAX} characters or fewer.`
  else if (!ARABIC_LETTERS.test(nameAr)) errors.nameAr = 'Use Arabic characters for the Arabic name.'

  if (!price) errors.price = 'Enter a price (0 for free).'
  else if (price.startsWith('-')) errors.price = 'Price cannot be negative.'
  else if (!PRICE_PATTERN.test(price)) errors.price = 'Enter a number with up to 2 decimal places, e.g. 11 or 11.50.'
  else if (Number(price) > BADGE_PRICE_MAX) errors.price = `Price must be ${BADGE_PRICE_MAX.toLocaleString('en')} or less.`

  if (!BADGE_TYPES.includes(input.type)) errors.type = 'Choose Normal Badge or Sponsor Badge.'

  return errors
}

function applyInput(badge: BadgeDefinition, input: BadgeInput): void {
  badge.name = input.name.trim()
  badge.nameAr = input.nameAr.trim()
  badge.price = Math.round(Number(input.price.trim()) * 100) / 100
  badge.type = input.type
  badge.image = input.image
  // The storefront shows these names from now on.
  badge.label = { en: badge.name, ar: badge.nameAr }
}

/** Creates a badge of either type from validated form input (active, no products). */
export function createBadge(input: BadgeInput): BadgeDefinition {
  const name = input.name.trim()
  const base = `badge-${slug(name) || 'custom'}`
  let id = base
  let i = 2
  while (badges.some((b) => b.id === id)) id = `${base}-${i++}`
  const badge: BadgeDefinition = {
    id,
    name,
    nameAr: '',
    price: 0,
    type: input.type,
    image: '',
    label: { en: '', ar: '' },
    style: 'light',
    active: true,
    builtIn: false,
  }
  applyInput(badge, input)
  badges.push(badge)
  return badge
}

/**
 * Updates a badge (including its type) from validated form input. If the
 * English name changes, product references are renamed so associations are
 * kept. A type change needs no product changes: both types use `badges`.
 */
export function updateBadge(badge: BadgeDefinition, input: BadgeInput): void {
  const oldName = badge.name
  applyInput(badge, input)
  if (badge.name !== oldName) {
    for (const p of allProducts) {
      if (p.badges.includes(oldName)) p.badges = p.badges.map((b) => (b === oldName ? badge.name : b))
    }
  }
}

export function setBadgeActive(badge: BadgeDefinition, active: boolean): void {
  badge.active = active
}

/**
 * Sets exactly which products carry the badge: adds the name to newly
 * selected products (after their existing badges) and removes it from
 * deselected ones. Other badges on the products are untouched.
 */
export function setBadgeProducts(badge: BadgeDefinition, productIds: string[]): void {
  const wanted = new Set(productIds)
  for (const p of allProducts) {
    const has = p.badges.includes(badge.name)
    if (wanted.has(p.id) && !has) p.badges = [...p.badges, badge.name]
    else if (!wanted.has(p.id) && has) p.badges = p.badges.filter((b) => b !== badge.name)
  }
}

/** Deletes the badge and removes it from every product. */
export function deleteBadge(badge: BadgeDefinition): void {
  setBadgeProducts(badge, [])
  const i = badges.indexOf(badge)
  if (i >= 0) badges.splice(i, 1)
}
