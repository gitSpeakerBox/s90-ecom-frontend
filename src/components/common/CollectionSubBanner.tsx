import React, { useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import type { CollectionBannerCard } from '../../data/collectionBanners'
import './CollectionSubBanner.css'

export interface CollectionSubBannerProps {
  heading?: string
  items: CollectionBannerCard[]
  ariaLabel?: string
  onSelectCategory?: (category: string) => void
  activeCategory?: string
  autoSlideInterval?: number
}

export const CollectionSubBanner: React.FC<CollectionSubBannerProps> = ({
  heading,
  items,
  ariaLabel,
  onSelectCategory,
  activeCategory,
  autoSlideInterval,
}) => {
  const { t, language } = useLocale()
  const isRTL =
    language === 'ar' ||
    (typeof document !== 'undefined' && document.documentElement.dir === 'rtl')

  const displayHeading =
    heading || t('collectionSubBanner.heading', { defaultValue: 'Shop By Collections' })

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 640
  })

  const hasMoreThanFour = Boolean(items && items.length > 4)
  const canLoop = isMobile ? Boolean(items && items.length > 1) : hasMoreThanFour
  const canLoopRef = useRef<boolean>(canLoop)
  useEffect(() => {
    canLoopRef.current = canLoop
  }, [canLoop])

  const [cards, setCards] = useState<CollectionBannerCard[]>(() => [...items])
  const [prevItems, setPrevItems] = useState<CollectionBannerCard[]>(items)

  // Adjust state during render when items prop changes
  if (prevItems !== items) {
    setPrevItems(items)
    setCards([...items])
  }

  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.visibilityState === 'hidden'
  })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<number>(300)
  const cardWidthRef = useRef<number>(300)
  const isAnimatingRef = useRef<boolean>(false)
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Drag interaction refs
  const isPointerDownRef = useRef<boolean>(false)
  const pointerIdRef = useRef<number | null>(null)
  const dragStartXRef = useRef<number>(0)
  const dragStartYRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const currentDeltaXRef = useRef<number>(0)
  const isDraggingActiveRef = useRef<boolean>(false)
  const hasDraggedOver5pxRef = useRef<boolean>(false)
  const suppressClickRef = useRef<boolean>(false)
  const isGestureIgnoredRef = useRef<boolean>(false)

  // Forward ref for handleNext to avoid circular dependency with auto-play
  const handleNextRef = useRef<(isManual?: boolean) => void>(() => {})

  // Reduced motion preference listener
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Visibility change handling
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handler = () => {
      setIsTabHidden(document.visibilityState === 'hidden')
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Dimension measurement for step size and viewport
  const updateDimensions = useCallback(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    const viewportWidth =
      viewport.getBoundingClientRect().width || viewport.clientWidth
    if (viewportWidth <= 0) return

    const windowWidth =
      typeof window !== 'undefined' ? window.innerWidth : 1200
    const mob = windowWidth < 640
    setIsMobile(mob)

    let visible = 4
    let gap = 16
    if (mob) {
      visible = 1
      gap = 0
    } else if (windowWidth < 1024) {
      visible = 3
      gap = 16
    }

    const cardWidth = mob
      ? viewportWidth
      : Math.max(0, (viewportWidth - gap * (visible - 1)) / visible)
    const step = cardWidth + gap

    stepRef.current = step
    cardWidthRef.current = cardWidth

    viewport.style.setProperty('--collection-card-width', `${cardWidth}px`)
    viewport.style.setProperty('--collection-gap', `${gap}px`)

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    isAnimatingRef.current = false
    track.style.transition = 'none'

    const loopActive = mob ? Boolean(items && items.length > 1) : hasMoreThanFour
    const baseOffset = loopActive ? (isRTL ? step : -step) : 0
    track.style.transform = loopActive ? `translateX(${baseOffset}px)` : 'none'
  }, [hasMoreThanFour, isRTL, items])

  useEffect(() => {
    updateDimensions()
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640)
      }
      updateDimensions()
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && viewportRef.current) {
      ro = new ResizeObserver(() => {
        updateDimensions()
      })
      ro.observe(viewportRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      ro?.disconnect()
    }
  }, [updateDimensions])

  // Auto-play timer management
  const clearAutoPlayTimer = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
  }, [])

  const startAutoPlayTimer = useCallback(
    (delay?: number) => {
      clearAutoPlayTimer()
      if (!canLoopRef.current) return
      if (
        isHovered ||
        isFocused ||
        isPointerDownRef.current ||
        isDraggingActiveRef.current ||
        isTabHidden ||
        prefersReducedMotion
      ) {
        return
      }
      autoPlayTimerRef.current = setTimeout(() => {
        handleNextRef.current()
      }, delay ?? (autoSlideInterval || 2000))
    },
    [
      isHovered,
      isFocused,
      isTabHidden,
      prefersReducedMotion,
      autoSlideInterval,
      clearAutoPlayTimer,
    ]
  )

  // Forward endless move
  const handleNext = useCallback(
    (isManual = false) => {
      if (isAnimatingRef.current || !canLoopRef.current) return
      const track = trackRef.current
      if (!track) return

      isAnimatingRef.current = true
      clearAutoPlayTimer()
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }

      const step = stepRef.current
      const baseOffset = isRTL ? step : -step
      const nextSign = isRTL ? 1 : -1

      if (prefersReducedMotion) {
        flushSync(() => {
          setCards((prev) => {
            const next = [...prev]
            const first = next.shift()
            if (first) next.push(first)
            return next
          })
        })
        track.style.transition = 'none'
        track.style.transform = `translateX(${baseOffset}px)`
        void track.offsetHeight
        isAnimatingRef.current = false
        if (isManual) {
          startAutoPlayTimer(3000)
        } else {
          startAutoPlayTimer()
        }
        return
      }

      const duration = isManual ? '400ms ease-out' : '600ms ease-in-out'
      track.style.transition = `transform ${duration}`
      track.style.transform = `translateX(${baseOffset + nextSign * step}px)`

      const finishNext = () => {
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current)
          fallbackTimerRef.current = null
        }
        track.style.transition = 'none'
        flushSync(() => {
          setCards((prev) => {
            const next = [...prev]
            const first = next.shift()
            if (first) next.push(first)
            return next
          })
        })
        const currentStep = stepRef.current
        const currentBaseOffset = canLoopRef.current
          ? isRTL
            ? currentStep
            : -currentStep
          : 0
        track.style.transform = `translateX(${currentBaseOffset}px)`
        void track.offsetHeight
        isAnimatingRef.current = false
        if (isManual) {
          startAutoPlayTimer(3000)
        } else {
          startAutoPlayTimer()
        }
      }

      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target !== track || e.propertyName !== 'transform') return
        track.removeEventListener('transitionend', onTransitionEnd)
        finishNext()
      }

      track.addEventListener('transitionend', onTransitionEnd)
      fallbackTimerRef.current = setTimeout(
        () => {
          track.removeEventListener('transitionend', onTransitionEnd)
          finishNext()
        },
        isManual ? 450 : 750
      )
    },
    [isRTL, prefersReducedMotion, clearAutoPlayTimer, startAutoPlayTimer]
  )

  useEffect(() => {
    handleNextRef.current = handleNext
  }, [handleNext])

  // Previous endless move
  const handlePrev = useCallback(
    (isManual = false) => {
      if (isAnimatingRef.current || !canLoopRef.current) return
      const track = trackRef.current
      if (!track) return

      isAnimatingRef.current = true
      clearAutoPlayTimer()
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }

      const step = stepRef.current
      const baseOffset = isRTL ? step : -step
      const nextSign = isRTL ? 1 : -1

      if (prefersReducedMotion) {
        flushSync(() => {
          setCards((prev) => {
            const next = [...prev]
            const last = next.pop()
            if (last) next.unshift(last)
            return next
          })
        })
        track.style.transition = 'none'
        track.style.transform = `translateX(${baseOffset}px)`
        void track.offsetHeight
        isAnimatingRef.current = false
        if (isManual) {
          startAutoPlayTimer(3000)
        } else {
          startAutoPlayTimer()
        }
        return
      }

      const duration = isManual ? '400ms ease-out' : '600ms ease-in-out'
      track.style.transition = `transform ${duration}`
      track.style.transform = `translateX(${baseOffset - nextSign * step}px)`

      const finishPrev = () => {
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current)
          fallbackTimerRef.current = null
        }
        track.style.transition = 'none'
        flushSync(() => {
          setCards((prev) => {
            const next = [...prev]
            const last = next.pop()
            if (last) next.unshift(last)
            return next
          })
        })
        const currentStep = stepRef.current
        const currentBaseOffset = canLoopRef.current
          ? isRTL
            ? currentStep
            : -currentStep
          : 0
        track.style.transform = `translateX(${currentBaseOffset}px)`
        void track.offsetHeight
        isAnimatingRef.current = false
        if (isManual) {
          startAutoPlayTimer(3000)
        } else {
          startAutoPlayTimer()
        }
      }

      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target !== track || e.propertyName !== 'transform') return
        track.removeEventListener('transitionend', onTransitionEnd)
        finishPrev()
      }

      track.addEventListener('transitionend', onTransitionEnd)
      fallbackTimerRef.current = setTimeout(
        () => {
          track.removeEventListener('transitionend', onTransitionEnd)
          finishPrev()
        },
        isManual ? 450 : 750
      )
    },
    [isRTL, prefersReducedMotion, clearAutoPlayTimer, startAutoPlayTimer]
  )

  // Direct dot slide
  const handleDotClick = useCallback(
    (targetIndex: number) => {
      if (isAnimatingRef.current || !hasMoreThanFour) return
      const targetItem = items[targetIndex]
      if (!targetItem) return

      const targetPos = cards.findIndex((c) => c.id === targetItem.id)
      if (targetPos === -1) return
      if (targetPos === 0) {
        startAutoPlayTimer()
        return
      }

      const track = trackRef.current
      if (!track) return

      clearAutoPlayTimer()
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }

      const n = cards.length
      const forwardSteps = targetPos
      const backwardSteps = n - targetPos
      const step = stepRef.current
      const baseOffset = isRTL ? step : -step
      const nextSign = isRTL ? 1 : -1

      if (forwardSteps <= backwardSteps) {
        // Slide forward in a single move
        if (prefersReducedMotion) {
          flushSync(() => {
            setCards((prev) => {
              const next = [...prev]
              const moved = next.splice(0, forwardSteps)
              next.push(...moved)
              return next
            })
          })
          track.style.transition = 'none'
          track.style.transform = `translateX(${baseOffset}px)`
          void track.offsetHeight
          startAutoPlayTimer()
          return
        }

        isAnimatingRef.current = true
        track.style.transition = 'transform 600ms ease-in-out'
        track.style.transform = `translateX(${baseOffset + nextSign * forwardSteps * step}px)`

        const finishForward = () => {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current)
            fallbackTimerRef.current = null
          }
          track.style.transition = 'none'
          flushSync(() => {
            setCards((prev) => {
              const next = [...prev]
              const moved = next.splice(0, forwardSteps)
              next.push(...moved)
              return next
            })
          })
          const currentStep = stepRef.current
          const currentBaseOffset = hasMoreThanFour ? (isRTL ? currentStep : -currentStep) : 0
          track.style.transform = `translateX(${currentBaseOffset}px)`
          void track.offsetHeight
          isAnimatingRef.current = false
          startAutoPlayTimer()
        }

        const onTransitionEnd = (e: TransitionEvent) => {
          if (e.target !== track || e.propertyName !== 'transform') return
          track.removeEventListener('transitionend', onTransitionEnd)
          finishForward()
        }

        track.addEventListener('transitionend', onTransitionEnd)
        fallbackTimerRef.current = setTimeout(() => {
          track.removeEventListener('transitionend', onTransitionEnd)
          finishForward()
        }, 750)
      } else {
        // Slide backward in a single move
        if (prefersReducedMotion) {
          flushSync(() => {
            setCards((prev) => {
              const next = [...prev]
              const moved = next.splice(-backwardSteps)
              next.unshift(...moved)
              return next
            })
          })
          track.style.transition = 'none'
          track.style.transform = `translateX(${baseOffset}px)`
          void track.offsetHeight
          startAutoPlayTimer()
          return
        }

        isAnimatingRef.current = true
        track.style.transition = 'none'
        flushSync(() => {
          setCards((prev) => {
            const next = [...prev]
            const moved = next.splice(-backwardSteps)
            next.unshift(...moved)
            return next
          })
        })
        track.style.transform = `translateX(${baseOffset + nextSign * backwardSteps * step}px)`
        void track.offsetHeight

        track.style.transition = 'transform 600ms ease-in-out'
        track.style.transform = `translateX(${baseOffset}px)`

        const finishBackward = () => {
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current)
            fallbackTimerRef.current = null
          }
          track.style.transition = 'none'
          const currentStep = stepRef.current
          const currentBaseOffset = hasMoreThanFour ? (isRTL ? currentStep : -currentStep) : 0
          track.style.transform = `translateX(${currentBaseOffset}px)`
          void track.offsetHeight
          isAnimatingRef.current = false
          startAutoPlayTimer()
        }

        const onTransitionEnd = (e: TransitionEvent) => {
          if (e.target !== track || e.propertyName !== 'transform') return
          track.removeEventListener('transitionend', onTransitionEnd)
          finishBackward()
        }

        track.addEventListener('transitionend', onTransitionEnd)
        fallbackTimerRef.current = setTimeout(() => {
          track.removeEventListener('transitionend', onTransitionEnd)
          finishBackward()
        }, 750)
      }
    },
    [
      items,
      cards,
      hasMoreThanFour,
      isRTL,
      prefersReducedMotion,
      clearAutoPlayTimer,
      startAutoPlayTimer,
    ]
  )

  // Start auto play timer on mount or state change
  useEffect(() => {
    startAutoPlayTimer()
    return () => clearAutoPlayTimer()
  }, [startAutoPlayTimer, clearAutoPlayTimer])

  // Pointer drag events for mouse & touch
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canLoopRef.current || isAnimatingRef.current) return
    if (e.button !== 0) return

    isPointerDownRef.current = true
    pointerIdRef.current = e.pointerId
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    startTimeRef.current = performance.now()
    currentDeltaXRef.current = 0
    isDraggingActiveRef.current = false
    hasDraggedOver5pxRef.current = false
    isGestureIgnoredRef.current = false

    clearAutoPlayTimer()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || isGestureIgnoredRef.current) return
    if (isAnimatingRef.current) return

    const deltaX = e.clientX - dragStartXRef.current
    const deltaY = e.clientY - dragStartYRef.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (Math.hypot(deltaX, deltaY) > 5) {
      hasDraggedOver5pxRef.current = true
    }

    if (!isDraggingActiveRef.current) {
      if (absY > absX && absY > 8) {
        isGestureIgnoredRef.current = true
        isPointerDownRef.current = false
        startAutoPlayTimer(3000)
        return
      }

      if (absX >= 8 && absX > absY) {
        isDraggingActiveRef.current = true
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // ignore
        }
        const track = trackRef.current
        if (track) {
          track.style.transition = 'none'
          track.style.cursor = 'grabbing'
        }
      }
    }

    if (isDraggingActiveRef.current) {
      currentDeltaXRef.current = deltaX
      const track = trackRef.current
      if (track) {
        const step = stepRef.current
        const baseOffset = canLoopRef.current ? (isRTL ? step : -step) : 0
        const clampedDelta = Math.max(-step, Math.min(step, deltaX))
        track.style.transform = `translateX(${baseOffset + clampedDelta}px)`
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current && !isDraggingActiveRef.current) return

    try {
      if (
        pointerIdRef.current !== null &&
        e.currentTarget.hasPointerCapture(pointerIdRef.current)
      ) {
        e.currentTarget.releasePointerCapture(pointerIdRef.current)
      }
    } catch {
      // ignore
    }

    const track = trackRef.current
    if (track) {
      track.style.cursor = ''
    }

    if (hasDraggedOver5pxRef.current) {
      suppressClickRef.current = true
      setTimeout(() => {
        suppressClickRef.current = false
        hasDraggedOver5pxRef.current = false
      }, 200)
    }

    if (isDraggingActiveRef.current) {
      isDraggingActiveRef.current = false
      isPointerDownRef.current = false
      pointerIdRef.current = null

      const deltaX = currentDeltaXRef.current
      const step = stepRef.current
      const cardWidth = cardWidthRef.current || step
      const threshold = cardWidth * 0.15
      const elapsedTime = performance.now() - startTimeRef.current
      const velocity = Math.abs(deltaX) / Math.max(elapsedTime, 1)
      const isFlick = elapsedTime < 350 && Math.abs(deltaX) > 20 && velocity > 0.45
      const isDistancePassed = Math.abs(deltaX) > threshold

      let shouldGoNext = false
      let shouldGoPrev = false

      if (isDistancePassed || isFlick) {
        if (isRTL) {
          if (deltaX > 0) {
            shouldGoNext = true
          } else if (deltaX < 0) {
            shouldGoPrev = true
          }
        } else {
          if (deltaX < 0) {
            shouldGoNext = true
          } else if (deltaX > 0) {
            shouldGoPrev = true
          }
        }
      }

      if (shouldGoNext) {
        handleNext(true)
      } else if (shouldGoPrev) {
        handlePrev(true)
      } else {
        const baseOffset = canLoopRef.current ? (isRTL ? step : -step) : 0
        if (track) {
          track.style.transition = prefersReducedMotion
            ? 'none'
            : 'transform 250ms ease-out'
          track.style.transform = `translateX(${baseOffset}px)`
        }
        startAutoPlayTimer(3000)
      }
    } else {
      isPointerDownRef.current = false
      pointerIdRef.current = null
      startAutoPlayTimer(3000)
    }
  }

  const handleCardClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    card: CollectionBannerCard
  ) => {
    if (suppressClickRef.current || hasDraggedOver5pxRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onSelectCategory) {
      e.preventDefault()
      onSelectCategory(card.categoryValue)
    }
  }

  const handlePrevClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handlePrev()
  }

  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault()
    handleNext()
  }

  // Active index follows real card index of the first visible card
  const activeIndex = items.findIndex((item) => item.id === cards[0]?.id)

  const PrevChevron = isRTL ? ChevronRight : ChevronLeft
  const NextChevron = isRTL ? ChevronLeft : ChevronRight

  // Extra cards: 1 leading card, up to 4 trailing clones
  const leadingCard = cards[cards.length - 1]
  const trailingClones = cards.slice(0, 4)

  const renderCard = (
    card: CollectionBannerCard,
    isClone: boolean,
    key: string
  ) => {
    const translatedTitle = t(card.titleKey, { defaultValue: card.title })
    const isActive = Boolean(
      !isClone &&
        activeCategory &&
        activeCategory !== 'all' &&
        activeCategory.toLowerCase() === card.categoryValue.toLowerCase()
    )

    return (
      <div
        key={key}
        className={`collection-card-item ${isActive ? 'is-selected is-active' : ''}`}
        role={isClone ? undefined : 'listitem'}
        aria-hidden={isClone ? 'true' : undefined}
      >
        <Link
          to={card.to}
          className="collection-card"
          onClick={(e) => handleCardClick(e, card)}
          onDragStart={(e) => e.preventDefault()}
          draggable={false}
          tabIndex={isClone ? -1 : undefined}
          aria-label={
            isClone
              ? undefined
              : t('collectionSubBanner.viewCollection', {
                  title: translatedTitle,
                  defaultValue: `Explore collection: ${translatedTitle}`,
                })
          }
          aria-current={isActive ? 'true' : undefined}
        >
          {/* Absolute fill cover image */}
          <img
            src={card.image}
            alt={card.imageAlt || translatedTitle}
            className="collection-card-image"
            loading="lazy"
            draggable={false}
          />

          {/* Gradient only at the bottom (transparent to rgba(0,0,0,0.65), 55% of card height) */}
          <div className="collection-card-gradient" aria-hidden="true" />

          {/* Card Content Overlay */}
          <div className="collection-card-content">
            <div className="collection-card-info">
              <h3 className="collection-card-title">{translatedTitle}</h3>
              <span className="collection-card-cta">
                {t('collectionSubBanner.shopNow', { defaultValue: 'Shop now' })}
              </span>
            </div>

            <div className="collection-card-arrow-btn" aria-hidden="true">
              <ArrowUpRight size={16} className="collection-card-arrow-icon" />
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <section
      className="collection-sub-banner-section"
      aria-label={ariaLabel || displayHeading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
    >
      <div className="collection-sub-banner-container">
        {/* Header row: only heading, arrows removed */}
        <div className="collection-sub-banner-header">
          <h2 className="collection-sub-banner-heading">{displayHeading}</h2>
        </div>

        {/* Carousel stage with left/right fixed buttons & track */}
        <div className="collection-carousel-stage">
          {canLoop && !isMobile && (
            <button
              type="button"
              className="collection-carousel-arrow collection-carousel-prev"
              onClick={handlePrevClick}
              aria-label="Previous collections"
            >
              <PrevChevron size={18} strokeWidth={2.5} />
            </button>
          )}

          <div
            ref={viewportRef}
            className={`collection-carousel-track-wrapper ${
              canLoop ? 'is-carousel' : 'is-static'
            }`}
          >
            <div
              ref={trackRef}
              className="collection-carousel-track"
              role="list"
              onPointerDown={canLoop ? handlePointerDown : undefined}
              onPointerMove={canLoop ? handlePointerMove : undefined}
              onPointerUp={canLoop ? handlePointerUp : undefined}
              onPointerCancel={canLoop ? handlePointerUp : undefined}
            >
              {canLoop &&
                leadingCard &&
                renderCard(leadingCard, true, `leading-clone-${leadingCard.id}`)}
              {(canLoop ? cards : items).map((card) =>
                renderCard(card, false, card.id)
              )}
              {canLoop &&
                trailingClones.map((card, i) =>
                  renderCard(card, true, `trailing-clone-${card.id}-${i}`)
                )}
            </div>
          </div>

          {canLoop && !isMobile && (
            <button
              type="button"
              className="collection-carousel-arrow collection-carousel-next"
              onClick={handleNextClick}
              aria-label="Next collections"
            >
              <NextChevron size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Manual dots centered below cards */}
        {canLoop && (
          <div
            className="collection-carousel-dots"
            role="tablist"
            aria-label="Collections pagination"
          >
            {items.map((item, idx) => {
              const isActive = idx === (activeIndex >= 0 ? activeIndex : 0)
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  className={`collection-carousel-dot ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleDotClick(idx)}
                  aria-label={`Go to collection ${idx + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  aria-selected={isActive}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
