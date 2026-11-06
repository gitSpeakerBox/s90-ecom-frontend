import type { LandingPageData } from '../types/landing'

export interface LandingHeroSlideItem {
  id: string
  image: string
  eyebrowKey: string
  titleKey: string
  textKey: string
  buttonLabelKey: string
  to: string
  imageAltKey?: string
}

export const landingHeroSlides: LandingHeroSlideItem[] = [
  {
    id: 'landing-slide-jerseys-1',
    image: '/images/hero-jerseys-1.png',
    eyebrowKey: 'hero.jerseysEyebrow',
    titleKey: 'hero.jerseysTitle',
    textKey: 'hero.jerseysDesc',
    buttonLabelKey: 'hero.jerseysCta',
    to: '/jerseys',
    imageAltKey: 'hero.jerseysAlt',
  },
  {
    id: 'landing-slide-jerseys-2',
    image: '/images/hero-jerseys-2.png',
    eyebrowKey: 'hero.jerseysSlide2Eyebrow',
    titleKey: 'hero.jerseysSlide2Title',
    textKey: 'hero.jerseysSlide2Desc',
    buttonLabelKey: 'hero.jerseysCta',
    to: '/jerseys',
    imageAltKey: 'hero.jerseysAlt',
  },
]

export const landingShoesHeroSlides: LandingHeroSlideItem[] = [
  {
    id: 'landing-slide-shoes-1',
    image: '/images/hero-shoes-1.jpg',
    eyebrowKey: 'hero.shoesEyebrow',
    titleKey: 'hero.shoesTitle',
    textKey: 'hero.shoesDesc',
    buttonLabelKey: 'hero.shoesCta',
    to: '/shoes',
    imageAltKey: 'hero.shoesAlt',
  },
  {
    id: 'landing-slide-shoes-2',
    image: '/images/hero-shoes-2.png',
    eyebrowKey: 'hero.shoesSlide2Eyebrow',
    titleKey: 'hero.shoesSlide2Title',
    textKey: 'hero.shoesSlide2Desc',
    buttonLabelKey: 'hero.shoesSlide2Cta',
    to: '/shoes',
    imageAltKey: 'hero.shoesAlt',
  },
]

