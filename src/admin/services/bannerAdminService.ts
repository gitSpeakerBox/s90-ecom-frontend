import {
  jerseysPageHeroSlides,
  landingData,
  landingHeroSlides,
  landingShoesHeroSlides,
  shoesPageHeroSlides,
} from '../../user/data/landing'
import type { LandingHeroSlideItem } from '../../user/data/landing'
import { jerseyCollectionCards, shoesCollectionCards } from '../../user/data/collectionBanners'
import type { CollectionBannerCard } from '../../user/data/collectionBanners'
import type { BannerTile } from '../../user/types/landing'
import { ALL_COLLECTION_CONFIGS } from '../../user/data/collections'
import { ManagedList } from './managedList'
import { collectionName, typeLabel } from './collectionAdminService'
import { isCollectionActive } from '../../shared/services/collectionAvailability'
import { getText, setText, singleLine } from './localeTextService'

/* ───────────────────────────── Hero banners ───────────────────────────── */

/** Storefront section a hero banner appears in. */
export type HeroBannerType = 'Home' | 'Jerseys' | 'Shoes'

export const HERO_BANNER_TYPES: HeroBannerType[] = ['Home', 'Jerseys', 'Shoes']

export interface HeroGroup {
  id: 'home-top' | 'home-second' | 'jerseys-page' | 'shoes-page'
  type: HeroBannerType
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
  { id: 'home-top', type: 'Home', placement: 'Home page · top slider', list: new ManagedList(landingHeroSlides) },
  { id: 'home-second', type: 'Home', placement: 'Home page · second slider', list: new ManagedList(landingShoesHeroSlides) },
  { id: 'jerseys-page', type: 'Jerseys', placement: 'Jerseys page hero', list: new ManagedList(jerseysPageHeroSlides) },
  { id: 'shoes-page', type: 'Shoes', placement: 'Shoes page hero', list: new ManagedList(shoesPageHeroSlides) },
]

/** Where new banners of each type are added. */
const TARGET_GROUP: Record<HeroBannerType, HeroGroup['id']> = {
  Home: 'home-top',
  Jerseys: 'jerseys-page',
  Shoes: 'shoes-page',
}

function groupById(id: HeroGroup['id']): HeroGroup {
  return HERO_GROUPS.find((g) => g.id === id)!
}

