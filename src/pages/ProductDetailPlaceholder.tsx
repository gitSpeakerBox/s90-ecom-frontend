import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react'
import { useLocale } from '../context/LocaleContext'
import { findProductBySlug, getLocalizedProduct } from '../services/productService'
import { formatPrice } from '../utils/formatters'
import { Button } from '../components/common/Button'
import './ProductDetailPlaceholder.css'

export const ProductDetailPlaceholder: React.FC = () => {
  const { t, language, currency } = useLocale()
  const { slug = '' } = useParams<{ slug: string }>()
  const rawProduct = findProductBySlug(slug)

  if (!rawProduct) {
    return (
      <div className="product-placeholder-not-found">
        <h1>{t('common.productNotFound')}</h1>
        <p>{t('common.productNotFoundDesc')}</p>
        <Link to="/jerseys" className="product-placeholder-back-btn">
          {t('common.exploreJerseys')}
        </Link>
      </div>
    )
  }

  const product = getLocalizedProduct(rawProduct, language)
  const isJersey = rawProduct.productType === 'jersey'
  const catalogPath = isJersey ? '/jerseys' : '/shoes'
  const catalogName = isJersey ? t('nav.jerseys') : t('nav.shoes')
  const formattedPrice = formatPrice(product.price, language, currency)

  const getBadgeLabel = () => {
    if (product.badges && product.badges.length > 0) {
      const b = product.badges[0]
      const lower = b.toLowerCase()
      if (lower === 'new arrival') return t('productCard.badge.newArrival')
      if (lower === 'best seller') return t('productCard.badge.bestSeller')
      if (lower === 'sale') return t('productCard.badge.sale')
      if (lower === 'limited edition') return t('productCard.badge.limitedEdition')
      if (lower === 'trending') return t('productCard.badge.trending')
      return b.toUpperCase()
    }
    return ''
  }

  const badgeLabel = getBadgeLabel()

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-link">{t('common.home')}</Link>
        <ChevronRight size={13} className="breadcrumb-separator" />
        <Link to={catalogPath} className="breadcrumb-link">{catalogName}</Link>
        <ChevronRight size={13} className="breadcrumb-separator" />
        <span className="breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-detail-layout">
        {/* Left: Product Image */}
        <div className="product-detail-media">
          <div className="product-detail-image-box">
            <img
              src={product.images?.[0] || (isJersey ? '/images/hero-jerseys-1.png' : '/images/products/shoes/shoes1.png')}
              alt={product.name}
              className="product-detail-main-img"
            />
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="product-detail-info">
          {badgeLabel && (
            <div className="product-detail-badge-wrap">
              <span className="product-detail-badge">{badgeLabel}</span>
            </div>
          )}

          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-price-row">
            <span className="product-detail-price">{formattedPrice}</span>
            <span className="product-detail-tax">{t('common.taxIncluded')}</span>
          </div>

          <p className="product-detail-description">{product.description}</p>

          {/* Sizes */}
          <div className="product-detail-sizes-section">
            <div className="product-sizes-header">
              <span className="product-sizes-label">{t('common.selectSize')}</span>
            </div>
            <div className="product-sizes-list">
              {product.availableSizes.map((sz) => (
                <button key={String(sz)} type="button" className="product-size-chip">
                  {String(sz)}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Bag */}
          <div className="product-detail-actions">
            <Button variant="dark" className="product-add-to-cart-btn">
              {t('common.addToBag')}
            </Button>
          </div>

          {/* Value Props */}
          <div className="product-detail-perks">
            <div className="perk-item">
              <Truck size={16} />
              <span>{t('common.freeShippingPerk')}</span>
            </div>
            <div className="perk-item">
              <ShieldCheck size={16} />
              <span>{t('common.authenticGuaranteed')}</span>
            </div>
            <div className="perk-item">
              <RefreshCw size={16} />
              <span>{t('common.exchangePerk')}</span>
            </div>
          </div>

          <div className="product-detail-back-link">
            <Link to={catalogPath} className="catalog-return-link">
              <ArrowLeft size={14} />
              <span>{t('common.backToCatalog', { catalog: catalogName })}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
