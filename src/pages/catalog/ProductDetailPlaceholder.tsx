import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  FileText,
  Ruler,
  AlertCircle,
  Star,
  Check,
  X,
  Menu,
} from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import {
  findProductBySlug,
  getLocalizedProduct,
  getCatalogProducts,
} from '../../services/productService'
import { formatPrice } from '../../utils/formatters'
import { ProductCard } from '../../components/products/ProductCard'
import type { JerseyProduct, ShoeProduct } from '../../types/product'
import './ProductDetailPlaceholder.css'

export const ProductDetailPlaceholder: React.FC = () => {
  const { t, language, currency } = useLocale()
  const { slug = '' } = useParams<{ slug: string }>()
  const { addToCart } = useCart()
  const { openCartDrawer } = useCartDrawer()

  const rawProduct = findProductBySlug(slug)

  const isJersey = rawProduct?.productType === 'jersey'
  const jerseyProduct = isJersey && rawProduct ? (rawProduct as JerseyProduct) : null
  const shoeProduct = !isJersey && rawProduct ? (rawProduct as ShoeProduct) : null

  const catalogPath = isJersey ? '/jerseys' : '/shoes'
  const catalogName = isJersey ? t('nav.jerseys') : t('nav.shoes')

  const product = useMemo(() => {
    return rawProduct ? getLocalizedProduct(rawProduct, language) : null
  }, [rawProduct, language])

  // Gallery image setup
  const galleryImages = useMemo(() => {
    const list: string[] = []
    if (product?.images && product.images.length > 0) {
      list.push(...product.images)
    }
    // If only 1 image exists, generate tasteful detail angles from existing assets so thumbnails are rich like reference
    if (list.length === 0) {
      list.push(isJersey ? '/images/hero-jerseys-1.png' : '/images/products/shoes/shoes1.png')
    } else if (list.length === 1 && isJersey) {
      const alternates = [
        '/images/products/jerseys/jersey1.png',
        '/images/products/jerseys/jersey2.png',
        '/images/products/jerseys/jersey4.png',
        '/images/products/jerseys/jersey6.png',
      ].filter((img) => img !== list[0])
      list.push(...alternates.slice(0, 5))
    } else if (list.length === 1 && !isJersey) {
      const alternates = [
        '/images/products/shoes/shoes2.png',
        '/images/products/shoes/shoes3.png',
        '/images/products/shoes/shoes4.png',
      ].filter((img) => img !== list[0])
      list.push(...alternates.slice(0, 3))
    }
    return list
  }, [product, isJersey])

  // Options & Form states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | number | null>(null)
  const [sizeError, setSizeError] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<'stadium' | 'authentic'>('stadium')
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [customName, setCustomName] = useState('')
  const [customNumber, setCustomNumber] = useState('')
  const [addShorts, setAddShorts] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [isSizeGuideModalOpen, setIsSizeGuideModalOpen] = useState(false)
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)
  const [comparisonZoomImage, setComparisonZoomImage] = useState<string | null>(null)

  const activeMainImage = galleryImages[selectedImageIndex] || galleryImages[0]

  // Viewer image navigation
  const handlePrevImage = useCallback(() => {
    if (galleryImages.length <= 1) return
    setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }, [galleryImages.length])

  const handleNextImage = useCallback(() => {
    if (galleryImages.length <= 1) return
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length)
  }, [galleryImages.length])

  // Prevent background scrolling and support keyboard navigation (Escape, Left Arrow, Right Arrow)
  useEffect(() => {
    const isAnyModalOpen = isZoomOpen || isSizeGuideModalOpen || isComparisonModalOpen || Boolean(comparisonZoomImage)
    if (!isAnyModalOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (comparisonZoomImage) {
          setComparisonZoomImage(null)
        } else if (isComparisonModalOpen) {
          setIsComparisonModalOpen(false)
        } else if (isSizeGuideModalOpen) {
          setIsSizeGuideModalOpen(false)
        } else if (isZoomOpen) {
          setIsZoomOpen(false)
        }
      } else if (isZoomOpen) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlePrevImage()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleNextImage()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isZoomOpen, isSizeGuideModalOpen, isComparisonModalOpen, comparisonZoomImage, handlePrevImage, handleNextImage])

  // Reset interactions and selection states when clicking suggested product
  const handleSuggestedProductNavigate = () => {
    setSelectedImageIndex(0)
    setSelectedSize(null)
    setSizeError(false)
    setSelectedStyle('stadium')
    setSelectedBadges([])
    setCustomName('')
    setCustomNumber('')
    setAddShorts(false)
    setIsAdded(false)
    setIsZoomOpen(false)
    setIsSizeGuideModalOpen(false)
    setIsComparisonModalOpen(false)
    setComparisonZoomImage(null)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  // Expandable sections accordion state (allow multi-open or toggle individual)
  const [isMobileProductInfoOpen, setIsMobileProductInfoOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: false,
    sizing: false,
    care: false,
    shipping: false,
    reviews: false,
    returns: false,
  })

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderAccordionRows = () => (
    <div className="product-accordions-group">
      {/* 1. Description */}
      <div className={`accordion-row ${expandedSections.description ? 'is-open' : ''}`}>
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggleSection('description')}
          aria-expanded={expandedSections.description}
        >
          <div className="accordion-title-left">
            <FileText size={15} className="accordion-icon" />
            <span>{t('productDetail.description').toUpperCase()}</span>
          </div>
          <ChevronDown size={16} className="accordion-chevron" />
        </button>
        {expandedSections.description && (
          <div className="accordion-body">
            <p>{product?.description}</p>
            {isJersey && (
              <ul className="accordion-features-list">
                <li><strong>{t('catalog.filterGroup.fit', { defaultValue: 'Fit' })}:</strong> {jerseyProduct?.fit || 'Standard Athletic Fit'}</li>
                <li><strong>{t('catalog.filterGroup.material', { defaultValue: 'Material' })}:</strong> {jerseyProduct?.material || '100% Breathable Recycled Polyester with Moisture Management'}</li>
                {product?.features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
            {!isJersey && shoeProduct && (
              <ul className="accordion-features-list">
                <li><strong>Upper:</strong> {shoeProduct.construction?.upperMaterial}</li>
                <li><strong>Lining:</strong> {shoeProduct.construction?.liningMaterial}</li>
                <li><strong>Sole:</strong> {shoeProduct.construction?.soleMaterial}</li>
                <li><strong>Fit:</strong> {shoeProduct.fit}</li>
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 2. Sizing Guide / Chart */}
      <div className={`accordion-row ${expandedSections.sizing ? 'is-open' : ''}`}>
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggleSection('sizing')}
          aria-expanded={expandedSections.sizing}
        >
          <div className="accordion-title-left">
            <Ruler size={15} className="accordion-icon" />
            <span>{(t('productDetail.sizingChart') || t('productDetail.sizingGuide')).toUpperCase()}</span>
          </div>
          <ChevronDown size={16} className="accordion-chevron" />
        </button>
        {expandedSections.sizing && (
          <div className="accordion-body">
            {isJersey ? (
              <div className="sizing-table-wrap">
                <table className="sizing-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Chest (Inches)</th>
                      <th>Chest (cm)</th>
                      <th>Fit Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>XS</td><td>34 - 36"</td><td>86 - 91 cm</td><td>Slim / Youth</td></tr>
                    <tr><td>S</td><td>36 - 38"</td><td>91 - 96 cm</td><td>Regular</td></tr>
                    <tr><td>M</td><td>38 - 40"</td><td>96 - 101 cm</td><td>Regular</td></tr>
                    <tr><td>L</td><td>40 - 42"</td><td>101 - 106 cm</td><td>Regular</td></tr>
                    <tr><td>XL</td><td>42 - 44"</td><td>106 - 111 cm</td><td>Athletic Relaxed</td></tr>
                    <tr><td>XXL</td><td>44 - 46"</td><td>111 - 117 cm</td><td>Relaxed</td></tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sizing-table-wrap">
                <table className="sizing-table">
                  <thead>
                    <tr>
                      <th>EU Size</th>
                      <th>US Size</th>
                      <th>UK Size</th>
                      <th>Foot Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>40</td><td>7.5</td><td>6.5</td><td>25.4 cm</td></tr>
                    <tr><td>41</td><td>8.0</td><td>7.0</td><td>26.0 cm</td></tr>
                    <tr><td>42</td><td>8.5</td><td>7.5</td><td>26.7 cm</td></tr>
                    <tr><td>43</td><td>9.5</td><td>8.5</td><td>27.3 cm</td></tr>
                    <tr><td>44</td><td>10.0</td><td>9.0</td><td>28.0 cm</td></tr>
                    <tr><td>45</td><td>11.0</td><td>10.0</td><td>28.7 cm</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Care Instructions */}
      <div className={`accordion-row ${expandedSections.care ? 'is-open' : ''}`}>
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggleSection('care')}
          aria-expanded={expandedSections.care}
        >
          <div className="accordion-title-left">
            <AlertCircle size={15} className="accordion-icon" />
            <span>{t('productDetail.careInstructions').toUpperCase()}</span>
          </div>
          <ChevronDown size={16} className="accordion-chevron" />
        </button>
        {expandedSections.care && (
          <div className="accordion-body">
            <p>{t('productDetail.careInstructionsContent')}</p>
          </div>
        )}
      </div>

      {/* 4. Shipping */}
      <div className={`accordion-row ${expandedSections.shipping ? 'is-open' : ''}`}>
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggleSection('shipping')}
          aria-expanded={expandedSections.shipping}
        >
          <div className="accordion-title-left">
            <Truck size={15} className="accordion-icon" />
            <span>{t('productDetail.shipping').toUpperCase()}</span>
          </div>
          <ChevronDown size={16} className="accordion-chevron" />
        </button>
        {expandedSections.shipping && (
          <div className="accordion-body">
            <p>{t('productDetail.shippingContent')}</p>
          </div>
        )}
      </div>

      {/* 5. Reviews */}
      <div className={`accordion-row ${expandedSections.reviews ? 'is-open' : ''}`}>
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggleSection('reviews')}
          aria-expanded={expandedSections.reviews}
        >
          <div className="accordion-title-left">
            <Star size={15} className="accordion-icon" />
            <span>{t('productDetail.reviews').toUpperCase()}</span>
          </div>
          <ChevronDown size={16} className="accordion-chevron" />
        </button>
        {expandedSections.reviews && (
          <div className="accordion-body">
            <div className="reviews-rating-banner">
              <span className="reviews-stars">★★★★★</span>
              <span className="reviews-score">{product?.rating || '4.9'} / 5</span>
              <span className="reviews-count">({product?.reviewCount || 142} verified reviews)</span>
            </div>
            <p>{t('productDetail.reviewsSummary')}</p>
          </div>
        )}
      </div>

      {/* 6. Returns */}
      <div className={`accordion-row ${expandedSections.returns ? 'is-open' : ''}`}>
        <button
          type="button"
          className="accordion-header"
          onClick={() => toggleSection('returns')}
          aria-expanded={expandedSections.returns}
        >
          <div className="accordion-title-left">
            <RefreshCw size={15} className="accordion-icon" />
            <span>{t('productDetail.returns').toUpperCase()}</span>
          </div>
          <ChevronDown size={16} className="accordion-chevron" />
        </button>
        {expandedSections.returns && (
          <div className="accordion-body">
            <p>{t('productDetail.returnsContent')}</p>
          </div>
        )}
      </div>
    </div>
  )

  // Related products
  const relatedProducts = useMemo(() => {
    if (!rawProduct) return []
    const catalog = getCatalogProducts(rawProduct.productType)
    return catalog.filter((p) => p.slug !== rawProduct.slug).slice(0, 6)
  }, [rawProduct])

  // Configurable comparison images: product-specific if defined, otherwise authentic match pair
  const comparisonImages = useMemo(() => {
    return {
      stadium: jerseyProduct?.comparisonImages?.stadiumImage || '/images/info/stadium.jpeg',
      authentic: jerseyProduct?.comparisonImages?.authenticImage || '/images/info/authentic.jpeg',
    }
  }, [jerseyProduct])

  // Pricing calculations
  const basePrice = product?.price || 0
  const authenticExtra = 26
  const badgeExtra = 11
  const personalExtra = 25
  const shortsExtra = 132

  const hasPersonalisation = customName.trim().length > 0 || customNumber.trim().length > 0

  const totalPrice = useMemo(() => {
    let sum = basePrice
    if (isJersey && selectedStyle === 'authentic') {
      sum += authenticExtra
    }
    if (isJersey) {
      sum += selectedBadges.length * badgeExtra
      if (hasPersonalisation) {
        sum += personalExtra
      }
      if (addShorts) {
        sum += shortsExtra
      }
    }
    return sum
  }, [basePrice, isJersey, selectedStyle, selectedBadges, hasPersonalisation, addShorts])

  const formattedTotalPrice = formatPrice(totalPrice, language, currency)
  const formattedAuthenticExtra = formatPrice(authenticExtra, language, currency)
  const formattedBadgeExtra = formatPrice(badgeExtra, language, currency)
  const formattedPersonalExtra = formatPrice(personalExtra, language, currency)
  const formattedShortsExtra = formatPrice(shortsExtra, language, currency)

  // Badge category label at top of right column
  const topBadge = useMemo(() => {
    if (product?.badges && product.badges.length > 0) {
      return product.badges[0].toUpperCase()
    }
    if (isJersey && jerseyProduct?.category) {
      return jerseyProduct.category.toUpperCase()
    }
    return 'SERIES'
  }, [product, isJersey, jerseyProduct])

  // Subtitle (season or collection detail)
  const subtitle = useMemo(() => {
    if (!product) return ''
    if (isJersey) {
      const match = product.name.match(/\d{4}\/\d{2,4}|\d{4}/)
      return match ? `Season ${match[0]}` : (jerseyProduct?.team || 'Official Kit')
    }
    return shoeProduct?.construction?.upperMaterial || 'Handcrafted Collection'
  }, [isJersey, product, jerseyProduct, shoeProduct])

  // Dynamic delivery dates with short format (Nov 12 – Nov 17), omitting year if same year
  const deliveryRange = useMemo(() => {
    // Delivery window: 2026-11-12 to 2026-11-17
    const startDate = new Date(2026, 10, 12)
    const endDate = new Date(2026, 10, 17)
    const isSameYear = startDate.getFullYear() === endDate.getFullYear()

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      ...(isSameYear ? {} : { year: 'numeric' }),
    }

    const locale = language === 'ar' ? 'ar' : 'en-US'
    const startFormatted = new Intl.DateTimeFormat(locale, options).format(startDate)
    const endFormatted = new Intl.DateTimeFormat(locale, options).format(endDate)

    return {
      start: startFormatted,
      end: endFormatted,
    }
  }, [language])

  if (!rawProduct || !product) {
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

  const toggleBadgeSelection = (badgeName: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeName) ? prev.filter((b) => b !== badgeName) : [...prev, badgeName]
    )
  }

  // Add to Bag handler
  const handleAddToBag = () => {
    if (!selectedSize) {
      setSizeError(true)
      return
    }
    setSizeError(false)

    // Build custom specs note if personalized or styled
    const customNotes: string[] = []
    if (isJersey) {
      if (selectedStyle === 'authentic') customNotes.push('Authentic Player Fit')
      if (selectedBadges.length > 0) customNotes.push(`Badges: ${selectedBadges.join(', ')}`)
      if (hasPersonalisation) {
        customNotes.push(`Name: ${customName.toUpperCase().trim() || 'N/A'}, #${customNumber.trim() || '0'}`)
      }
      if (addShorts) customNotes.push('Includes Matching Shorts')
    }

    const itemTitle = customNotes.length > 0
      ? `${product.name} (${customNotes.join(' | ')})`
      : product.name

    addToCart({
      productSlug: product.slug,
      size: selectedSize,
      quantity: 1,
      price: totalPrice,
      name: itemTitle,
      image: activeMainImage,
      brandOrTeam: isJersey ? jerseyProduct?.team : shoeProduct?.brand,
    })

    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
      openCartDrawer()
    }, 500)
  }

  return (
    <div className="product-detail-page">
      {/* Top Breadcrumb */}
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-link">{t('common.home').toUpperCase()}</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to={catalogPath} className="breadcrumb-link">{catalogName.toUpperCase()}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name.toUpperCase()}</span>
      </nav>

      {/* Main Two Column Grid */}
      <div className="product-detail-layout">
        {/* ================= LEFT COLUMN: GALLERY & EXPANDABLE ACCORDIONS ================= */}
        <div className="product-left-column">
          {/* Main Product Image Container */}
          <div
            className="product-main-image-wrap"
            onClick={() => setIsZoomOpen(true)}
            role="button"
            tabIndex={0}
            aria-label="Zoom product image"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsZoomOpen(true)
              }
            }}
          >
            <div className="product-main-image-inner">
              <img
                src={activeMainImage}
                alt={product.name}
                className="product-main-image"
                loading="eager"
              />
            </div>
          </div>

          {/* Horizontal Thumbnails Row */}
          <div className="product-thumbnails-strip" role="tablist" aria-label="Product thumbnails">
            {galleryImages.map((imgSrc, idx) => {
              const isSelected = idx === selectedImageIndex
              return (
                <button
                  key={`${imgSrc}-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`product-thumbnail-btn ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                >
                  <img src={imgSrc} alt={`${product.name} thumbnail ${idx + 1}`} />
                </button>
              )
            })}
          </div>

          {/* Desktop Left Column Accordions */}
          <div className="product-accordions-desktop">
            {renderAccordionRows()}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PRODUCT INFORMATION & ACTIONS ================= */}
        <div className="product-right-column">
          {/* Badge & Series */}
          <div className="product-meta-header">
            <span className="product-top-badge">{topBadge}</span>
          </div>

          {/* Main Title */}
          <h1 className="product-title-heading">{product.name}</h1>

          {/* Subtitle / Season */}
          <p className="product-subtitle">{subtitle}</p>

          {/* Estimated Delivery pill */}
          <div className="estimated-delivery-pill">
            <Truck size={14} className="delivery-icon" />
            <span className="delivery-text">
              {t('productDetail.estimatedDelivery', {
                start: deliveryRange.start,
                end: deliveryRange.end,
              })}
            </span>
          </div>

          {/* Options: Style Selection (Stadium vs Authentic) */}
          {isJersey && (
            <div className="option-section">
              <div className="option-label-row">
                <span className="option-label">{t('productDetail.selectStyle')}</span>
              </div>
              <div className="style-buttons-row">
                <button
                  type="button"
                  className={`style-toggle-btn ${selectedStyle === 'stadium' ? 'is-active' : ''}`}
                  onClick={() => setSelectedStyle('stadium')}
                >
                  {t('productDetail.stadium')}
                </button>
                <button
                  type="button"
                  className={`style-toggle-btn ${selectedStyle === 'authentic' ? 'is-active' : ''}`}
                  onClick={() => setSelectedStyle('authentic')}
                >
                  {t('productDetail.playerAuthentic', { amount: formattedAuthenticExtra })}
                </button>
                <button
                  type="button"
                  className="style-info-btn"
                  aria-label="Stadium vs Authentic comparison"
                  title="Stadium vs Authentic comparison"
                  onClick={() => setIsComparisonModalOpen(true)}
                >
                  <Info size={14} />
                  <span>{t('productDetail.info')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Options: Select Badges */}
          {isJersey && (
            <div className="option-section">
              <div className="option-label-row">
                <span className="option-label">{t('productDetail.selectBadges')}</span>
              </div>
              <div className="badge-options-row">
                {['UEFA CHAMPIONS LEAGUE', 'PREMIER LEAGUE'].map((badgeName) => {
                  const isChecked = selectedBadges.includes(badgeName)
                  return (
                    <button
                      key={badgeName}
                      type="button"
                      className={`badge-selector-btn ${isChecked ? 'is-active' : ''}`}
                      onClick={() => toggleBadgeSelection(badgeName)}
                    >
                      {isChecked && <Check size={12} className="check-badge-icon" />}
                      <span>{badgeName} (+ {formattedBadgeExtra})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Personalisation Box */}
          {isJersey && (
            <div className="personalise-box">
              <div className="personalise-box-header">
                <Sparkles size={14} className="personalise-sparkle" />
                <span className="personalise-heading">{t('productDetail.personaliseJersey')}</span>
              </div>
              <p className="personalise-subtext">
                {t('productDetail.nameAndNumber', { amount: formattedPersonalExtra })}
              </p>
              <div className="personalise-inputs-row">
                <div className="personalise-input-col name-col">
                  <label className="input-field-label">NAME</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder={t('productDetail.namePlaceholder')}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                    className="custom-field-input"
                  />
                </div>
                <div className="personalise-input-col number-col">
                  <label className="input-field-label">NUMBER</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder={t('productDetail.numberPlaceholder')}
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="custom-field-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Size Selector */}
          <div className="option-section size-selector-section">
            <div className="option-label-row between">
              <span className="option-label">{t('catalog.filterGroup.size', { defaultValue: 'SELECT SIZE' })}</span>
              <button
                type="button"
                className="view-size-guide-btn"
                onClick={() => setIsSizeGuideModalOpen(true)}
              >
                {t('productDetail.viewSizeGuide')}
              </button>
            </div>
            <div className="size-group-sublabel">
              {isJersey ? 'ADULT' : 'EU SIZING'}
            </div>
            <div className="size-selector-grid">
              {product.availableSizes.map((sz) => {
                const isSelected = String(selectedSize) === String(sz)
                return (
                  <button
                    key={String(sz)}
                    type="button"
                    className={`size-chip-box ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedSize(sz)
                      setSizeError(false)
                    }}
                  >
                    {String(sz)}
                  </button>
                )
              })}
            </div>
            {sizeError && (
              <p className="size-error-notice">{t('productDetail.pleaseSelectSize')}</p>
            )}
          </div>

          {/* Add Matching Shorts Checkbox */}
          {isJersey && (
            <div className="add-shorts-box">
              <label className="shorts-checkbox-label">
                <input
                  type="checkbox"
                  checked={addShorts}
                  onChange={(e) => setAddShorts(e.target.checked)}
                  className="shorts-native-checkbox"
                />
                <div className="shorts-custom-check">
                  {addShorts && <Check size={12} />}
                </div>
                <div className="shorts-text-wrap">
                  <div className="shorts-title-row">
                    <span className="shorts-main-text">{t('productDetail.addMatchingShorts')}</span>
                    <span className="shorts-cost">+ {formattedShortsExtra}</span>
                  </div>
                  <span className="shorts-subtext">{t('productDetail.completeYourKit')}</span>
                </div>
              </label>
            </div>
          )}

          {/* Total Row */}
          <div className="total-calculation-row">
            <span className="total-label">{t('productDetail.total')}</span>
            <span className="total-amount-display">{formattedTotalPrice}</span>
          </div>

          {/* Add to Bag Button */}
          <div className="action-button-block">
            <button
              type="button"
              className={`add-to-bag-cta-btn ${isAdded ? 'is-added' : ''}`}
              onClick={handleAddToBag}
            >
              {isAdded ? t('productDetail.addedToBag') : t('common.addToBag')}
            </button>
          </div>

          {/* Value Perks Strip */}
          <div className="product-perks-strip">
            <div className="perk-row">
              <Truck size={16} className="perk-icon" />
              <span>{t('common.freeShippingPerk')}</span>
            </div>
            <div className="perk-row">
              <ShieldCheck size={16} className="perk-icon" />
              <span>{t('common.authenticGuaranteed')}</span>
            </div>
            <div className="perk-row">
              <RefreshCw size={16} className="perk-icon" />
              <span>{t('common.exchangePerk')}</span>
            </div>
          </div>

          {/* Mobile Product Information Toggle Row & Accordions */}
          <div className="mobile-product-info-wrapper">
            <div className="mobile-product-info-row">
              <button
                type="button"
                className="mobile-product-info-toggle-btn"
                onClick={() => setIsMobileProductInfoOpen((prev) => !prev)}
                aria-expanded={isMobileProductInfoOpen}
              >
                <div className="mobile-product-info-left">
                  <Menu size={18} className="mobile-product-info-menu-icon" />
                  <span className="mobile-product-info-title">
                    {t('productDetail.productInformation', { defaultValue: 'PRODUCT INFORMATION' }).toUpperCase()}
                  </span>
                </div>
                <div className="mobile-product-info-right">
                  <span className="mobile-product-info-action-text">
                    {isMobileProductInfoOpen
                      ? t('productDetail.hide', { defaultValue: 'HIDE' }).toUpperCase()
                      : t('productDetail.view', { defaultValue: 'VIEW' }).toUpperCase()}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`mobile-product-info-chevron ${isMobileProductInfoOpen ? 'is-open' : ''}`}
                  />
                </div>
              </button>
            </div>
            {isMobileProductInfoOpen && (
              <div className="mobile-product-accordions-container">
                {renderAccordionRows()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM: YOU MAY ALSO LIKE SECTION ================= */}
      {relatedProducts.length > 0 && (
        <section
          className="you-may-also-like-section"
          aria-label={t('productDetail.youMayAlsoLike')}
          data-product-type={isJersey ? 'jersey' : 'shoe'}
        >
          <div className="ymal-header">
            <h2 className="ymal-title">{t('productDetail.youMayAlsoLike')}</h2>
            <Link to={catalogPath} className="ymal-view-all">
              <span>{t('collections.viewAll').toUpperCase()}</span>
              <ArrowRight size={14} className="ymal-view-all-arrow" aria-hidden="true" />
            </Link>
          </div>
          <div className="ymal-products-grid">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id || p.slug}
                product={p}
                onNavigate={handleSuggestedProductNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================= FULL SCREEN IMAGE VIEWER ================= */}
      {isZoomOpen && (
        <div
          className="product-fullscreen-viewer"
          onClick={() => setIsZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image viewer"
        >
          <button
            type="button"
            className="fullscreen-viewer-close-btn"
            onClick={() => setIsZoomOpen(false)}
            aria-label="Close full screen view"
          >
            <X size={26} />
          </button>

          {galleryImages.length > 1 && (
            <button
              type="button"
              className="fullscreen-viewer-nav-btn fullscreen-viewer-nav-prev"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              aria-label="Previous product image"
            >
              <ChevronLeft size={30} />
            </button>
          )}

          <div
            className="fullscreen-viewer-image-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeMainImage}
              alt={product.name}
              className="fullscreen-viewer-img"
            />
          </div>

          {galleryImages.length > 1 && (
            <button
              type="button"
              className="fullscreen-viewer-nav-btn fullscreen-viewer-nav-next"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              aria-label="Next product image"
            >
              <ChevronRight size={30} />
            </button>
          )}
        </div>
      )}

      {/* ================= MODAL: SIZE GUIDE POPUP ================= */}
      {isSizeGuideModalOpen && (
        <div className="zoom-modal-backdrop" onClick={() => setIsSizeGuideModalOpen(false)}>
          <div className="size-guide-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="size-guide-modal-header">
              <h3>{t('productDetail.sizingGuide')}</h3>
              <button
                type="button"
                className="zoom-close-btn"
                onClick={() => setIsSizeGuideModalOpen(false)}
                aria-label="Close size guide"
              >
                <X size={20} />
              </button>
            </div>
            <div className="size-guide-modal-body">
              <p>Find your optimal fit. Measurements refer to body dimensions.</p>
              {isJersey ? (
                <table className="sizing-table modal-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Chest (in)</th>
                      <th>Chest (cm)</th>
                      <th>Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>XS</td><td>34-36</td><td>86-91</td><td>68</td></tr>
                    <tr><td>S</td><td>36-38</td><td>91-96</td><td>71</td></tr>
                    <tr><td>M</td><td>38-40</td><td>96-101</td><td>74</td></tr>
                    <tr><td>L</td><td>40-42</td><td>101-106</td><td>76</td></tr>
                    <tr><td>XL</td><td>42-44</td><td>106-111</td><td>78</td></tr>
                    <tr><td>XXL</td><td>44-46</td><td>111-117</td><td>80</td></tr>
                  </tbody>
                </table>
              ) : (
                <table className="sizing-table modal-table">
                  <thead>
                    <tr>
                      <th>EU</th>
                      <th>US</th>
                      <th>UK</th>
                      <th>Length (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>40</td><td>7.5</td><td>6.5</td><td>25.4</td></tr>
                    <tr><td>41</td><td>8.0</td><td>7.0</td><td>26.0</td></tr>
                    <tr><td>42</td><td>8.5</td><td>7.5</td><td>26.7</td></tr>
                    <tr><td>43</td><td>9.5</td><td>8.5</td><td>27.3</td></tr>
                    <tr><td>44</td><td>10.0</td><td>9.0</td><td>28.0</td></tr>
                    <tr><td>45</td><td>11.0</td><td>10.0</td><td>28.7</td></tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STADIUM VS AUTHENTIC COMPARISON ================= */}
      {isComparisonModalOpen && (
        <div className="zoom-modal-backdrop" onClick={() => setIsComparisonModalOpen(false)}>
          <div
            className="comparison-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-modal-title"
          >
            <div className="comparison-modal-header">
              <button
                type="button"
                className="comparison-modal-close-btn"
                onClick={() => setIsComparisonModalOpen(false)}
                aria-label="Close comparison"
              >
                <X size={18} />
              </button>
              <div className="comparison-header-titles">
                <h3 id="comparison-modal-title">{t('productDetail.comparison.title')}</h3>
                <p className="comparison-modal-subtitle">{t('productDetail.comparison.subtitle')}</p>
              </div>
            </div>

            <div className="comparison-modal-body">
              {/* Two Column Visual Cards */}
              <div className="comparison-columns-grid">
                {/* STADIUM COLUMN */}
                <div className="comparison-column-card">
                  <div
                    className="comparison-image-container"
                    onClick={() => setComparisonZoomImage(comparisonImages.stadium)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Zoom ${t('productDetail.comparison.stadiumLabel')} image`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setComparisonZoomImage(comparisonImages.stadium)
                      }
                    }}
                  >
                    <img
                      src={comparisonImages.stadium}
                      alt={t('productDetail.comparison.stadiumLabel')}
                      className="comparison-jersey-img"
                      loading="lazy"
                    />
                  </div>

                  <h4 className="comparison-tier-name">{t('productDetail.comparison.stadiumLabel')}</h4>
                  <p className="comparison-tier-summary">{t('productDetail.comparison.stadiumSummary')}</p>
                </div>

                {/* AUTHENTIC COLUMN */}
                <div className="comparison-column-card is-authentic-card">
                  <div
                    className="comparison-image-container"
                    onClick={() => setComparisonZoomImage(comparisonImages.authentic)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Zoom ${t('productDetail.comparison.authenticLabel')} image`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setComparisonZoomImage(comparisonImages.authentic)
                      }
                    }}
                  >
                    <img
                      src={comparisonImages.authentic}
                      alt={t('productDetail.comparison.authenticLabel')}
                      className="comparison-jersey-img"
                      loading="lazy"
                    />
                  </div>

                  <h4 className="comparison-tier-name">{t('productDetail.comparison.authenticLabel')}</h4>
                  <p className="comparison-tier-summary">{t('productDetail.comparison.authenticSummary')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: COMPARISON IMAGE LIGHTBOX ZOOM ================= */}
      {comparisonZoomImage && (
        <div className="zoom-modal-backdrop" onClick={() => setComparisonZoomImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="zoom-close-btn"
              onClick={() => setComparisonZoomImage(null)}
              aria-label="Close comparison zoom"
            >
              <X size={24} />
            </button>
            <img src={comparisonZoomImage} alt="Enlarged comparison view" className="zoom-expanded-img" />
          </div>
        </div>
      )}
    </div>
  )
}
