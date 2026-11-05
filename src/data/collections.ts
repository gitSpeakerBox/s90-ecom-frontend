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

export const JERSEY_COLLECTIONS: CollectionItem[] = [
  {
    id: 'club',
    labelKey: 'collections.jerseys.club',
    link: '/jerseys?category=club',
    category: 'club',
  },
  {
    id: 'national',
    labelKey: 'collections.jerseys.national',
    link: '/jerseys?category=national',
    category: 'national',
  },
  {
    id: 'retro',
    labelKey: 'collections.jerseys.retro',
    link: '/jerseys?category=retro',
    category: 'retro',
  },
  {
    id: 'kids',
    labelKey: 'collections.jerseys.kids',
    link: '/jerseys?category=kids',
    category: 'kids',
  },
  {
    id: 'new-season',
    labelKey: 'collections.jerseys.newSeason',
    link: '/jerseys?category=new-season',
    category: 'new-season',
  },
  {
    id: 'special-editions',
    labelKey: 'collections.jerseys.specialEditions',
    link: '/jerseys?category=special-editions',
    category: 'special-editions',
  },
]

export const SHOE_COLLECTIONS: CollectionItem[] = [
  {
    id: 'casual',
    labelKey: 'collections.shoes.casual',
    link: '/shoes?category=casual',
    category: 'casual',
  },
  {
    id: 'formal',
    labelKey: 'collections.shoes.formal',
    link: '/shoes?category=formal',
    category: 'formal',
  },
  {
    id: 'sneakers',
    labelKey: 'collections.shoes.sneakers',
    link: '/shoes?category=sneakers',
    category: 'sneakers',
  },
  {
    id: 'loafers',
    labelKey: 'collections.shoes.loafers',
    link: '/shoes?category=loafers',
    category: 'loafers',
  },
  {
    id: 'new-arrivals',
    labelKey: 'collections.shoes.newArrivals',
    link: '/shoes?category=new-arrivals',
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

