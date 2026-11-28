import {
  jerseysPageHeroSlides,
  landingData,
  landingHeroSlides,
  landingShoesHeroSlides,
  shoesPageHeroSlides,
} from '../../user/data/landing'
import type { LandingHeroSlideItem } from '../../user/data/landing'
import { NEUTRAL_CARD_BG, jerseyCollectionCards, shoesCollectionCards } from '../../user/data/collectionBanners'
import type { CollectionBannerCard } from '../../user/data/collectionBanners'
import type { BannerTile } from '../../user/types/landing'
import { ALL_COLLECTION_CONFIGS, collectionForPath } from '../../user/data/collections'
import { ManagedList } from './managedList'
import { collectionName, typeLabel } from './collectionAdminService'
import { isCollectionActive } from '../../shared/services/collectionAvailability'
import { getText, setText, singleLine } from './localeTextService'
import { heroTitleKey } from '../../user/services/landingService'

/* ───────────────────────────── Hero banners ───────────────────────────── */

/** Storefront section a hero banner appears in. */
export type HeroBannerType = 'Home' | 'Jerseys' | 'Shoes'

export const HERO_BANNER_TYPES: HeroBannerType[] = ['Home', 'Jerseys', 'Shoes']

/** Section of the Home page a Home banner (hero or sub) appears in. */
export type HomePlacement = 'Jerseys' | 'Shoes'

export const HOME_PLACEMENTS: HomePlacement[] = ['Jerseys', 'Shoes']

const HOME_PLACEMENT_ERROR = 'Choose the Home page section: Jerseys or Shoes.'

export interface HeroGroup {
  id: 'home-top' | 'home-second' | 'jerseys-page' | 'shoes-page'
  type: HeroBannerType
  /** Home page section (Home groups only); kept apart from the type. */
  homePlacement: HomePlacement | null
  placement: string
  list: ManagedList<LandingHeroSlideItem>
}

/**
 * The existing hero slider data (src/user/data/landing.ts) — no copies:
 * - Home: the two sliders on "/" (landingHeroSlides, landingShoesHeroSlides).
 * - Jerseys / Shoes: the /jerseys and /shoes page heroes.
 * "Active" = shown; a blocked banner is kept here but removed from the array
 * the storefront reads (see ManagedList). Memory only, like other edits.
 */
export const HERO_GROUPS: HeroGroup[] = [
  { id: 'home-top', type: 'Home', homePlacement: 'Jerseys', placement: 'Home page · top slider', list: new ManagedList(landingHeroSlides) },
  { id: 'home-second', type: 'Home', homePlacement: 'Shoes', placement: 'Home page · second slider', list: new ManagedList(landingShoesHeroSlides) },
  { id: 'jerseys-page', type: 'Jerseys', homePlacement: null, placement: 'Jerseys page hero', list: new ManagedList(jerseysPageHeroSlides) },
  { id: 'shoes-page', type: 'Shoes', homePlacement: null, placement: 'Shoes page hero', list: new ManagedList(shoesPageHeroSlides) },
]

/**
 * Section a banner of this type / Home placement goes in:
 * Home + Jerseys → Home page jerseys slider, Home + Shoes → Home page shoes
 * slider, Jerseys → /jerseys hero, Shoes → /shoes hero.
 */
function heroTargetGroup(type: HeroBannerType, homePlacement: HomePlacement | ''): HeroGroup {
  return HERO_GROUPS.find((g) => g.type === type && (type !== 'Home' || g.homePlacement === homePlacement))!
}

export interface HeroBannerView {
  key: string
  group: HeroGroup
  slide: LandingHeroSlideItem
  type: HeroBannerType
  active: boolean
  image: string
  /** Headline (English), single line: the selected category's name, else the banner's own headline. */
  name: string
}

export function listHeroBanners(): HeroBannerView[] {
  const rows: HeroBannerView[] = []
  for (const group of HERO_GROUPS) {
    for (const e of group.list.list()) {
      rows.push({
        key: `${group.id}:${e.item.id}`,
        group,
        slide: e.item,
        type: group.type,
        active: e.visible,
        image: e.item.image,
        name: singleLine(getText(heroTitleKey(e.item), 'en')) || e.item.id,
      })
    }
  }
  return rows
}

