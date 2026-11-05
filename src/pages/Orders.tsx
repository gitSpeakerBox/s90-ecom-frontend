import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  Search,
  X,
  ArrowLeft,
  Check,
  Package,
  MapPin,
  CreditCard,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useLocale } from '../context/LocaleContext'
import { getOrders, getOrderById } from '../services/orderService'
import type { Order, OrderStatus } from '../types/order'
import { formatPrice, formatPaginationNumber } from '../utils/formatters'
import './Orders.css'

const ORDER_STEPS: OrderStatus[] = [
  'Processing',
  'Packed',
  'Shipped',
  'Out for delivery',
  'Delivered',
]

const ORDERS_PER_PAGE = 5

const STATUS_COLOR_MAP: Record<OrderStatus, string> = {
  Processing: '#d97706',
  Packed: '#6366f1',
  Shipped: '#2563eb',
  'Out for delivery': '#ea580c',
  Delivered: '#16a34a',
}

interface StatusChipConfig {
  status: OrderStatus | 'all'
  labelKey: string
  defaultLabel: string
}

const STATUS_FILTER_CHIPS: StatusChipConfig[] = [
  { status: 'all', labelKey: 'orders.status.all', defaultLabel: 'All' },
  { status: 'Processing', labelKey: 'orders.status.processing', defaultLabel: 'Processing' },
  { status: 'Packed', labelKey: 'orders.status.packed', defaultLabel: 'Packed' },
  { status: 'Shipped', labelKey: 'orders.status.shipped', defaultLabel: 'Shipped' },
  { status: 'Out for delivery', labelKey: 'orders.status.outForDelivery', defaultLabel: 'Out for delivery' },
  { status: 'Delivered', labelKey: 'orders.status.delivered', defaultLabel: 'Delivered' },
]

const normalizeStatusParam = (param: string | null): OrderStatus | 'all' => {
  if (!param) return 'all'
  const clean = param.toLowerCase().replace(/[-_ ]+/g, '')
  if (clean === 'processing') return 'Processing'
  if (clean === 'packed') return 'Packed'
  if (clean === 'shipped') return 'Shipped'
  if (clean === 'outfordelivery') return 'Out for delivery'
  if (clean === 'delivered') return 'Delivered'
  return 'all'
}

const statusToParam = (status: OrderStatus | 'all'): string | null => {
  switch (status) {
    case 'Processing':
      return 'processing'
    case 'Packed':
      return 'packed'
    case 'Shipped':
      return 'shipped'
    case 'Out for delivery':
      return 'out-for-delivery'
    case 'Delivered':
      return 'delivered'
    default:
      return null
  }
}

