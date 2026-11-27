import { Link } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import type { BannerStripData } from '../../types/landing'
import './BannerStrip.css'

interface BannerStripProps {
  data: BannerStripData;
}

export const BannerStrip = ({ data }: BannerStripProps) => {
  const { t } = useLocale()

  return (
    <section className="banner-strip" aria-label={t('landing.featuredHighlights')}>
      {data.tiles.map((tile) => {
        const content = (
          <>
            {tile.image && (
              <img
                src={tile.image}
                alt={tile.alt || 'Highlight banner'}
                className="banner-tile-image"
                loading="lazy"
              />
            )}
            {tile.title && (
              <div className="banner-tile-overlay" aria-hidden="true">
                <span className="banner-tile-text">{tile.title}</span>
                <div className="banner-tile-line" />
              </div>
            )}
          </>
        )

        if (tile.link) {
          return (
            <Link
              key={tile.id}
              to={tile.link}
              className="banner-tile"
              aria-label={tile.title ? tile.title.replace('\n', ' ') : tile.alt}
            >
              {content}
            </Link>
          )
        }

        return (
          <div key={tile.id} className="banner-tile">
            {content}
          </div>
        )
      })}
    </section>
  )
}

