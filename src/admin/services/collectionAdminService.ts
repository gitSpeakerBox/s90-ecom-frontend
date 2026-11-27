import {
  ALL_COLLECTION_CONFIGS,
  JERSEY_COLLECTIONS,
  SHOE_COLLECTIONS,
  getCollectionBySlug,
} from '../../user/data/collections'
import type { CollectionConfig, CollectionItem } from '../../user/data/collections'
import { jerseyCollectionCards, shoesCollectionCards } from '../../user/data/collectionBanners'
import { landingData } from '../../user/data/landing'
import { getPaginatedJerseys, getPaginatedShoes } from '../../user/services/productService'
import { isCollectionActive, setCollectionActive } from '../../shared/services/collectionAvailability'
import type { Product } from '../../shared/types/product'
import { ManagedList } from './managedList'
import { getText, setText } from './localeTextService'
import { slugify } from '../utils/format'

/**
 * Admin adapter over the existing collection definitions
 * (src/user/data/collections.ts → ALL_COLLECTION_CONFIGS). New collections are
 * added to that same list; nothing is duplicated.
 *
 * - Product membership uses the storefront's own collection filter
 *   (productService), so counts match /collection/:slug.
 * - Active / Inactive (shared/services/collectionAvailability) controls
 *   whether customers can see the collection at all. It is separate from the
 *   header-menu listing below, which is preserved unchanged.
 * - Names are the storefront translations (English / Arabic).
 * Everything except the Active status lives in memory for the session.
 */

const menus = {
  jersey: new ManagedList<CollectionItem>(JERSEY_COLLECTIONS),
  shoe: new ManagedList<CollectionItem>(SHOE_COLLECTIONS),
}

/** Menu items created by the admin for collections not originally in the menu. */
const createdMenuItems = new Map<string, CollectionItem>()

