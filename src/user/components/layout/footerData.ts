export interface FooterLinkItem {
  id: string
  label: string
  labelKey?: string
  href: string
  isExternal?: boolean
  hasInstagramIcon?: boolean
}

export interface FooterSocialItem {
  platform: 'Instagram' | 'WhatsApp' | 'TikTok'
  label: string
  labelKey?: string
  href: string
}

export interface FooterSection {
  title: string
  titleKey?: string
  links: FooterLinkItem[]
}

export const FOOTER_SOCIAL_LINKS: FooterSocialItem[] = [
  {
    platform: 'Instagram',
    label: 'Instagram',
    labelKey: 'footer.social.instagram',
    href: 'https://instagram.com/s90stores',
  },
  {
    platform: 'WhatsApp',
    label: 'WhatsApp',
    labelKey: 'footer.social.whatsapp',
    href: 'https://whatsapp.com',
  },
  {
    platform: 'TikTok',
    label: 'TikTok',
    labelKey: 'footer.social.tiktok',
    href: 'https://tiktok.com/@s90sport',
  },
]

export const FOOTER_BRAND_INFO = {
  description:
    'The premier destination for football heritage. From the terraces to the pitch, we curate the finest collection of retro, classic, and new season kits for the discerning fan.',
  descriptionKey: 'footer.brandDescription',
}

export const FOOTER_COLLECTIONS: FooterSection = {
  title: 'COLLECTIONS',
  titleKey: 'footer.collectionsTitle',
  links: [
    {
      id: 'retro-archive',
      label: 'Retro Archive',
      labelKey: 'footer.collections.retroArchive',
      href: '#retro-archive',
    },
    {
      id: 'modern-classics',
      label: 'Modern Classics',
      labelKey: 'footer.collections.modernClassics',
      href: '#modern-classics',
    },
    {
      id: 'new-season-drop',
      label: 'New Season Drop',
      labelKey: 'footer.collections.newSeasonDrop',
      href: '#new-season-drop',
    },
    {
      id: 'match-worn',
      label: 'Match Worn',
      labelKey: 'footer.collections.matchWorn',
      href: '#match-worn',
    },
  ],
}

export const FOOTER_SERVICE: FooterSection = {
  title: 'SERVICE',
  titleKey: 'footer.serviceTitle',
  links: [
    {
      id: 'track-order',
      label: 'Track Order',
      labelKey: 'footer.service.trackOrder',
      href: '/track-order',
    },
    {
      id: 'shipping-delivery',
      label: 'Shipping & Delivery',
      labelKey: 'footer.service.shippingDelivery',
      href: '#shipping',
    },
    {
      id: 'returns-exchange',
      label: 'Returns & Exchange',
      labelKey: 'footer.service.returnsExchange',
      href: '#returns',
    },
    {
      id: 'authenticity-guarantee',
      label: 'Authenticity Guarantee',
      labelKey: 'footer.service.authenticityGuarantee',
      href: '#authenticity',
    },
    {
      id: 'email-us',
      label: 'Email Us',
      labelKey: 'footer.service.emailUs',
      href: 'mailto:contact@s90sport.com',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      labelKey: 'footer.service.whatsapp',
      href: 'https://whatsapp.com',
      isExternal: true,
    },
    {
      id: 'tiktok-service',
      label: 'TikTok (@s90sport)',
      labelKey: 'footer.service.tiktok',
      href: 'https://tiktok.com/@s90sport',
      isExternal: true,
    },
    {
      id: 'instagram-service',
      label: 'Instagram (@s90stores)',
      labelKey: 'footer.service.instagram',
      href: 'https://instagram.com/s90stores',
      isExternal: true,
      hasInstagramIcon: true,
    },
  ],
}

export const FOOTER_BOTTOM_DATA = {
  copyright: '© 2024 S90 SPORT. EST. DOHA.',
  copyrightKey: 'footer.copyright',
  legalLinks: [
    {
      id: 'privacy-policy',
      label: 'PRIVACY POLICY',
      labelKey: 'footer.privacyPolicyUpper',
      href: '#privacy',
    },
    {
      id: 'terms-conditions',
      label: 'TERMS & CONDITIONS',
      labelKey: 'footer.termsConditionsUpper',
      href: '#terms',
    },
  ],
}