export function setHeroBannerActive(row: HeroBannerView, active: boolean): void {
  row.group.list.setVisible(row.slide, active)
}

export function deleteHeroBanner(row: HeroBannerView): void {
  row.group.list.remove(row.slide)
}

/** Fields of the Add / Edit Hero Banner form. */
export interface HeroBannerInput {
  type: HeroBannerType | ''
  /** Home page section; required (and only kept) when type is Home. */
  homePlacement: HomePlacement | ''
  /** Supporting text shown under the headline (English). */
  text: string
  /** Supporting text shown under the headline (Arabic). */
  textAr: string
  /** Category ID (collection slug) the banner links to; its name is the banner's headline. '' until chosen. */
  category: string
  /** Image path or uploaded data URL. */
  image: string
}

export interface HeroCategoryOption {
  value: string
  label: string
  type: 'Jerseys' | 'Shoes'
  active: boolean
}

/** Category options for the banner form: every category in Admin › Categories (live). */
export function heroCategoryOptions(): HeroCategoryOption[] {
  return ALL_COLLECTION_CONFIGS.map((c) => ({
    value: c.slug,
    label: collectionName(c, 'en'),
    type: typeLabel(c.type),
    active: isCollectionActive(c.slug),
  }))
}

/** Storefront page of a category (the existing collection listing route). */
export function categoryPath(slug: string): string {
  return `/collection/${slug}`
}

/** Button label for banners that link to a category (fits any category). */
const CATEGORY_BUTTON_KEY = 'hero.shopNow'

export const HERO_TEXT_MAX = 160
const ARABIC_LETTERS = /\p{Script=Arabic}/u

/** Form values for an existing banner. Line breaks in stored copy show as spaces. */
export function heroBannerValues(row: HeroBannerView): HeroBannerInput {
  return {
    type: row.type,
    homePlacement: row.group.homePlacement ?? '',
    text: singleLine(getText(row.slide.textKey, 'en')),
    textAr: singleLine(getText(row.slide.textKey, 'ar')),
    // Previously selected category, if it still exists.
    category: ALL_COLLECTION_CONFIGS.some((c) => c.slug === row.slide.categorySlug) ? (row.slide.categorySlug ?? '') : '',
    image: row.slide.image,
  }
}

export function validateHeroBanner(input: HeroBannerInput): Partial<Record<keyof HeroBannerInput, string>> {
  const errors: Partial<Record<keyof HeroBannerInput, string>> = {}
  if (!input.type || !HERO_BANNER_TYPES.includes(input.type)) errors.type = 'Choose Home, Jerseys or Shoes.'
  else if (input.type === 'Home' && !HOME_PLACEMENTS.includes(input.homePlacement as HomePlacement)) errors.homePlacement = HOME_PLACEMENT_ERROR
  // Banner text is optional in both languages; checked only when entered.
  const text = input.text.trim()
  const textAr = input.textAr.trim()
  if (text.length > HERO_TEXT_MAX) errors.text = `Use ${HERO_TEXT_MAX} characters or fewer.`
  if (textAr.length > HERO_TEXT_MAX) errors.textAr = `Use ${HERO_TEXT_MAX} characters or fewer.`
  else if (textAr && !ARABIC_LETTERS.test(textAr)) errors.textAr = 'Use Arabic characters for the Arabic banner text.'
  if (!input.category) errors.category = 'Choose the category this banner links to.'
  else if (!ALL_COLLECTION_CONFIGS.some((c) => c.slug === input.category)) errors.category = 'Choose a category from the list.'
  if (!input.image) errors.image = 'Add a banner image.'
  return errors
}

/**
 * Gives a slide its own banner-text key (copying both languages) before its
 * text is edited, so banners that shared keys (e.g. the Home and Jerseys page
 * heroes) are never changed together. The headline is the category's name.
 */
