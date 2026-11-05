import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../context/LocaleContext'
import './HeroSlider.css'

export interface HeroSlideItem {
  image: string
  eyebrow: string
  title: string
  text: string
  buttonLabel: string
  to: string
  imageAlt?: string
  onButtonClick?: () => void
}

export interface HeroSliderProps {
  slides?: HeroSlideItem[]
  ariaLabel?: string
  className?: string
  // Single-slide backwards compatibility props
  eyebrow?: string
  titleLine1?: string
  titleLine2?: string
  descriptionLine1?: string
  descriptionLine2?: string
  buttonText?: string
  image?: string
  imageAlt?: string
  onButtonClick?: () => void
  buttonHref?: string
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  slides: propSlides,
  ariaLabel,
  className,
  eyebrow,
  titleLine1,
  titleLine2,
  descriptionLine1,
  descriptionLine2,
  buttonText,
  image,
  imageAlt,
  onButtonClick,
  buttonHref = '#catalog-grid',
}) => {
  const { t } = useLocale()

  // Normalize slides
  const slides: HeroSlideItem[] = useMemo(() => {
    if (propSlides && propSlides.length > 0) {
      return propSlides
    }
    return [
      {
        image: image || '',
        eyebrow: eyebrow || '',
        title: [titleLine1, titleLine2].filter(Boolean).join('\n'),
        text: [descriptionLine1, descriptionLine2].filter(Boolean).join('\n'),
        buttonLabel: buttonText || t('hero.shopNow'),
        to: buttonHref,
        imageAlt: imageAlt || [titleLine1, titleLine2].filter(Boolean).join(' '),
        onButtonClick,
      },
    ]
  }, [
    propSlides,
    image,
    eyebrow,
    titleLine1,
    titleLine2,
    descriptionLine1,
    descriptionLine2,
    buttonText,
    buttonHref,
    imageAlt,
    onButtonClick,
    t,
  ])

  const count = slides.length

  /**
   * Cloned slides layout for seamless infinite looping:
   * [clone of last slide, slide 1, slide 2, ..., slide N, clone of slide 1]
   *
   * Index 0: clone of last slide (slide N)
   * Index 1: real slide 1
   * ...
   * Index count: real slide N
   * Index count + 1: clone of slide 1
   */
  const trackSlides = useMemo(() => {
    if (count <= 1) return slides
    return [slides[count - 1], ...slides, slides[0]]
  }, [slides, count])

  // Start at index 1 (the real slide 1) when there are multiple slides
  const [currentIndex, setCurrentIndex] = useState(() => (count > 1 ? 1 : 0))
  const [prevCount, setPrevCount] = useState(count)

  // Ensure currentIndex is properly positioned if slides count changes
  if (count !== prevCount) {
    setPrevCount(count)
    if (count > 1 && currentIndex === 0) {
      setCurrentIndex(1)
    }
  }

  // Real slide number (0-based) for indicators and aria attributes
  const activeDotIndex =
    count <= 1
      ? 0
      : currentIndex === 0
      ? count - 1
      : currentIndex === count + 1
      ? 0
      : currentIndex - 1

  const isTransitioningRef = useRef(false)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = null
    }
  }, [])

  const setTransitionSafetyTimeout = useCallback(() => {
    clearTransitionTimeout()
    transitionTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false
    }, 1300)
  }, [clearTransitionTimeout])

  useEffect(() => {
    return () => {
      clearTransitionTimeout()
    }
  }, [clearTransitionTimeout])

  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isTabHidden, setIsTabHidden] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const heroRef = useRef<HTMLElement>(null)

  // Drag refs
  const pointerStartXRef = useRef(0)
  const pointerStartYRef = useRef(0)
  const dragOffsetRef = useRef(0)
  const isPointerDownRef = useRef(false)
  const hasSwipedRef = useRef(false)

  // Listen for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Listen for tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const [autoPlayKey, setAutoPlayKey] = useState(0)

  const restartAutoPlay = useCallback(() => {
    setAutoPlayKey((k) => k + 1)
  }, [])

  // Move forward to index + 1
  const goToNext = useCallback(() => {
    if (isTransitioningRef.current || count <= 1) return
    isTransitioningRef.current = true
    setTransitionSafetyTimeout()
    if (trackRef.current) {
      trackRef.current.style.transition = ''
    }
    setCurrentIndex((prev) => prev + 1)
  }, [count, setTransitionSafetyTimeout])

  // Jump to specific slide index immediately
  const goToSlide = useCallback(
    (slideIdx: number) => {
      if (count <= 1) return
      // If already at this slide and not currently transitioning, just restart autoplay
      if (activeDotIndex === slideIdx && !isTransitioningRef.current) {
        restartAutoPlay()
        return
      }
      isTransitioningRef.current = true
      setTransitionSafetyTimeout()
      if (trackRef.current) {
        trackRef.current.style.transition = ''
        trackRef.current.style.transform = `translateX(-${(slideIdx + 1) * 100}%)`
      }
      setCurrentIndex(slideIdx + 1)
      restartAutoPlay()
    },
    [count, activeDotIndex, restartAutoPlay, setTransitionSafetyTimeout]
  )

  const handleDotClick = useCallback(
    (slideIdx: number, e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      goToSlide(slideIdx)
      if (e.detail > 0) {
        e.currentTarget.blur()
      }
    },
    [goToSlide]
  )

  /**
   * Handle end of slide transition.
   * - When landing on clone of slide 1 (index count + 1):
   *   disable transition, jump instantly to index 1 (real slide 1),
   *   force a reflow, then re-enable transition.
   * - When landing on clone of last slide (index 0):
   *   disable transition, jump instantly to index count (real last slide),
   *   force a reflow, then re-enable transition.
   */
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== trackRef.current || e.propertyName !== 'transform') return
    clearTransitionTimeout()

    const el = trackRef.current
    if (!el) return

    if (currentIndex === count + 1) {
      el.style.transition = 'none'
      el.style.transform = 'translateX(-100%)'
      void el.offsetHeight // force reflow
      el.style.transition = ''
      setCurrentIndex(1)
    } else if (currentIndex === 0) {
      el.style.transition = 'none'
      el.style.transform = `translateX(-${count * 100}%)`
      void el.offsetHeight // force reflow
      el.style.transition = ''
      setCurrentIndex(count)
    }

    isTransitioningRef.current = false
  }

  // Auto-advance every 5000 ms; pause on hover / focus / drag / hidden tab / reduced-motion
  const shouldAutoPlay =
    !isHovered &&
    !isFocused &&
    !isDragging &&
    !isTabHidden &&
    !prefersReducedMotion &&
    count > 1

  useEffect(() => {
    if (!shouldAutoPlay) return
    const timer = setInterval(() => {
      goToNext()
    }, 5000)
    return () => clearInterval(timer)
  }, [shouldAutoPlay, currentIndex, goToNext, autoPlayKey])

  // ─── Drag / Swipe ─────────────────────────────────────────────────────────

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (isTransitioningRef.current || count <= 1) return
      pointerStartXRef.current = clientX
      pointerStartYRef.current = clientY
      dragOffsetRef.current = 0
      isPointerDownRef.current = true
      hasSwipedRef.current = false
      setIsDragging(true)
      if (trackRef.current) {
        trackRef.current.style.transition = 'none'
      }
    },
    [count]
  )

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!isPointerDownRef.current) return
      const deltaX = clientX - pointerStartXRef.current
      const deltaY = clientY - pointerStartYRef.current

      // Abort horizontal drag if user is scrolling vertically
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10 && !hasSwipedRef.current) {
        isPointerDownRef.current = false
        setIsDragging(false)
        if (trackRef.current) {
          trackRef.current.style.transition = ''
          trackRef.current.style.transform = `translateX(-${currentIndex * 100}%)`
        }
        return
      }

      if (Math.abs(deltaX) > 10) {
        hasSwipedRef.current = true
      }

      dragOffsetRef.current = deltaX
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(calc(-${currentIndex * 100}% + ${deltaX}px))`
      }
    },
    [currentIndex]
  )

  const endDrag = useCallback(
    (clientX: number) => {
      if (!isPointerDownRef.current) return
      isPointerDownRef.current = false
      setIsDragging(false)

      const deltaX = clientX - pointerStartXRef.current
      const el = trackRef.current
      const width = el?.offsetWidth ?? window.innerWidth
      const THRESHOLD = width * 0.15 // 15% threshold
      const isRtl = document.documentElement.dir === 'rtl'

      // Restore normal transition
      if (el) {
        el.style.transition = ''
      }

      if (Math.abs(deltaX) >= THRESHOLD) {
        const goForward = isRtl ? deltaX > 0 : deltaX < 0
        if (goForward) {
          isTransitioningRef.current = true
          setTransitionSafetyTimeout()
          setCurrentIndex((prev) => prev + 1)
        } else {
          isTransitioningRef.current = true
          setTransitionSafetyTimeout()
          setCurrentIndex((prev) => prev - 1)
        }
      } else {
        // Snap back if dragged under 15%
        if (hasSwipedRef.current) {
          isTransitioningRef.current = true
          setTransitionSafetyTimeout()
        }
        if (el) {
          el.style.transform = `translateX(-${currentIndex * 100}%)`
        }
      }
    },
    [currentIndex, setTransitionSafetyTimeout]
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    if (
      (e.target as HTMLElement).closest('.hero-slider-controls') ||
      (e.target as HTMLElement).closest('.category-hero-controls') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return
    }
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      endDrag(e.changedTouches[0].clientX)
    } else {
      isPointerDownRef.current = false
      setIsDragging(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.hero-slider-controls') ||
      (e.target as HTMLElement).closest('.category-hero-controls') ||
      (e.target as HTMLElement).closest('a')
    ) {
      return
    }
    startDrag(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    moveDrag(e.clientX, e.clientY)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    endDrag(e.clientX)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (isPointerDownRef.current) {
      endDrag(pointerStartXRef.current + dragOffsetRef.current)
    }
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasSwipedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      hasSwipedRef.current = false
    }
  }

  return (
    <section
      ref={heroRef}
      className={`hero-slider category-hero ${className || ''}`}
      aria-label={ariaLabel || t('hero.slideControlsAria')}
      aria-live="off"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handleMouseLeave}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(e) => {
        if (!heroRef.current?.contains(e.relatedTarget as Node)) {
          setIsFocused(false)
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClickCapture={handleClickCapture}
    >
      <div className="hero-slider-banner category-hero-banner">
        {/* GPU-accelerated sliding track */}
        <div
          ref={trackRef}
          className="hero-slider-track category-hero-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
          aria-live="off"
        >
          {trackSlides.map((slide, tIdx) => {
            // Determine logical slide index for loading priority
            const logicalIdx =
              count > 1
                ? tIdx === 0
                  ? count - 1
                  : tIdx <= count
                  ? tIdx - 1
                  : 0
                : 0
            const isActive = count > 1 ? tIdx === currentIndex : true

            return (
              <div
                key={tIdx}
                className={`hero-slider-slide category-hero-slide${isActive ? ' is-active' : ''}`}
                aria-hidden={!isActive}
              >
                <img
                  src={slide.image}
                  alt={slide.imageAlt || slide.title.replace('\n', ' ')}
                  className="hero-slider-image category-hero-image"
                  loading={logicalIdx === 0 ? 'eager' : 'lazy'}
                />
                <div className="hero-slider-gradient category-hero-gradient" aria-hidden="true" />
                <div className="hero-slider-content category-hero-content">
                  <span className="hero-slider-eyebrow category-hero-eyebrow">{slide.eyebrow}</span>
                  <h1 className="hero-slider-title category-hero-title">
                    {slide.title.split('\n').map((line, lIdx) => (
                      <span key={lIdx}>{line}</span>
                    ))}
                  </h1>
                  <p className="hero-slider-description category-hero-description">
                    {slide.text.split('\n').map((line, lIdx) => (
                      <span key={lIdx}>{line}</span>
                    ))}
                  </p>
                  {slide.to.startsWith('/') ? (
                    <Link
                      to={slide.to}
                      className="hero-slider-button category-hero-button"
                      tabIndex={isActive ? 0 : -1}
                      onClick={(e) => {
                        if (slide.onButtonClick) {
                          e.preventDefault()
                          slide.onButtonClick()
                        }
                      }}
                    >
                      {slide.buttonLabel}
                    </Link>
                  ) : (
                    <a
                      href={slide.to}
                      className="hero-slider-button category-hero-button"
                      tabIndex={isActive ? 0 : -1}
                      onClick={(e) => {
                        if (slide.onButtonClick) {
                          e.preventDefault()
                          slide.onButtonClick()
                          return
                        }
                        if (slide.to.startsWith('#')) {
                          e.preventDefault()
                          const element = document.getElementById(slide.to.slice(1))
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                      }}
                    >
                      {slide.buttonLabel}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Dark top gradient behind transparent header */}
        <div className="hero-slider-top-gradient category-hero-top-gradient" aria-hidden="true" />

        {/* Manual controls: pill container with round dot indicators */}
        {count > 1 && (
          <div
            className="hero-slider-controls category-hero-controls hero-slider-indicators category-hero-indicators"
            role="group"
            aria-label={ariaLabel || t('hero.slideControlsAria')}
          >
            {slides.map((_, idx) => {
              const isActive = idx === activeDotIndex
              return (
                <button
                  key={idx}
                  type="button"
                  className={`hero-slider-indicator-btn category-hero-indicator-btn hero-slider-dot category-hero-dot${isActive ? ' is-active' : ''}`}
                  onClick={(e) => handleDotClick(idx, e)}
                  aria-label={t('hero.goToSlide', { slide: idx + 1, defaultValue: `Go to slide ${idx + 1}` })}
                  aria-current={isActive ? 'true' : undefined}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