export interface HeroBannerView {
  key: string
  group: HeroGroup
  slide: LandingHeroSlideItem
  type: HeroBannerType
  active: boolean
  image: string
  /** Headline (English), single line. */
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
        name: singleLine(getText(e.item.titleKey, 'en')) || e.item.id,
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
  /** Headline in English (shown large in the banner). */
  name: string
  /** Headline in Arabic. */
  nameAr: string
  type: HeroBannerType | ''
  /** Supporting text shown under the headline (English). */
  text: string
  /** Supporting text shown under the headline (Arabic). */
  textAr: string
  /** Category ID (collection slug) the banner links to; '' until chosen. */
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

export const HERO_NAME_MAX = 60
export const HERO_TEXT_MAX = 160
const ARABIC_LETTERS = /\p{Script=Arabic}/u

/** Form values for an existing banner. Line breaks in stored copy show as spaces. */
export function heroBannerValues(row: HeroBannerView): HeroBannerInput {
  return {
    name: singleLine(getText(row.slide.titleKey, 'en')),
    nameAr: singleLine(getText(row.slide.titleKey, 'ar')),
    type: row.type,
    text: singleLine(getText(row.slide.textKey, 'en')),
    textAr: singleLine(getText(row.slide.textKey, 'ar')),
    // Previously selected category, if it still exists.
    category: ALL_COLLECTION_CONFIGS.some((c) => c.slug === row.slide.categorySlug) ? (row.slide.categorySlug ?? '') : '',
    image: row.slide.image,
  }
}

export function validateHeroBanner(input: HeroBannerInput): Partial<Record<keyof HeroBannerInput, string>> {
  const errors: Partial<Record<keyof HeroBannerInput, string>> = {}
  const name = input.name.trim()
  const nameAr = input.nameAr.trim()
  if (!name) errors.name = 'Enter the banner name in English.'
  else if (name.length > HERO_NAME_MAX) errors.name = `Use ${HERO_NAME_MAX} characters or fewer.`
  if (!nameAr) errors.nameAr = 'Enter the banner name in Arabic.'
  else if (nameAr.length > HERO_NAME_MAX) errors.nameAr = `Use ${HERO_NAME_MAX} characters or fewer.`
  else if (!ARABIC_LETTERS.test(nameAr)) errors.nameAr = 'Use Arabic characters for the Arabic name.'
  if (!input.type || !HERO_BANNER_TYPES.includes(input.type)) errors.type = 'Choose Home, Jerseys or Shoes.'
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
 * Gives a slide its own headline / text keys (copying both languages) before
 * its copy is edited, so banners that shared keys (e.g. the Home and Jerseys
 * page heroes) are never changed together.
 */
function ownTextKeys(slide: LandingHeroSlideItem): void {
  const titleKey = `hero.custom.${slide.id}.title`
  const textKey = `hero.custom.${slide.id}.text`
  if (slide.titleKey !== titleKey) {
    setText(titleKey, 'en', getText(slide.titleKey, 'en'))
    setText(titleKey, 'ar', getText(slide.titleKey, 'ar'))
    slide.titleKey = titleKey
  }
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
    titleKey: `hero.custom.${id}.title`,
    textKey: `hero.custom.${id}.text`,
    buttonLabelKey: CATEGORY_BUTTON_KEY,
    // The banner opens its selected category's listing page.
    to: categoryPath(input.category),
    categorySlug: input.category,
  }
  setText(slide.eyebrowKey, 'en', '')
  setText(slide.titleKey, 'en', input.name.trim())
  setText(slide.titleKey, 'ar', input.nameAr.trim())
  // Both languages are always written: an empty text renders as nothing, never as a key.
  setText(slide.textKey, 'en', input.text.trim())
  setText(slide.textKey, 'ar', input.textAr.trim())
  groupById(TARGET_GROUP[type]).list.add(slide)
  return slide
}

/** Updates a banner; changing its type moves it to that section (keeping its Active state). */
export function updateHeroBanner(row: HeroBannerView, input: HeroBannerInput): void {
  const current = heroBannerValues(row)
  const slide = row.slide
  const changed = (['name', 'nameAr', 'text', 'textAr'] as const).filter((k) => input[k].trim() !== current[k])
  if (changed.length > 0) {
    ownTextKeys(slide)
    // Only changed fields are written, so untouched copy keeps its original line breaks.
    if (changed.includes('name')) setText(slide.titleKey, 'en', input.name.trim())
    if (changed.includes('nameAr')) setText(slide.titleKey, 'ar', input.nameAr.trim())
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
  const type = input.type as HeroBannerType
  if (type !== row.type) {
    const wasActive = row.active
    row.group.list.remove(slide)
    const target = groupById(TARGET_GROUP[type]).list
    target.add(slide)
    if (!wasActive) target.setVisible(slide, false)
  }
}

/* ───────────────────────────── Sub banners ────────────────────────────── */

/**
 * Two existing sub-banner sources:
 * - Landing category strips (landingData.jerseysBanners / shoesBanners tiles),
 *   rendered on "/" by SubBannerRow via landingService.
 * - Collection cards (collectionBanners.ts), rendered on /jerseys and /shoes
 *   by CollectionSubBanner.
 */
export type SubBannerRecord =
  | { kind: 'tile'; item: BannerTile }
  | { kind: 'card'; item: CollectionBannerCard }

export interface SubBannerGroup {
  id: string
  label: string
  placement: string
  storefrontPath: string
  kind: 'tile' | 'card'
  list: ManagedList<BannerTile> | ManagedList<CollectionBannerCard>
}

export const SUB_BANNER_GROUPS: SubBannerGroup[] = [
  {
    id: 'landing-jerseys-strip',
    label: 'Jersey category strip',
    placement: 'Home page · jersey collections row',
    storefrontPath: '/',
    kind: 'tile',
    list: new ManagedList(landingData.jerseysBanners.tiles),
  },
  {
    id: 'landing-shoes-strip',
    label: 'Shoe category strip',
    placement: 'Home page · shoe collections row',
    storefrontPath: '/',
    kind: 'tile',
    list: new ManagedList(landingData.shoesBanners.tiles),
  },
  {
    id: 'jerseys-collection-cards',
    label: 'Jersey collection cards',
    placement: 'Jerseys page · Shop by collections',
    storefrontPath: '/jerseys',
    kind: 'card',
    list: new ManagedList(jerseyCollectionCards),
  },
  {
    id: 'shoes-collection-cards',
    label: 'Shoe collection cards',
    placement: 'Shoes page · Shop by collections',
    storefrontPath: '/shoes',
    kind: 'card',
    list: new ManagedList(shoesCollectionCards),
  },
]

export interface SubBannerView {
  key: string
  group: SubBannerGroup
  record: SubBannerRecord
  title: string
  titleAr: string
  image: string
  alt: string
  link: string
  visible: boolean
}

export function listSubBanners(): SubBannerView[] {
  const rows: SubBannerView[] = []
  for (const group of SUB_BANNER_GROUPS) {
    if (group.kind === 'tile') {
      for (const e of (group.list as ManagedList<BannerTile>).list()) {
        const tile = e.item
        const title = tile.title ?? ''
        rows.push({
          key: `${group.id}:${tile.id}`,
          group,
          record: { kind: 'tile', item: tile },
          title,
          // SubBannerRow translates tile titles via `subBanners.<title>`.
          titleAr: getText(`subBanners.${title.toLowerCase()}`, 'ar'),
          image: tile.image ?? '',
          alt: tile.alt ?? '',
          link: tile.link ?? '',
          visible: e.visible,
        })
      }
    } else {
      for (const e of (group.list as ManagedList<CollectionBannerCard>).list()) {
        const card = e.item
        rows.push({
          key: `${group.id}:${card.id}`,
          group,
          record: { kind: 'card', item: card },
          title: getText(card.titleKey, 'en') || card.title,
          titleAr: getText(card.titleKey, 'ar'),
          image: card.image,
          alt: card.imageAlt,
          link: card.to,
          visible: e.visible,
        })
      }
    }
  }
  return rows
}

export interface SubBannerEdit {
  title: string
  titleAr: string
  image: string
  alt: string
  link: string
}

export function applySubBannerEdit(row: SubBannerView, edit: SubBannerEdit): void {
  const { record } = row
  if (record.kind === 'tile') {
    record.item.title = edit.title.trim()
    record.item.image = edit.image.trim()
    record.item.alt = edit.alt.trim()
    record.item.link = edit.link.trim() || record.item.link
  } else {
    const card = record.item
    card.title = edit.title.trim() || card.title
    if (edit.title !== getText(card.titleKey, 'en')) setText(card.titleKey, 'en', edit.title.trim())
    if (edit.titleAr !== getText(card.titleKey, 'ar')) setText(card.titleKey, 'ar', edit.titleAr.trim())
    card.image = edit.image.trim()
    card.imageAlt = edit.alt.trim()
    card.to = edit.link.trim() || card.to
  }
}

export function setSubBannerVisible(row: SubBannerView, visible: boolean): void {
  if (row.record.kind === 'tile') {
    ;(row.group.list as ManagedList<BannerTile>).setVisible(row.record.item, visible)
  } else {
    ;(row.group.list as ManagedList<CollectionBannerCard>).setVisible(row.record.item, visible)
  }
}

export function moveSubBanner(row: SubBannerView, direction: -1 | 1): void {
  if (row.record.kind === 'tile') {
    ;(row.group.list as ManagedList<BannerTile>).move(row.record.item, direction)
  } else {
    ;(row.group.list as ManagedList<CollectionBannerCard>).move(row.record.item, direction)
  }
}

/** Position among the visible banners of its placement (1-based), or null if hidden. */
export function subBannerPosition(row: SubBannerView): number | null {
  return row.record.kind === 'tile'
    ? (row.group.list as ManagedList<BannerTile>).position(row.record.item)
    : (row.group.list as ManagedList<CollectionBannerCard>).position(row.record.item)
}

/** Whether the banner can move earlier (-1) or later (1) within its placement. */
export function canMoveSubBanner(row: SubBannerView, direction: -1 | 1): boolean {
  const entries = row.group.list.list() as ManagedEntryLike[]
  const idx = entries.findIndex((e) => e.item === row.record.item)
  return direction === -1 ? idx > 0 : idx >= 0 && idx < entries.length - 1
}

interface ManagedEntryLike {
  item: unknown
}

/** Every image path already referenced by banner data (for the image picker). */
export function bannerImagePaths(): string[] {
  const paths = new Set<string>()
  // Existing asset paths only (uploaded hero images are data URLs).
  for (const g of HERO_GROUPS) for (const e of g.list.list()) if (!e.item.image.startsWith('data:')) paths.add(e.item.image)
  for (const s of [...landingData.jerseysHero.slides, ...landingData.shoesHero.slides]) paths.add(s.image)
  for (const row of listSubBanners()) if (row.image) paths.add(row.image)
  return Array.from(paths)
}