function ownTextKey(slide: LandingHeroSlideItem): void {
  const textKey = `hero.custom.${slide.id}.text`
  if (slide.textKey !== textKey) {
    setText(textKey, 'en', getText(slide.textKey, 'en'))
    setText(textKey, 'ar', getText(slide.textKey, 'ar'))
    slide.textKey = textKey
  }
}

/** Creates an active banner in its type's storefront section. */
export function createHeroBanner(input: HeroBannerInput): LandingHeroSlideItem {
  const type = input.type as HeroBannerType
  let n = 1
  const taken = (id: string) => HERO_GROUPS.some((g) => g.list.list().some((e) => e.item.id === id))
  while (taken(`hero-banner-${n}`)) n++
  const id = `hero-banner-${n}`
  const slide: LandingHeroSlideItem = {
    id,
    image: input.image,
    eyebrowKey: `hero.custom.${id}.eyebrow`,
    // Headline = the selected category's name (storefront: heroTitleKey); no text of its own.
    titleKey: ALL_COLLECTION_CONFIGS.find((c) => c.slug === input.category)?.titleKey ?? '',
    textKey: `hero.custom.${id}.text`,
    buttonLabelKey: CATEGORY_BUTTON_KEY,
    // The banner opens its selected category's listing page.
    to: categoryPath(input.category),
    categorySlug: input.category,
  }
  setText(slide.eyebrowKey, 'en', '')
  // Both languages are always written: an empty text renders as nothing, never as a key.
  setText(slide.textKey, 'en', input.text.trim())
  setText(slide.textKey, 'ar', input.textAr.trim())
  heroTargetGroup(type, input.homePlacement).list.add(slide)
  return slide
}

/** Updates a banner; a new type or Home placement moves it to that section (keeping its Active state). */
export function updateHeroBanner(row: HeroBannerView, input: HeroBannerInput): void {
  const current = heroBannerValues(row)
  const slide = row.slide
  const changed = (['text', 'textAr'] as const).filter((k) => input[k].trim() !== current[k])
  if (changed.length > 0) {
    ownTextKey(slide)
    // Only changed fields are written, so untouched copy keeps its original line breaks.
    if (changed.includes('text')) setText(slide.textKey, 'en', input.text.trim())
    if (changed.includes('textAr')) setText(slide.textKey, 'ar', input.textAr.trim())
  }
  slide.image = input.image
  if (slide.categorySlug !== input.category) {
    // Link the banner to its (new) category page; a section-specific button
    // label such as "SHOP ALL JERSEYS" no longer fits, so use "SHOP NOW".
    slide.categorySlug = input.category
    slide.to = categoryPath(input.category)
    slide.action = undefined
    slide.buttonLabelKey = CATEGORY_BUTTON_KEY
  }
  const targetGroup = heroTargetGroup(input.type as HeroBannerType, input.homePlacement)
  if (targetGroup !== row.group) {
    const wasActive = row.active
    row.group.list.remove(slide)
    const target = targetGroup.list
    target.add(slide)
    if (!wasActive) target.setVisible(slide, false)
  }
}

/* ───────────────────────────── Sub banners ────────────────────────────── */

/** Storefront section a sub banner appears in. */
export type SubBannerType = 'home' | 'jerseys' | 'shoes'

/** Type options of the Add / Edit form. */
export const SUB_BANNER_TYPE_OPTIONS: { value: SubBannerType; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'jerseys', label: 'Jerseys' },
  { value: 'shoes', label: 'Shoes' },
]

/** Type as shown in the listing table. */
export const SUB_BANNER_TYPE_LABEL: Record<SubBannerType, string> = {
  home: 'Home',
  jerseys: 'Jersey Home',
  shoes: 'Shoes Home',
}

type SubBannerItem = BannerTile | CollectionBannerCard

/**
 * The existing sub-banner data — no copies:
 * - Home: the two category strips on "/" (landingData.jerseysBanners /
 *   shoesBanners tiles, rendered by SubBannerRow).
 * - Jerseys / Shoes: the collection cards on /jerseys and /shoes
 *   (collectionBanners.ts, rendered by CollectionSubBanner).
 * "Active" = shown; a blocked banner stays here but is removed from the array
 * the storefront reads (see ManagedList). Memory only, like other edits.
 */
