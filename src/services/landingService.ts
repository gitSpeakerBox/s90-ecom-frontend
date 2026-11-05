import { landingData, landingHeroSlides, landingShoesHeroSlides } from '../data/landing'
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

export const getAnnouncementData = (): AnnouncementData => {
  return landingData.announcement
}

export const getLandingHeroSlides = (): LandingHeroSlideItem[] => {
  return landingHeroSlides
}

export const getLandingShoesHeroSlides = (): LandingHeroSlideItem[] => {
  return landingShoesHeroSlides
}

export const getJerseysHeroData = (): HeroSliderData => {
  return landingData.jerseysHero
}

export const getJerseysBannersData = (): BannerStripData => {
  return landingData.jerseysBanners
}

export const getJerseysSubBanners = (): SubBannerItem[] => {
  return landingData.jerseysBanners.tiles.map((tile) => ({
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
  return landingData.shoesBanners.tiles.map((tile) => ({
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