export const landingData: LandingPageData = {
  announcement: {
    message: 'COMPLIMENTARY SHIPPING ON ALL ORDERS OVER QAR 250',
    shippingCountry: 'Ship to: Qatar ▾',
    languages: 'EN / العربية',
  },
  jerseysHero: {
    id: 'jerseys-hero',
    category: 'jerseys',
    slides: [
      {
        id: 'j-slide-1',
        eyebrow: 'FOOTBALL JERSEYS',
        title: 'More\nThan A Game',
        description: 'Authentic club and national team jerseys\nfor true fans around the world.',
        ctaText: 'SHOP JERSEYS →',
        ctaLink: '/jerseys',
        tagline: 'THE WORLD PLAYS TOGETHER',
        image: '/images/hero-jerseys-1.png',
        alt: 'Real Madrid official football jersey worn by player',
      },
      {
        id: 'j-slide-2',
        eyebrow: 'FOOTBALL JERSEYS',
        title: 'Glory In\nEvery Thread',
        description: 'Engineered for peak performance and timeless pride.\nFeel the unmatched energy of matchday.',
        ctaText: 'SHOP JERSEYS →',
        ctaLink: '/jerseys',
        tagline: 'THE WORLD PLAYS TOGETHER',
        image: '/images/hero-jerseys-2.png',
        alt: 'Football player on pitch in match kit',
      },
    ],
  },
  jerseysBanners: {
    id: 'jerseys-banners',
    tiles: [
      {
        id: 'jb-1',
        image: '/images/banner-barca.jpg',
        alt: 'Club jerseys',
        title: 'Club',
        link: '/collection/club-jerseys',
      },
      {
        id: 'jb-2',
        image: '/images/banner-rack.jpg',
        alt: 'National team jerseys',
        title: 'National',
        link: '/collection/national-jerseys',
      },
      {
        id: 'jb-3',
        image: '/images/banner-red-jersey.jpg',
        alt: 'Retro classic jerseys',
        title: 'Retro',
        isDarkTile: true,
        link: '/collection/retro-jerseys',
      },
      {
        id: 'jb-4',
        image: '/images/hero-jerseys-2.png',
        alt: 'Matchday authentic team kits',
        title: 'Matchday',
        link: '/collection/matchday-jerseys',
      },
      {
        id: 'jb-5',
        image: '/images/hero-jerseys-3.png',
        alt: 'Heritage and vintage jerseys',
        title: 'Heritage',
        link: '/collection/heritage-jerseys',
      },
      {
        id: 'jb-6',
        image: '/images/banner-barca.jpg',
        alt: 'Training jerseys',
        title: 'Training',
        link: '/collection/training-kits',
      },
      {
        id: 'jb-7',
        image: '/images/banner-rack.jpg',
        alt: 'Goalkeeper jerseys',
        title: 'Goalkeeper',
        link: '/collection/goalkeeper-jerseys',
      },
      {
        id: 'jb-8',
        image: '/images/banner-red-jersey.jpg',
        alt: 'Limited edition jerseys',
        title: 'Limited',
        link: '/collection/special-editions',
      },
    ],
  },
  shoesHero: {
    id: 'shoes-hero',
    category: 'shoes',
    slides: [
      {
        id: 's-slide-1',
        eyebrow: 'SHOES COLLECTION',
        title: 'Style\nIn Every Step',
        description: 'Premium footwear designed for every occasion. Casual. Formal. Everyday.',
        ctaText: 'SHOP SHOES →',
        ctaLink: '/shoes',
        tagline: 'PREMIUM FOOTWEAR FOR A MODERN LIFESTYLE.',
        image: '/images/hero-shoes-1.jpg',
        alt: 'Clean white leather sneakers with black stripe on city steps',
      },
      {
        id: 's-slide-2',
        eyebrow: 'SHOES COLLECTION',
        title: 'Crafted For\nDistinction',
        description: 'Handcrafted leather formal shoes, monks and loafers with unmatched comfort and presence.',
        ctaText: 'EXPLORE FORMAL & LOAFERS →',
        ctaLink: '/shoes',
        tagline: 'PREMIUM FOOTWEAR FOR A MODERN LIFESTYLE.',
        image: '/images/hero-shoes-2.png',
        alt: 'Low top leather lifestyle sneakers',
      },
    ],
  },
  shoesBanners: {
    id: 'shoes-banners',
    tiles: [
      {
        id: 'sb-1',
        image: '/images/banner-sneakers.jpg',
        alt: 'Casual everyday sneakers',
        title: 'Casual',
        link: '/collection/casual-shoes',
      },
      {
        id: 'sb-2',
        image: '/images/banner-loafers.jpg',
        alt: 'Formal leather dress shoes',
        title: 'Formal',
        link: '/collection/formal-shoes',
      },
      {
        id: 'sb-3',
        image: '/images/banner-moccasins.jpg',
        alt: 'Loafers and slip-ons',
        title: 'Loafers',
        link: '/collection/loafers',
      },
      {
        id: 'sb-4',
        image: '/images/hero-shoes-2.png',
        alt: 'Urban motion daily footwear',
        title: 'Urban',
        link: '/collection/casual-shoes',
      },
      {
        id: 'sb-5',
        image: '/images/hero-shoes-3.png',
        alt: 'Minimalist luxury shoe editions',
        title: 'Minimalist',
        link: '/collection/minimalist-shoes',
      },
      {
        id: 'sb-6',
        image: '/images/banner-sneakers.jpg',
        alt: 'Running shoes',
        title: 'Running',
        link: '/collection/running-shoes',
      },
      {
        id: 'sb-7',
        image: '/images/banner-loafers.jpg',
        alt: 'Boots collection',
        title: 'Boots',
        link: '/collection/boots',
      },
      {
        id: 'sb-8',
        image: '/images/banner-moccasins.jpg',
        alt: 'Classic footwear',
        title: 'Classic',
        link: '/collection/leather-classics',
      },
    ],
  },
  trustItems: [
    {
      id: 'trust-1',
      icon: 'Truck',
      title: 'Worldwide Shipping',
      subtitle: 'Delivering to 100+ countries',
    },
    {
      id: 'trust-2',
      icon: 'ShieldCheck',
      title: 'Secure Payment',
      subtitle: 'Your data is protected',
    },
    {
      id: 'trust-3',
      icon: 'Package',
      title: 'Easy Returns',
      subtitle: 'Shop with confidence',
    },
    {
      id: 'trust-4',
      icon: 'Headset',
      title: '24/7 Support',
      subtitle: "We're always here to help",
    },
  ],
  footerLinks: [
    { label: 'About', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQs', href: '/faqs' },
  ],
}
