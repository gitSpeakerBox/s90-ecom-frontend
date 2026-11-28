import {
  jerseysPageHeroSlides,
  landingData,
  landingHeroSlides,
  landingShoesHeroSlides,
  shoesPageHeroSlides,
} from '../data/landing'
import { ALL_COLLECTION_CONFIGS, isCollectionPathActive } from '../data/collections'
import type { LandingHeroSlideItem } from '../data/landing'
import type {
  AnnouncementData,
  HeroSliderData,
  BannerStripData,
  SubBannerItem,
  TrustItem,
  FooterLink,
  LandingPageData,
} from '../types/landing'

/**
 * Translation key of a hero banner's headline: a banner linked to a category
 * (Admin › Hero Banners) shows that category's name (its EN / AR translation);
 * other banners keep their own headline.
 */
export const heroTitleKey = (slide: LandingHeroSlideItem): string =>
  (slide.categorySlug && ALL_COLLECTION_CONFIGS.find((c) => c.slug === slide.categorySlug)?.titleKey) || slide.titleKey

export const getAnnouncementData = (): AnnouncementData => {
  return landingData.announcement
}

export const getLandingHeroSlides = (): LandingHeroSlideItem[] => {
  return landingHeroSlides
}

export const getLandingShoesHeroSlides = (): LandingHeroSlideItem[] => {
  return landingShoesHeroSlides
}

/** Active hero slides of the /jerseys page (Admin › Hero Banners, type Jerseys). */
export const getJerseysPageHeroSlides = (): LandingHeroSlideItem[] => {
  return jerseysPageHeroSlides
}

/** Active hero slides of the /shoes page (Admin › Hero Banners, type Shoes). */
export const getShoesPageHeroSlides = (): LandingHeroSlideItem[] => {
  return shoesPageHeroSlides
}

export const getJerseysHeroData = (): HeroSliderData => {
  return landingData.jerseysHero
}

export const getJerseysBannersData = (): BannerStripData => {
  return landingData.jerseysBanners
}

export const getJerseysSubBanners = (): SubBannerItem[] => {
  return landingData.jerseysBanners.tiles.filter((tile) => isCollectionPathActive(tile.link)).map((tile) => ({
    title: tile.title || '',
    image: tile.image || '',
    to: tile.link || '/jerseys',
    alt: tile.alt,
  }))
}

export const getShoesHeroData = (): HeroSliderData => {
  return landingData.shoesHero
}

export const getShoesBannersData = (): BannerStripData => {
  return landingData.shoesBanners
}

export const getShoesSubBanners = (): SubBannerItem[] => {
  return landingData.shoesBanners.tiles.filter((tile) => isCollectionPathActive(tile.link)).map((tile) => ({
    title: tile.title || '',
    image: tile.image || '',
    to: tile.link || '/shoes',
    alt: tile.alt,
  }))
}

export const getTrustItems = (): TrustItem[] => {
  return landingData.trustItems
}

export const getFooterLinks = (): FooterLink[] => {
  return landingData.footerLinks
}

export const getLandingPageData = (): LandingPageData => {
  return landingData
}
