export interface CollectionItem {
  id: string
  labelKey: string
  link: string
  category: string
}

export interface CollectionGroup {
  id: 'jerseys' | 'shoes'
  titleKey: string
  viewAllLink: string
  viewAllKey: string
  items: CollectionItem[]
}

export interface CollectionConfig {
  slug: string
  category: string
  type: 'jersey' | 'shoe'
  parentPath: '/jerseys' | '/shoes'
  parentLabelKey: string
  titleKey: string
  aliases?: string[]
}

export const JERSEY_COLLECTIONS: CollectionItem[] = [
  {
    id: 'club',
    labelKey: 'collections.jerseys.club',
    link: '/collection/club-jerseys',
    category: 'club',
  },
  {
    id: 'national',
    labelKey: 'collections.jerseys.national',
    link: '/collection/national-jerseys',
    category: 'national',
  },
  {
    id: 'retro',
    labelKey: 'collections.jerseys.retro',
    link: '/collection/retro-jerseys',
    category: 'retro',
  },
  {
    id: 'kids',
    labelKey: 'collections.jerseys.kids',
    link: '/collection/kids-jerseys',
    category: 'kids',
  },
  {
    id: 'new-season',
    labelKey: 'collections.jerseys.newSeason',
    link: '/collection/new-season-jerseys',
    category: 'new-season',
  },
  {
    id: 'special-editions',
    labelKey: 'collections.jerseys.specialEditions',
    link: '/collection/special-editions',
    category: 'special-editions',
  },
]

export const SHOE_COLLECTIONS: CollectionItem[] = [
  {
    id: 'casual',
    labelKey: 'collections.shoes.casual',
    link: '/collection/casual-shoes',
    category: 'casual',
  },
  {
    id: 'formal',
    labelKey: 'collections.shoes.formal',
    link: '/collection/formal-shoes',
    category: 'formal',
  },
  {
    id: 'sneakers',
    labelKey: 'collections.shoes.sneakers',
    link: '/collection/sneakers',
    category: 'sneakers',
  },
  {
    id: 'loafers',
    labelKey: 'collections.shoes.loafers',
    link: '/collection/loafers',
    category: 'loafers',
  },
  {
    id: 'new-arrivals',
    labelKey: 'collections.shoes.newArrivals',
    link: '/collection/new-arrivals-shoes',
    category: 'new-arrivals',
  },
]

export const COLLECTIONS_DATA: {
  jerseys: CollectionGroup
  shoes: CollectionGroup
} = {
  jerseys: {
    id: 'jerseys',
    titleKey: 'collections.headings.jerseys',
    viewAllLink: '/jerseys',
    viewAllKey: 'collections.viewAllJerseys',
    items: JERSEY_COLLECTIONS,
  },
  shoes: {
    id: 'shoes',
    titleKey: 'collections.headings.shoes',
    viewAllLink: '/shoes',
    viewAllKey: 'collections.viewAllShoes',
    items: SHOE_COLLECTIONS,
  },
}

