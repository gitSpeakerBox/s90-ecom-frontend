import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import { Logo } from '../common/Logo'
import { subscribeToNewsletter } from '../../services/newsletterService'
import {
  FOOTER_SOCIAL_LINKS,
  FOOTER_BRAND_INFO,
  FOOTER_COLLECTIONS,
  FOOTER_SERVICE,
  FOOTER_BOTTOM_DATA,
  type FooterLinkItem,
} from './footerData'
import './Footer.css'

const InstagramIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const WhatsAppIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
)

const TikTokIcon = ({ size = 18, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

export const Footer = () => {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [messageKey, setMessageKey] = useState<string | null>(null)

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault()
    const result = await subscribeToNewsletter(email)
    if (result.success) {
      setStatus('success')
      setMessage(result.message)
      setMessageKey(result.messageKey || null)
      setEmail('')
    } else {
      setStatus('error')
      setMessage(result.message)
      setMessageKey(result.messageKey || null)
    }
  }

  const renderSocialIcon = (platform: 'Instagram' | 'WhatsApp' | 'TikTok') => {
    switch (platform) {
      case 'Instagram':
        return <InstagramIcon size={18} />
      case 'WhatsApp':
        return <WhatsAppIcon size={18} />
      case 'TikTok':
        return <TikTokIcon size={18} />
    }
  }

  const renderFooterLink = (item: FooterLinkItem) => {
    const isInternal = item.href.startsWith('/') && !item.href.startsWith('//')
    const label = item.labelKey
      ? t(item.labelKey, { defaultValue: item.label })
      : item.label
    const content = (
      <>
        {item.hasInstagramIcon && (
          <InstagramIcon size={14} className="footer-service-ig-icon" />
        )}
        <span>{label}</span>
      </>
    )

    if (isInternal) {
      return (
        <Link to={item.href} className="footer-link">
          {content}
        </Link>
      )
    }

    return (
      <a
        href={item.href}
        className="footer-link"
        {...(item.isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {content}
      </a>
    )
  }

  return (
    <footer
      className="site-footer-container"
      aria-label={t('footer.siteFooterAria', { defaultValue: 'Site Footer' })}
    >
      <div className="footer-content-inner">
        {/* ROW 1: Newsletter & Follow Us */}
        <div className="footer-row-newsletter">
          <div className="footer-newsletter-block">
            <h2 className="footer-heading">
              {t('footer.newsletterTitle', {
                defaultValue: 'SUBSCRIBE TO OUR NEWSLETTER',
              })}
            </h2>
            <form
              className="footer-newsletter-form"
              onSubmit={handleSubscribe}
              noValidate
            >
              <label htmlFor="footer-newsletter-email" className="visually-hidden">
                {t('footer.newsletterPlaceholder', {
                  defaultValue: 'Enter your email address here',
                })}
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                name="email"
                className="footer-newsletter-input"
                placeholder={t('footer.newsletterPlaceholder', {
                  defaultValue: 'Enter your email address here',
                })}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status !== 'idle') {
                    setStatus('idle')
                    setMessage('')
                    setMessageKey(null)
                  }
                }}
                autoComplete="email"
                required
                aria-describedby={
                  status !== 'idle' ? 'footer-newsletter-message' : undefined
                }
              />
              <button type="submit" className="footer-newsletter-btn">
                {t('footer.newsletterButton', { defaultValue: 'SUBSCRIBE' })}
              </button>
            </form>
            {status !== 'idle' && (
              <p
                id="footer-newsletter-message"
                className={`footer-newsletter-message is-${status}`}
                role={status === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {messageKey ? t(messageKey, { defaultValue: message }) : message}
              </p>
            )}
          </div>

          <div className="footer-follow-block">
            <h2 className="footer-heading">
              {t('footer.followUs', { defaultValue: 'FOLLOW US' })}
            </h2>
            <div className="footer-social-icons">
              {FOOTER_SOCIAL_LINKS.map((item) => (
                <a
                  key={item.platform}
                  href={item.href}
                  className="footer-social-icon-link"
                  aria-label={
                    item.labelKey
                      ? t(item.labelKey, { defaultValue: item.label })
                      : item.label
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {renderSocialIcon(item.platform)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* ROW 2: 3 Columns (Brand, Collections, Service) */}
        <div className="footer-row-main">
          {/* Column 1 */}
          <div className="footer-col-brand">
            <Logo className="footer-logo" />
            <p className="footer-brand-desc">
              {FOOTER_BRAND_INFO.descriptionKey
                ? t(FOOTER_BRAND_INFO.descriptionKey, {
                    defaultValue: FOOTER_BRAND_INFO.description,
                  })
                : FOOTER_BRAND_INFO.description}
            </p>
          </div>

          {/* Column 2 */}
          <div className="footer-col-nav">
            <h2 className="footer-heading">
              {FOOTER_COLLECTIONS.titleKey
                ? t(FOOTER_COLLECTIONS.titleKey, {
                    defaultValue: FOOTER_COLLECTIONS.title,
                  })
                : FOOTER_COLLECTIONS.title}
            </h2>
            <ul className="footer-link-list">
              {FOOTER_COLLECTIONS.links.map((link) => (
                <li key={link.id} className="footer-link-item">
                  {renderFooterLink(link)}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="footer-col-nav">
            <h2 className="footer-heading">
              {FOOTER_SERVICE.titleKey
                ? t(FOOTER_SERVICE.titleKey, {
                    defaultValue: FOOTER_SERVICE.title,
                  })
                : FOOTER_SERVICE.title}
            </h2>
            <ul className="footer-link-list">
              {FOOTER_SERVICE.links.map((link) => (
                <li key={link.id} className="footer-link-item">
                  {renderFooterLink(link)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* ROW 3: Bottom Bar */}
        <div className="footer-row-bottom">
          <p className="footer-bottom-copyright">
            {FOOTER_BOTTOM_DATA.copyrightKey
              ? t(FOOTER_BOTTOM_DATA.copyrightKey, {
                  defaultValue: FOOTER_BOTTOM_DATA.copyright,
                })
              : FOOTER_BOTTOM_DATA.copyright}
          </p>
          <ul className="footer-bottom-legal">
            {FOOTER_BOTTOM_DATA.legalLinks.map((link) => (
              <li key={link.id} className="footer-bottom-legal-item">
                <a href={link.href} className="footer-bottom-legal-link">
                  {link.labelKey
                    ? t(link.labelKey, { defaultValue: link.label })
                    : link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
