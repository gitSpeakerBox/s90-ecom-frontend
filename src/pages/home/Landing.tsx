import { useMemo } from 'react'
import { HeroSlider } from '../../components/common/HeroSlider'
import type { HeroSlideItem } from '../../components/common/HeroSlider'
import { SubBannerRow } from '../../components/landing/SubBannerRow'
import { AboutSection } from '../../components/common/AboutSection'
import {
  getLandingHeroSlides,
  getLandingShoesHeroSlides,
  getJerseysSubBanners,
  getShoesSubBanners,
} from '../../services/landingService'
import { useLocale } from '../../context/LocaleContext'
import './Landing.css'

export const Landing = () => {
  const { t } = useLocale()
  const jerseysSlidesData = getLandingHeroSlides()
  const shoesSlidesData = getLandingShoesHeroSlides()
  const jerseysSubBanners = getJerseysSubBanners()
  const shoesSubBanners = getShoesSubBanners()

  const jerseysHeroSlides: HeroSlideItem[] = useMemo(() => {
    return jerseysSlidesData.map((slide) => ({
      image: slide.image,
      eyebrow: t(slide.eyebrowKey),
      title: t(slide.titleKey),
      text: t(slide.textKey),
      buttonLabel: t(slide.buttonLabelKey),
      to: slide.to,
      imageAlt: slide.imageAltKey ? t(slide.imageAltKey) : undefined,
    }))
  }, [jerseysSlidesData, t])

  const shoesHeroSlides: HeroSlideItem[] = useMemo(() => {
    return shoesSlidesData.map((slide) => ({
      image: slide.image,
      eyebrow: t(slide.eyebrowKey),
      title: t(slide.titleKey),
      text: t(slide.textKey),
      buttonLabel: t(slide.buttonLabelKey),
      to: slide.to,
      imageAlt: slide.imageAltKey ? t(slide.imageAltKey) : undefined,
    }))
  }, [shoesSlidesData, t])

  return (
    <div className="landing-page">
      <HeroSlider slides={jerseysHeroSlides} ariaLabel={t('landing.jerseysSection')} />
      <SubBannerRow
        heading={t('landing.ourJerseysCollections', { defaultValue: 'OUR JERSEY COLLECTIONS' })}
        items={jerseysSubBanners}
        ariaLabel={t('subBanners.jerseysCategoryAria')}
      />
      <HeroSlider slides={shoesHeroSlides} ariaLabel={t('landing.shoesSection')} />
      <SubBannerRow
        heading={t('landing.ourShoesCollections', { defaultValue: 'OUR SHOES COLLECTIONS' })}
        items={shoesSubBanners}
        ariaLabel={t('subBanners.shoesCategoryAria')}
      />
      <AboutSection />
    </div>
  )
}