export interface SubBannerGroup {
  id: 'home-jerseys-strip' | 'home-shoes-strip' | 'jerseys-cards' | 'shoes-cards'
  type: SubBannerType
  /** Home page section (Home groups only); kept apart from the type. */
  homePlacement: HomePlacement | null
  kind: 'tile' | 'card'
  list: ManagedList<SubBannerItem>
}

export const SUB_BANNER_GROUPS: SubBannerGroup[] = [
  { id: 'home-jerseys-strip', type: 'home', homePlacement: 'Jerseys', kind: 'tile', list: new ManagedList<SubBannerItem>(landingData.jerseysBanners.tiles) },
  { id: 'home-shoes-strip', type: 'home', homePlacement: 'Shoes', kind: 'tile', list: new ManagedList<SubBannerItem>(landingData.shoesBanners.tiles) },
  { id: 'jerseys-cards', type: 'jerseys', homePlacement: null, kind: 'card', list: new ManagedList<SubBannerItem>(jerseyCollectionCards) },
  { id: 'shoes-cards', type: 'shoes', homePlacement: null, kind: 'card', list: new ManagedList<SubBannerItem>(shoesCollectionCards) },
]

/**
 * Section a banner of this type / Home placement goes in:
 * Home + Jerseys → Home page jerseys row, Home + Shoes → Home page shoes row,
 * Jerseys → /jerseys collection cards, Shoes → /shoes collection cards.
 */
function subTargetGroup(type: SubBannerType, homePlacement: HomePlacement | ''): SubBannerGroup {
  return SUB_BANNER_GROUPS.find((g) => g.type === type && (type !== 'home' || g.homePlacement === homePlacement))!
}

export type SubBannerRecord = { kind: 'tile'; item: BannerTile } | { kind: 'card'; item: CollectionBannerCard }

export interface SubBannerView {
  key: string
  group: SubBannerGroup
  record: SubBannerRecord
  type: SubBannerType
  /** Selected category's name (English) — the name customers see on the banner. */
  name: string
  image: string
  active: boolean
}

function asRecord(group: SubBannerGroup, item: SubBannerItem): SubBannerRecord {
  return group.kind === 'tile'
    ? { kind: 'tile', item: item as BannerTile }
    : { kind: 'card', item: item as CollectionBannerCard }
}

/** Fields of the Add / Edit Sub Banner form. */
export interface SubBannerInput {
  type: SubBannerType | ''
  /** Home page section; required (and only kept) when type is Home. */
  homePlacement: HomePlacement | ''
  /** Category ID (collection slug); '' until chosen. */
  category: string
  /** Image path or uploaded data URL. */
  image: string
}

/**
 * Category the banner links to: its saved category, else the category its
 * existing link points at (all original records link to a category page).
 */
function subBannerCategory(record: SubBannerRecord): string {
  const saved = record.item.categorySlug
  if (saved && ALL_COLLECTION_CONFIGS.some((c) => c.slug === saved)) return saved
  const link = record.kind === 'tile' ? record.item.link : record.item.to
  return collectionForPath(link)?.slug ?? ''
}

export function listSubBanners(): SubBannerView[] {
  const rows: SubBannerView[] = []
  for (const group of SUB_BANNER_GROUPS) {
    for (const e of group.list.list()) {
      const record = asRecord(group, e.item)
      const config = ALL_COLLECTION_CONFIGS.find((c) => c.slug === subBannerCategory(record))
      rows.push({
        key: `${group.id}:${e.item.id}`,
        group,
        record,
        type: group.type,
        name: config ? collectionName(config, 'en') : e.item.id,
        image: record.kind === 'tile' ? (record.item.image ?? '') : record.item.image,
        active: e.visible,
      })
    }
  }
  return rows
}

export function setSubBannerActive(row: SubBannerView, active: boolean): void {
  row.group.list.setVisible(row.record.item, active)
}

export function deleteSubBanner(row: SubBannerView): void {
  row.group.list.remove(row.record.item)
}