export const Orders: React.FC = () => {
  const { t, language } = useLocale()
  const { orderId } = useParams<{ orderId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'jerseys' | 'shoes'>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Detail view state for collapsible items and scroll fade
  const [isExpandedMobile, setIsExpandedMobile] = useState(false)
  const [hasMoreBelow, setHasMoreBelow] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Status chip row refs for scrolling active chip into view
  const statusRowRef = useRef<HTMLDivElement>(null)
  const selectedChipRef = useRef<HTMLButtonElement>(null)

  // Read status from URL query param
  const selectedStatus: OrderStatus | 'all' = useMemo(() => {
    return normalizeStatusParam(searchParams.get('status'))
  }, [searchParams])

  const handleStatusSelect = (status: OrderStatus | 'all') => {
    const nextParams = new URLSearchParams(searchParams)
    const paramVal = statusToParam(status)
    if (paramVal) {
      nextParams.set('status', paramVal)
    } else {
      nextParams.delete('status')
    }
    setSearchParams(nextParams)
    setCurrentPage(1)
  }

  // Scroll selected chip into view on small screens
  useEffect(() => {
    if (selectedChipRef.current && statusRowRef.current) {
      const row = statusRowRef.current
      const chip = selectedChipRef.current
      const rowRect = row.getBoundingClientRect()
      const chipRect = chip.getBoundingClientRect()
      if (chipRect.left < rowRect.left || chipRect.right > rowRect.right) {
        chip.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      }
    }
  }, [selectedStatus])

  // Load orders
  useEffect(() => {
    let mounted = true
    getOrders().then((data) => {
      if (mounted) {
        setOrders(data)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // If orderId is in URL, fetch order by ID if not already in orders list
  useEffect(() => {
    let mounted = true
    if (orderId) {
      getOrderById(orderId).then((found) => {
        if (mounted) {
          setFetchedOrder(found)
        }
      })
    }
    return () => {
      mounted = false
    }
  }, [orderId])

  const selectedOrder: Order | null = useMemo(() => {
    if (!orderId) return null
    const match = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase())
    return match || fetchedOrder
  }, [orderId, orders, fetchedOrder])

  // Helper for scroll fade on desktop
  const checkScrollFade = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el || !selectedOrder || selectedOrder.items.length <= 4) {
      setHasMoreBelow(false)
      return
    }
    if (window.innerWidth < 768) {
      setHasMoreBelow(false)
      return
    }
    const isScrollable = el.scrollHeight > el.clientHeight
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 6
    setHasMoreBelow(isScrollable && !atBottom)
  }, [selectedOrder])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollFade()
    }, 50)
    return () => clearTimeout(timer)
  }, [selectedOrder, checkScrollFade])

  useEffect(() => {
    const handleResize = () => checkScrollFade()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [checkScrollFade])

  // Helper for status translation
  const getStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'Processing':
        return t('orders.status.processing')
      case 'Packed':
        return t('orders.status.packed')
      case 'Shipped':
        return t('orders.status.shipped')
      case 'Out for delivery':
        return t('orders.status.outForDelivery')
      case 'Delivered':
        return t('orders.status.delivered')
      default:
        return status
    }
  }

  // Helper for localized dates
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-QA-u-nu-latn' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date)
    } catch {
      return dateStr
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedSearch(searchQuery.trim())
    setCurrentPage(1)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setAppliedSearch('')
    setCurrentPage(1)
  }

  const handleClearAllFilters = () => {
    setSearchQuery('')
    setAppliedSearch('')
    setActiveTab('all')
    handleStatusSelect('all')
    setCurrentPage(1)
  }

  // Combined search term (effective live or applied)
  const effectiveSearch = (appliedSearch || searchQuery).trim()

  // Tab counts respect current search
  const tabCounts = useMemo(() => {
    const query = effectiveSearch.toLowerCase().replace('#', '')
    const pool = query
      ? orders.filter((order) => {
          const matchId = order.id.toLowerCase().includes(query)
          const matchItem = order.items.some(
            (i) =>
              i.productName.toLowerCase().includes(query) ||
              i.productSlug.toLowerCase().includes(query)
          )
          return matchId || matchItem
        })
      : orders

    return {
      all: pool.length,
      jerseys: pool.filter((o) => o.items.some((i) => i.category === 'jerseys')).length,
      shoes: pool.filter((o) => o.items.some((i) => i.category === 'shoes')).length,
    }
  }, [orders, effectiveSearch])

  // Base orders matching category tab AND search text
  const baseOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'jerseys') {
        const hasJersey = order.items.some((i) => i.category === 'jerseys')
        if (!hasJersey) return false
      } else if (activeTab === 'shoes') {
        const hasShoe = order.items.some((i) => i.category === 'shoes')
        if (!hasShoe) return false
      }

      // Search filter
      if (effectiveSearch) {
        const query = effectiveSearch.toLowerCase().replace('#', '')
        const matchId = order.id.toLowerCase().includes(query)
        const matchItem = order.items.some(
          (i) =>
            i.productName.toLowerCase().includes(query) ||
            i.productSlug.toLowerCase().includes(query)
        )
        if (!matchId && !matchItem) return false
      }

      return true
    })
  }, [orders, activeTab, effectiveSearch])

  // Status chip counts calculated from baseOrders (respect search & category tab)
  const statusCounts = useMemo(() => {
    return {
      all: baseOrders.length,
      Processing: baseOrders.filter((o) => o.status === 'Processing').length,
      Packed: baseOrders.filter((o) => o.status === 'Packed').length,
      Shipped: baseOrders.filter((o) => o.status === 'Shipped').length,
      'Out for delivery': baseOrders.filter((o) => o.status === 'Out for delivery').length,
      Delivered: baseOrders.filter((o) => o.status === 'Delivered').length,
    }
  }, [baseOrders])

  // Filtered orders combine search text AND category tab AND status
  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'all') {
      return baseOrders
    }
    return baseOrders.filter((order) => order.status === selectedStatus)
  }, [baseOrders, selectedStatus])

  const isAnyFilterActive =
    effectiveSearch !== '' ||
    activeTab !== 'all' ||
    selectedStatus !== 'all'

  // Reset page when search or any filters change
  const filterKey = `${effectiveSearch}|${activeTab}|${selectedStatus}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)

  // Clamp current page if total pages decreases below current page
  if (totalPages > 0 && currentPage > totalPages) {
    setCurrentPage(1)
  }

  // Paginated slice for current page
  const paginatedOrders = useMemo(() => {
    const activePage = totalPages > 0 && currentPage > totalPages ? 1 : currentPage
    const startIndex = (activePage - 1) * ORDERS_PER_PAGE
    return filteredOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE)
  }, [filteredOrders, currentPage, totalPages])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage)
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }, [currentPage, totalPages])

  // Get index of status step (0 to 4)
  const getStepIndex = (status: OrderStatus): number => {
    return ORDER_STEPS.indexOf(status)
  }

  const backLinkTarget = searchParams.toString()
    ? `/track-order?${searchParams.toString()}`
    : '/track-order'

  /* ----------------------------------------------------
     DETAIL VIEW (when /track-order/:orderId is active)
  ----------------------------------------------------- */
  if (orderId) {
    if (loading) {
      return (
        <div className="orders-page-container">
          <div className="orders-loading-spinner" aria-label="Loading order..." />
        </div>
      )
    }

    if (!selectedOrder) {
      return (
        <div className="orders-page-container">
          <div className="orders-breadcrumb">
            <Link to={backLinkTarget} className="orders-back-link">
              <ArrowLeft size={16} className="orders-back-icon" />
              <span>{t('orders.backToOrders')}</span>
            </Link>
          </div>
          <div className="orders-empty-state">
            <Package size={40} className="orders-empty-icon" />
            <h2 className="orders-empty-title">{t('orders.empty.title')}</h2>
            <p className="orders-empty-desc">
              {t('orders.empty.desc')} ({orderId})
            </p>
            <Link to={backLinkTarget} className="orders-action-btn dark">
              {t('orders.empty.viewAllOrders')}
            </Link>
          </div>
        </div>
      )
    }

    const currentStepIdx = getStepIndex(selectedOrder.status)
    const totalItems = selectedOrder.items.length

    return (
      <div className="orders-page-container">
        <div className="orders-breadcrumb">
          <Link to={backLinkTarget} className="orders-back-link">
            <ArrowLeft size={16} className="orders-back-icon" />
            <span>{t('orders.backToOrders')}</span>
          </Link>
        </div>

        <div className="orders-detail-header">
          <div>
            <h1 className="orders-detail-title">{t('orders.detailsTitle')}</h1>
            <div className="orders-detail-meta">
              <span className="orders-id-tag">#{selectedOrder.id}</span>
              <span className="orders-meta-divider">•</span>
              <span className="orders-date-text">
                {t('orders.placedOn')} {formatDate(selectedOrder.date)}
              </span>
            </div>
          </div>
          <div className="orders-status-badge">
            <span
              className="status-dot"
              style={{ backgroundColor: STATUS_COLOR_MAP[selectedOrder.status] }}
            />
            <span className="status-label">{getStatusLabel(selectedOrder.status)}</span>
          </div>
        </div>

        {/* Detailed Timeline */}
        <section className="orders-card orders-timeline-card" aria-label={t('orders.timeline.title')}>
          <h2 className="orders-section-heading">
            <Clock size={16} />
            <span>{t('orders.timeline.title')}</span>
          </h2>
          <div className="orders-timeline-flow">
            {ORDER_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx
              const isCurrent = idx === currentStepIdx
              const timelineEvent = selectedOrder.timeline.find((t) => t.status === step)

              return (
                <div
                  key={step}
                  className={`orders-timeline-node ${isCompleted ? 'completed' : ''} ${
                    isCurrent ? 'current' : ''
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div className="timeline-node-marker">
                    {isCompleted ? <Check size={13} strokeWidth={2.5} /> : <span className="marker-dot" />}
                  </div>
                  <div className="timeline-node-content">
                    <span className="timeline-node-title">{getStatusLabel(step)}</span>
                    {timelineEvent?.date && (
                      <span className="timeline-node-date">
                        {timelineEvent.date}
                        {timelineEvent.time ? ` • ${timelineEvent.time}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Main Grid: Items and Summary */}
        <div className="orders-detail-grid">
          <div className="orders-detail-main">
            {/* Items Table / Cards */}
            <section className="orders-card orders-items-card" aria-label={t('orders.itemsTitle')}>
              <h2 className="orders-section-heading orders-items-header">
                <Package size={16} />
                <span>
                  {t('orders.itemsCount', {
                    count: totalItems,
                    defaultValue: `Items (${totalItems})`,
                  })}
                </span>
              </h2>

              <div className="orders-items-wrapper">
                <div
                  ref={scrollContainerRef}
                  className={`orders-items-scroll-container ${totalItems > 4 ? 'has-scroll' : ''}`}
                  tabIndex={0}
                  role="region"
                  aria-label={t('orders.itemsAriaLabel', { defaultValue: 'Order items' })}
                  onScroll={checkScrollFade}
                >
                  <div className="orders-items-table">
                    <div className={`orders-items-primary ${totalItems <= 3 ? 'all-items' : ''}`}>
                      {selectedOrder.items.slice(0, 3).map((item, i) => (
                        <div key={`${item.productSlug}-${i}`} className="orders-item-row">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="orders-item-img"
                          />
                          <div className="orders-item-info">
                            <Link
                              to={`/product/${item.productSlug}`}
                              className="orders-item-name"
                            >
                              {item.productName}
                            </Link>
                            <div className="orders-item-details">
                              <span>
                                {t('orders.size')}: <strong>{item.size}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                {t('orders.quantity')}: <strong>{item.quantity}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="orders-item-price">
                            {formatPrice(item.price * item.quantity, language, selectedOrder.currency)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalItems > 3 && (
                      <div
                        className={`orders-items-collapsible ${isExpandedMobile ? 'expanded' : ''}`}
                      >
                        <div className="orders-items-collapsible-inner">
                          {selectedOrder.items.slice(3).map((item, i) => (
                            <div key={`${item.productSlug}-${i + 3}`} className="orders-item-row">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="orders-item-img"
                              />
                              <div className="orders-item-info">
                                <Link
                                  to={`/product/${item.productSlug}`}
                                  className="orders-item-name"
                                >
                                  {item.productName}
                                </Link>
                                <div className="orders-item-details">
                                  <span>
                                    {t('orders.size')}: <strong>{item.size}</strong>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {t('orders.quantity')}: <strong>{item.quantity}</strong>
                                  </span>
                                </div>
                              </div>
                              <div className="orders-item-price">
                                {formatPrice(item.price * item.quantity, language, selectedOrder.currency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {totalItems > 4 && hasMoreBelow && (
                  <div className="orders-items-fade-bottom" aria-hidden="true" />
                )}

                {totalItems > 3 && (
                  <button
                    type="button"
                    className="orders-toggle-items-btn"
                    onClick={() => setIsExpandedMobile((prev) => !prev)}
                    aria-expanded={isExpandedMobile}
                  >
                    {isExpandedMobile
                      ? t('orders.showLess', { defaultValue: 'Show less' })
                      : t('orders.showAllItems', {
                          count: totalItems,
                          defaultValue: `Show all ${totalItems} items`,
                        })}
                  </button>
                )}
              </div>
            </section>
          </div>

          <div className="orders-detail-sidebar">
            {/* Shipping Address */}
            <section className="orders-card" aria-label={t('orders.shippingAddress')}>
              <h2 className="orders-section-heading">
                <MapPin size={16} />
                <span>{t('orders.shippingAddress')}</span>
              </h2>
              <div className="orders-address-block">
                <p className="address-name">{selectedOrder.shippingAddress.fullName}</p>
                <p className="address-line">{selectedOrder.shippingAddress.street}</p>
                <p className="address-line">
                  {selectedOrder.shippingAddress.city},{' '}
                  {selectedOrder.shippingAddress.country}
                </p>
                {selectedOrder.shippingAddress.postalCode && (
                  <p className="address-line">{selectedOrder.shippingAddress.postalCode}</p>
                )}
                {selectedOrder.shippingAddress.phone && (
                  <p className="address-phone">{selectedOrder.shippingAddress.phone}</p>
                )}
              </div>
            </section>

            {/* Payment Method */}
            <section className="orders-card" aria-label={t('orders.paymentMethod')}>
              <h2 className="orders-section-heading">
                <CreditCard size={16} />
                <span>{t('orders.paymentMethod')}</span>
              </h2>
              <p className="orders-payment-text">{selectedOrder.paymentMethod}</p>
            </section>

            {/* Price Summary */}
            <section className="orders-card" aria-label={t('orders.priceSummary')}>
              <h2 className="orders-section-heading">
                <span>{t('orders.priceSummary')}</span>
              </h2>
              <div className="orders-price-rows">
                <div className="price-row">
                  <span>{t('orders.subtotal')}</span>
                  <span>
                    {formatPrice(selectedOrder.subtotal, language, selectedOrder.currency)}
                  </span>
                </div>
                <div className="price-row">
                  <span>{t('orders.shipping')}</span>
                  <span>
                    {selectedOrder.shippingFee === 0
                      ? t('orders.freeShipping')
                      : formatPrice(selectedOrder.shippingFee, language, selectedOrder.currency)}
                  </span>
                </div>
                <div className="price-row total-row">
                  <span>{t('orders.total')}</span>
                  <span className="price-total-val">
                    {formatPrice(selectedOrder.total, language, selectedOrder.currency)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  /* ----------------------------------------------------
     LIST VIEW (when on /track-order or /orders)
  ----------------------------------------------------- */
  return (
    <div className="orders-page-container">
      {/* Page Title & Search Header */}
      <div className="orders-header-block">
        <div className="orders-title-row">
          <h1 className="orders-main-title">{t('orders.title')}</h1>
          <p className="orders-main-subtitle">{t('orders.subtitle')}</p>
        </div>

        {/* Search Field */}
        <form className="orders-search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="orders-search-wrapper">
            <Search size={17} className="orders-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="orders-search-input"
              placeholder={t('orders.searchPlaceholder')}
              aria-label={t('orders.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="orders-search-clear"
                onClick={handleClearSearch}
                aria-label={t('orders.empty.clearSearch')}
              >
                <X size={15} />
              </button>
            )}
            <button type="submit" className="orders-track-btn">
              {t('orders.trackButton')}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs (Category: All / Jerseys / Shoes) */}
      <div className="orders-tabs" role="tablist" aria-label="Filter orders">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`orders-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all')
            setCurrentPage(1)
          }}
        >
          <span>{t('orders.tabs.all')}</span>
          <span className="tab-count">({tabCounts.all})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'jerseys'}
          className={`orders-tab-btn ${activeTab === 'jerseys' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('jerseys')
            setCurrentPage(1)
          }}
        >
          <span>{t('orders.tabs.jerseys')}</span>
          <span className="tab-count">({tabCounts.jerseys})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'shoes'}
          className={`orders-tab-btn ${activeTab === 'shoes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('shoes')
            setCurrentPage(1)
          }}
        >
          <span>{t('orders.tabs.shoes')}</span>
          <span className="tab-count">({tabCounts.shoes})</span>
        </button>
      </div>

      {/* Delivery Status Filter Row */}
      <div
        ref={statusRowRef}
        className="orders-status-filter-row"
        role="toolbar"
        aria-label={t('orders.statusFilterAria', { defaultValue: 'Filter orders by delivery status' })}
      >
        {STATUS_FILTER_CHIPS.map((chip) => {
          const isSelected = selectedStatus === chip.status
          const count = statusCounts[chip.status]
          const label = t(chip.labelKey, { defaultValue: chip.defaultLabel })

          return (
            <button
              key={chip.status}
              ref={isSelected ? selectedChipRef : null}
              type="button"
              className={`orders-status-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => handleStatusSelect(chip.status)}
              aria-pressed={isSelected}
            >
              <span className="orders-chip-label">{label}</span>
              <span className="orders-chip-count">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="orders-loading-spinner" aria-label="Loading orders..." />
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="orders-empty-state">
          <Package size={44} className="orders-empty-icon" />
          <h2 className="orders-empty-title">{t('orders.empty.title')}</h2>
          <p className="orders-empty-desc">{t('orders.empty.desc')}</p>
          {isAnyFilterActive && (
            <button
              type="button"
              className="orders-action-btn dark"
              onClick={handleClearAllFilters}
            >
              {t('orders.empty.clearFilters', { defaultValue: 'Clear filters' })}
            </button>
          )}
        </div>
      ) : (
        /* Order Cards Stack */
        <>
          <div className="orders-list">
            {paginatedOrders.map((order) => {
              const currentStepIdx = getStepIndex(order.status)

              return (
                <article key={order.id} className="orders-card order-item-card">
                  {/* Header row */}
                  <div className="order-card-header">
                    <div className="order-card-info">
                      <span className="order-card-id">#{order.id}</span>
                      <span className="order-card-date">
                        {formatDate(order.date)}
                      </span>
                    </div>

                    <div className="order-card-header-end">
                      <div className="orders-status-badge">
                        <span
                          className="status-dot"
                          style={{ backgroundColor: STATUS_COLOR_MAP[order.status] }}
                        />
                        <span className="status-label">{getStatusLabel(order.status)}</span>
                      </div>
                      <span className="order-card-total">
                        {formatPrice(order.total, language, order.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnails Row */}
                  <div className="order-card-thumbnails">
                    {order.items.map((item, idx) => (
                      <div key={`${item.productSlug}-${idx}`} className="order-thumbnail-item">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="order-thumb-img"
                        />
                        <div className="order-thumb-meta">
                          <span className="order-thumb-name" title={item.productName}>
                            {item.productName}
                          </span>
                          <span className="order-thumb-sub">
                            {t('orders.size')}: {item.size} • {t('orders.quantity')}: {item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Horizontal Progress Tracker */}
                  <div
                    className="orders-progress-tracker"
                    role="region"
                    aria-label={t('orders.progressTrackerAria')}
                  >
                    {ORDER_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx
                      const isCurrent = idx === currentStepIdx

                      return (
                        <div
                          key={step}
                          className={`progress-step-item ${isCompleted ? 'completed' : ''} ${
                            isCurrent ? 'current' : ''
                          }`}
                          aria-current={isCurrent ? 'step' : undefined}
                        >
                          <div className="progress-step-line" />
                          <div className="progress-step-bullet">
                            {isCompleted ? (
                              <Check size={11} strokeWidth={2.8} />
                            ) : (
                              <span className="bullet-empty" />
                            )}
                          </div>
                          <span className="progress-step-label">{getStatusLabel(step)}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer / Action row */}
                  <div className="order-card-footer">
                    <Link
                      to={`/track-order/${order.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
                      className="orders-view-details-btn"
                    >
                      <span>{t('orders.viewDetails')}</span>
                      <ChevronRight size={15} className="orders-arrow-icon" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>

          {totalPages > 1 && (
            <nav
              className="orders-pagination"
              aria-label={t('orders.pagination.ariaLabel', { defaultValue: 'Orders pagination' })}
            >
              <button
                type="button"
                className="orders-pagination-btn orders-pagination-prev"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label={t('orders.pagination.previous', { defaultValue: 'Previous' })}
                title={t('orders.pagination.previous', { defaultValue: 'Previous' })}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>

              <div className="orders-pagination-pages">
                {pageNumbers.map((item, index) => {
                  if (typeof item === 'string') {
                    return (
                      <span key={`ellipsis-${index}`} className="orders-pagination-ellipsis" aria-hidden="true">
                        …
                      </span>
                    )
                  }
                  const displayNum = formatPaginationNumber(item, language)
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`orders-pagination-page-btn ${item === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                      aria-label={t('orders.pagination.page', {
                        page: displayNum,
                        defaultValue: `Page ${displayNum}`,
                      })}
                      aria-current={item === currentPage ? 'page' : undefined}
                    >
                      {displayNum}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                className="orders-pagination-btn orders-pagination-next"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label={t('orders.pagination.next', { defaultValue: 'Next' })}
                title={t('orders.pagination.next', { defaultValue: 'Next' })}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
export default Orders
