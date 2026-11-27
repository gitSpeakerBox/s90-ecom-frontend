import { Link } from 'react-router-dom'
import { Button } from '../common/Button'
import { useLocale } from '../../context/LocaleContext'
import './HeroBanner.css'

export interface HeroBannerData {
  image: string
  eyebrow: string
  title: string
  text: string
  buttonLabel: string
  to: string
  sideText?: string
  alt?: string
}

export interface HeroBannerProps {
  image?: string
  eyebrow?: string
  title?: string
  text?: string
  buttonLabel?: string
  to?: string
  sideText?: string
  alt?: string
  data?: HeroBannerData
  isTopHero?: boolean
}

export const HeroBanner = (props: HeroBannerProps) => {
  const { t } = useLocale()
  const data = props.data ?? props
  const {
    image = '',
    eyebrow = '',
    title = '',
    text = '',
    buttonLabel = '',
    to = '/',
    sideText,
    alt,
  } = data
  const isTopHero = props.isTopHero ?? false

  const accessibleTitle = (title || eyebrow || 'collection').replace(/\n/g, ' ')

  return (
    <section
      className={`hero-banner-section ${isTopHero ? 'hero-landing-top' : ''}`}
      aria-label={eyebrow}
    >
      <Link
        to={to}
        className="hero-banner-stretched-link"
        aria-label={t('productCard.viewProduct', { name: accessibleTitle, defaultValue: `Shop ${accessibleTitle}` })}
      />
      <img
        src={image}
        alt={alt || eyebrow || title}
        className="hero-banner-image"
        loading="eager"
      />
      <div className="hero-banner-overlay" aria-hidden="true" />
      {isTopHero && <div className="hero-top-gradient" aria-hidden="true" />}

      <div className="hero-banner-content">
        <div className="hero-content-block">
          <span className="hero-eyebrow">{eyebrow}</span>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-description">{text}</p>
          <Button variant="hero" to={to}>
            {buttonLabel}
          </Button>
        </div>
      </div>

      {sideText && (
        <div className="hero-tagline-block" aria-hidden="true">
          <span className="hero-tagline-text">{sideText}</span>
        </div>
      )}
    </section>
  )
}
