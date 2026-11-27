export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  tagline: string;
  image: string;
  alt: string;
}

export interface HeroSliderData {
  id: string;
  category: 'jerseys' | 'shoes';
  slides: HeroSlide[];
}

export interface BannerTile {
  id: string;
  image?: string;
  alt?: string;
  title?: string;
  isDarkTile?: boolean;
  link?: string;
}

export interface BannerStripData {
  id: string;
  tiles: BannerTile[];
}

export interface SubBannerItem {
  title: string;
  image: string;
  to: string;
  alt?: string;
}

export interface TrustItem {
  id: string;
  icon: 'Truck' | 'ShieldCheck' | 'Package' | 'Headset';
  title: string;
  subtitle: string;
}

export interface AnnouncementData {
  message: string;
  shippingCountry: string;
  languages: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface LandingPageData {
  announcement: AnnouncementData;
  jerseysHero: HeroSliderData;
  jerseysBanners: BannerStripData;
  shoesHero: HeroSliderData;
  shoesBanners: BannerStripData;
  trustItems: TrustItem[];
  footerLinks: FooterLink[];
}