function slugFromLink(link: string): string {
  return getCollectionBySlug(link.replace(/^\/collections?\//, '')).slug
}

function menuItemFor(config: CollectionConfig): CollectionItem | undefined {
  const existing = menus[config.type].list().find((e) => slugFromLink(e.item.link) === config.slug)
  return existing?.item ?? createdMenuItems.get(config.slug)
}

export type CollectionTypeLabel = 'Jerseys' | 'Shoes'

export function typeLabel(type: CollectionConfig['type']): CollectionTypeLabel {
  return type === 'jersey' ? 'Jerseys' : 'Shoes'
}

export interface CollectionView {
  config: CollectionConfig
  name: string
  nameAr: string
  type: CollectionTypeLabel
  productCount: number
  active: boolean
}

export function collectionProducts(config: CollectionConfig): Product[] {
  // Admin view: include blocked products (the storefront hides them).
  const query = { filters: { category: config.category }, limit: 10_000, includeBlocked: true }
  return config.type === 'jersey' ? getPaginatedJerseys(query).items : getPaginatedShoes(query).items
}

export function collectionName(config: CollectionConfig, lang: 'en' | 'ar' = 'en'): string {
  return getText(config.titleKey, lang) || (lang === 'en' ? config.slug : '')
}

export function listCollections(): CollectionView[] {
  return ALL_COLLECTION_CONFIGS.map((config) => ({
    config,
    name: collectionName(config, 'en'),
    nameAr: collectionName(config, 'ar'),
    type: typeLabel(config.type),
    productCount: collectionProducts(config).length,
    active: isCollectionActive(config.slug),
  }))
}

export function getCollection(slug: string): CollectionConfig | undefined {
  return ALL_COLLECTION_CONFIGS.find((c) => c.slug === slug)
}

export function setActive(config: CollectionConfig, active: boolean): void {
  setCollectionActive(config.slug, active)
}

/* ───────────────────────────── Add / Edit ───────────────────────────── */

/** Fields of the Add / Edit Category form. */
export interface CategoryInput {
  name: string
  nameAr: string
  /** Section: 'shoe' (Shoes) or 'jersey' (Jerseys); '' until chosen. */
  type: CollectionConfig['type'] | ''
  /** Uploaded image (data URL), an existing image path, or '' for none. */
  image: string
}

export const CATEGORY_NAME_MAX = 48
const ARABIC_LETTERS = /\p{Script=Arabic}/u

/**
 * The category's current image: one uploaded in Admin, otherwise the image
 * its existing collection card / home-page category strip already uses.
 */
export function categoryImage(config: CollectionConfig): string {
  if (config.image) return config.image
  const path = `/collection/${config.slug}`
  const cards = config.type === 'jersey' ? jerseyCollectionCards : shoesCollectionCards
  const card = cards.find((c) => c.to === path)
  if (card?.image) return card.image
  const tiles = config.type === 'jersey' ? landingData.jerseysBanners.tiles : landingData.shoesBanners.tiles
  return tiles.find((t) => t.link === path && t.image)?.image ?? ''
}

export function validateCategory(
  input: CategoryInput,
  editing?: CollectionConfig
): Partial<Record<keyof CategoryInput, string>> {
  const errors: Partial<Record<keyof CategoryInput, string>> = {}
  const name = input.name.trim()
  const nameAr = input.nameAr.trim()
  const nameChanged = !editing || name.toLowerCase() !== collectionName(editing, 'en').toLowerCase()

  if (!name) errors.name = 'Enter the category name in English.'
  else if (name.length > CATEGORY_NAME_MAX) errors.name = `Use ${CATEGORY_NAME_MAX} characters or fewer.`
  else if (
    nameChanged &&
    ALL_COLLECTION_CONFIGS.some((c) => c !== editing && collectionName(c, 'en').toLowerCase() === name.toLowerCase())
  ) {
    errors.name = `A category named “${name}” already exists.`
  }

  if (!nameAr) errors.nameAr = 'Enter the category name in Arabic.'
  else if (nameAr.length > CATEGORY_NAME_MAX) errors.nameAr = `Use ${CATEGORY_NAME_MAX} characters or fewer.`
  else if (!ARABIC_LETTERS.test(nameAr)) errors.nameAr = 'Use Arabic characters for the Arabic name.'

  if (input.type !== 'shoe' && input.type !== 'jersey') errors.type = 'Choose Shoes or Jerseys.'

  return errors
}

function uniqueSlug(base: string): string {
  const root = slugify(base) || 'category'
  const taken = (s: string) =>
    ALL_COLLECTION_CONFIGS.some((c) => c.slug === s || (c.aliases ?? []).includes(s))
  let slug = root
  let i = 2
  while (taken(slug)) slug = `${root}-${i++}`
  return slug
}

/** A translation key used only by this category (created on first rename). */
function ownTitleKey(config: CollectionConfig): string {
  const own = `collections.custom.${config.slug}`
  if (config.titleKey === own) return own
  // Copy the current wording so the other language keeps its text.
  setText(own, 'en', getText(config.titleKey, 'en'))
  setText(own, 'ar', getText(config.titleKey, 'ar'))
  config.titleKey = own
  const item = menuItemFor(config)
  if (item) item.labelKey = own
  return own
}

/**
 * Creates a category in the existing collection list (same data source),
 * listed in its section's header menu and active. Its products come from the
 * storefront's standard name-based rule within the chosen section.
 */
export function createCategory(input: CategoryInput): CollectionConfig {
  const type: CollectionConfig['type'] = input.type === 'shoe' ? 'shoe' : 'jersey'
  const slug = uniqueSlug(input.name)
  const titleKey = `collections.custom.${slug}`
  setText(titleKey, 'en', input.name.trim())
  setText(titleKey, 'ar', input.nameAr.trim())
  const config: CollectionConfig = {
    slug,
    category: slug,
    type,
    parentPath: type === 'jersey' ? '/jerseys' : '/shoes',
    parentLabelKey: type === 'jersey' ? 'nav.jerseys' : 'nav.shoes',
    titleKey,
    aliases: [],
    image: input.image || undefined,
  }
  ALL_COLLECTION_CONFIGS.push(config)
  const item: CollectionItem = { id: slug, labelKey: titleKey, link: `/collection/${slug}`, category: config.category }
  createdMenuItems.set(slug, item)
  menus[config.type].add(item)
  setCollectionActive(slug, true)
  return config
}

/** Moves a category to the other section, keeping its menu entry's visibility. */
function changeType(config: CollectionConfig, type: CollectionConfig['type']): void {
  if (config.type === type) return
  const item = menuItemFor(config)
  const wasInMenu = item ? menus[config.type].position(item) !== null : false
  if (item) menus[config.type].setVisible(item, false)
  config.type = type
  config.parentPath = type === 'jersey' ? '/jerseys' : '/shoes'
  config.parentLabelKey = type === 'jersey' ? 'nav.jerseys' : 'nav.shoes'
  if (!item) return
  const target = menus[type]
  if (!target.list().some((e) => e.item === item)) target.add(item)
  target.setVisible(item, wasInMenu)
}

/**
 * Updates a category's names, type and image. Slug, product rule and Active
 * status are untouched, so its ID is preserved. Products are matched within
 * its section, so changing the type changes which products it shows.
 */
export function updateCategory(config: CollectionConfig, input: CategoryInput): void {
  const name = input.name.trim()
  const nameAr = input.nameAr.trim()
  if (name !== collectionName(config, 'en') || nameAr !== collectionName(config, 'ar')) {
    const key = ownTitleKey(config)
    setText(key, 'en', name)
    setText(key, 'ar', nameAr)
  }
  // Store only a changed image; an unchanged existing card/strip image stays derived.
  if (input.image !== categoryImage(config)) config.image = input.image || undefined
  if (input.type === 'shoe' || input.type === 'jersey') changeType(config, input.type)
}