/** Form values for an existing banner. */
export function subBannerValues(row: SubBannerView): SubBannerInput {
  return { type: row.type, homePlacement: row.group.homePlacement ?? '', category: subBannerCategory(row.record), image: row.image }
}

export function validateSubBanner(input: SubBannerInput): Partial<Record<keyof SubBannerInput, string>> {
  const errors: Partial<Record<keyof SubBannerInput, string>> = {}
  if (!SUB_BANNER_TYPE_OPTIONS.some((o) => o.value === input.type)) errors.type = 'Choose Home, Jerseys or Shoes.'
  else if (input.type === 'home' && !HOME_PLACEMENTS.includes(input.homePlacement as HomePlacement)) errors.homePlacement = HOME_PLACEMENT_ERROR
  if (!input.category) errors.category = 'Choose the category this banner links to.'
  else if (!ALL_COLLECTION_CONFIGS.some((c) => c.slug === input.category)) errors.category = 'Choose a category from the list.'
  if (!input.image) errors.image = 'Add a banner image.'
  return errors
}

/**
 * Builds the storefront record for a section kind (tile on Home, card on
 * Jerseys / Shoes). No name or sub title of its own: the storefront shows the
 * selected category's name (its existing translations).
 */
function buildSubBanner(kind: SubBannerGroup['kind'], id: string, input: SubBannerInput): SubBannerItem {
  const config = ALL_COLLECTION_CONFIGS.find((c) => c.slug === input.category)
  const to = categoryPath(input.category)
  if (kind === 'tile') return { id, image: input.image, link: to, categorySlug: input.category }
  return {
    id,
    title: '',
    titleKey: config?.titleKey ?? '',
    description: '',
    descriptionKey: '',
    image: input.image,
    imageAlt: '',
    to,
    bgGradient: NEUTRAL_CARD_BG,
    bgCardClass: 'card--neutral',
    categoryValue: config?.category ?? input.category,
    categorySlug: input.category,
  }
}

/** Creates an active banner in its type's storefront section. */
export function createSubBanner(input: SubBannerInput): void {
  let n = 1
  const taken = (id: string) => SUB_BANNER_GROUPS.some((g) => g.list.list().some((e) => e.item.id === id))
  while (taken(`sub-banner-${n}`)) n++
  const id = `sub-banner-${n}`
  const group = subTargetGroup(input.type as SubBannerType, input.homePlacement)
  group.list.add(buildSubBanner(group.kind, id, input))
}

/** Updates a banner; a new type or Home placement moves it to that section, keeping its Active state. */
export function updateSubBanner(row: SubBannerView, input: SubBannerInput): void {
  const item = row.record.item
  const target = subTargetGroup(input.type as SubBannerType, input.homePlacement)
  if (target !== row.group) {
    row.group.list.remove(item)
    const next = buildSubBanner(target.kind, item.id, input)
    target.list.add(next)
    if (!row.active) target.list.setVisible(next, false)
    return
  }
  const categoryChanged = subBannerCategory(row.record) !== input.category
  const to = categoryPath(input.category)
  if (row.record.kind === 'tile') {
    const tile = row.record.item
    tile.image = input.image
    if (categoryChanged) tile.link = to
    tile.categorySlug = input.category
  } else {
    const card = row.record.item
    card.image = input.image
    if (categoryChanged) {
      card.to = to
      card.categoryValue = ALL_COLLECTION_CONFIGS.find((c) => c.slug === input.category)?.category ?? input.category
    }
    card.categorySlug = input.category
  }
}

/** Every image path already referenced by banner data (for the image picker). */
export function bannerImagePaths(): string[] {
  const paths = new Set<string>()
  // Existing asset paths only (uploaded hero images are data URLs).
  for (const g of HERO_GROUPS) for (const e of g.list.list()) if (!e.item.image.startsWith('data:')) paths.add(e.item.image)
  for (const s of [...landingData.jerseysHero.slides, ...landingData.shoesHero.slides]) paths.add(s.image)
  for (const row of listSubBanners()) if (row.image && !row.image.startsWith('data:')) paths.add(row.image)
  return Array.from(paths)
}