export const ALL_COLLECTION_CONFIGS: CollectionConfig[] = [
  // Shoes
  {
    slug: 'casual-shoes',
    category: 'casual',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.casual',
    aliases: ['casual', 'urban', 'urban-casual'],
  },
  {
    slug: 'formal-shoes',
    category: 'formal',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.formal',
    aliases: ['formal'],
  },
  {
    slug: 'sneakers',
    category: 'sneakers',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.sneakers',
    aliases: ['casual-sneakers', 'shoes-sneakers'],
  },
  {
    slug: 'loafers',
    category: 'loafers',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.loafers',
    aliases: ['luxury-loafers', 'shoes-loafers'],
  },
  {
    slug: 'leather-classics',
    category: 'leather',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collectionSubBanner.shoes.leather.title',
    aliases: ['leather', 'leather-shoes', 'classic', 'shoes-leather'],
  },
  {
    slug: 'new-arrivals-shoes',
    category: 'new-arrivals',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.newArrivals',
    aliases: ['shoes-new-arrivals', 'new-arrivals'],
  },
  {
    slug: 'minimalist-shoes',
    category: 'minimalist',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.casual',
    aliases: ['minimalist'],
  },
  {
    slug: 'running-shoes',
    category: 'running',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.casual',
    aliases: ['running'],
  },
  {
    slug: 'boots',
    category: 'boots',
    type: 'shoe',
    parentPath: '/shoes',
    parentLabelKey: 'nav.shoes',
    titleKey: 'collections.shoes.casual',
    aliases: [],
  },

  // Jerseys
  {
    slug: 'club-jerseys',
    category: 'club',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.club',
    aliases: ['club', 'jersey-club'],
  },
  {
    slug: 'national-jerseys',
    category: 'national',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.national',
    aliases: ['national', 'national-teams', 'jersey-national'],
  },
  {
    slug: 'retro-jerseys',
    category: 'retro',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.retro',
    aliases: ['retro', 'retro-classic', 'jersey-retro'],
  },
  {
    slug: 'kids-jerseys',
    category: 'kids',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.kids',
    aliases: ['kids', 'jersey-kids'],
  },
  {
    slug: 'new-season-jerseys',
    category: 'new-season',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.newSeason',
    aliases: ['new-season', 'jerseys-new-season'],
  },
  {
    slug: 'special-editions',
    category: 'special',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.specialEditions',
    aliases: ['special', 'special-collections', 'limited', 'jersey-special'],
  },
  {
    slug: 'training-kits',
    category: 'training',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collectionSubBanner.jerseys.training.title',
    aliases: ['training', 'training-jerseys', 'jersey-training'],
  },
  {
    slug: 'matchday-jerseys',
    category: 'matchday',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.club',
    aliases: ['matchday'],
  },
  {
    slug: 'heritage-jerseys',
    category: 'heritage',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.retro',
    aliases: ['heritage'],
  },
  {
    slug: 'goalkeeper-jerseys',
    category: 'goalkeeper',
    type: 'jersey',
    parentPath: '/jerseys',
    parentLabelKey: 'nav.jerseys',
    titleKey: 'collections.jerseys.club',
    aliases: ['goalkeeper'],
  },
]

export function getCollectionBySlug(slug: string): CollectionConfig {
  const normalized = (slug || '').toLowerCase().trim()
  const found = ALL_COLLECTION_CONFIGS.find(
    (c) => c.slug === normalized || (c.aliases && c.aliases.includes(normalized))
  )
  if (found) return found

  // Intelligent fallback for unrecognized slugs
  const isJersey =
    normalized.includes('jersey') ||
    normalized.includes('kit') ||
    normalized.includes('shirt') ||
    normalized.includes('club') ||
    normalized.includes('national')

  const baseCategory = normalized
    .replace(/-shoes$/, '')
    .replace(/-jerseys$/, '')
    .replace(/-kits$/, '')

  return {
    slug: normalized,
    category: baseCategory,
    type: isJersey ? 'jersey' : 'shoe',
    parentPath: isJersey ? '/jerseys' : '/shoes',
    parentLabelKey: isJersey ? 'nav.jerseys' : 'nav.shoes',
    titleKey: isJersey ? 'collections.headings.jerseys' : 'collections.headings.shoes',
  }
}

export function getCollectionSlugForCategory(type: 'jersey' | 'shoe', category: string): string {
  const normalized = (category || '').toLowerCase().trim()
  const found = ALL_COLLECTION_CONFIGS.find(
    (c) =>
      c.type === type &&
      (c.category === normalized ||
        c.slug === normalized ||
        (c.aliases && c.aliases.includes(normalized)))
  )
  if (found) return found.slug

  if (type === 'jersey') {
    return normalized.endsWith('-jerseys') ? normalized : `${normalized}-jerseys`
  }
  return normalized.endsWith('-shoes') ? normalized : `${normalized}-shoes`
}
