import React from 'react'
import { HeroSlider } from '../common/HeroSlider'
import type { HeroSlideItem, HeroSliderProps } from '../common/HeroSlider'

export type CategoryHeroSlide = HeroSlideItem
export type CategoryHeroProps = HeroSliderProps

export const CategoryHero: React.FC<CategoryHeroProps> = (props) => {
  return <HeroSlider {...props} />
}
