import React, { useState } from 'react'
import { useLocale } from '../../context/LocaleContext'
import './AboutSection.css'

export const AboutSection: React.FC = () => {
  const { t } = useLocale()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="about-section" aria-labelledby="about-section-title">
      <div className="about-container">
        <div className="about-col-left">
          <p className="about-label">{t('about.label')}</p>
          <h2 id="about-section-title" className="about-title">
            {t('about.title')}
          </h2>
        </div>

        <div className="about-col-right">
          <p className="about-p">{t('about.p1')}</p>
          <div
            id="about-collapsible-content"
            className={`about-collapsible ${isExpanded ? 'is-expanded' : ''}`}
          >
            <div className="about-collapsible-inner">
              <p className="about-p">{t('about.p2')}</p>
              <p className="about-closing">{t('about.closing')}</p>
            </div>
          </div>
          <button
            type="button"
            className="about-toggle-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-controls="about-collapsible-content"
          >
            {isExpanded ? t('about.readLess') : t('about.readMore')}
          </button>
        </div>
      </div>
    </section>
  )
}
