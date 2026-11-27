import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import type { SubBannerItem } from '../../types/landing'
import './SubBannerRow.css'

export type { SubBannerItem }

export interface SubBannerRowProps {
  heading?: string
  title?: string
  items?: SubBannerItem[]
  data?:
    | SubBannerItem[]
    | {
        tiles: Array<{
          title?: string
          image?: string
          link?: string
          alt?: string
        }>
      }
  ariaLabel?: string
}

interface CarouselCardItem extends SubBannerItem {
  _uid: string
}

const normalizeItems = (rawProps: SubBannerRowProps | SubBannerItem[]): CarouselCardItem[] => {
  const rawList: SubBannerItem[] = Array.isArray(rawProps)
    ? rawProps
    : (rawProps.items ??
      (Array.isArray(rawProps.data)
        ? rawProps.data
        : rawProps.data?.tiles.map((t) => ({
            title: t.title ?? '',
            image: t.image ?? '',
            to: t.link ?? '/',
            alt: t.alt,
          })) ??
        []))

  return rawList.map((item, index) => ({
    ...item,
    _uid: (item as { id?: string }).id || `${item.to || item.title || 'card'}-${index}`,
  }))
}

export const SubBannerRow = (props: SubBannerRowProps | SubBannerItem[]) => {
  const { t, language } = useLocale()
  const isRTL =
    language === 'ar' ||
    (typeof document !== 'undefined' && document.documentElement.dir === 'rtl')

  const ariaLabel = Array.isArray(props) ? undefined : props.ariaLabel
  const headingText = Array.isArray(props) ? undefined : props.heading || props.title

  const originalItems = useMemo(() => normalizeItems(props), [props])
  const [items, setItems] = useState<CarouselCardItem[]>(() => originalItems)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 640
  })

  const showControls = items.length > 4
  const canLoop = isMobile ? items.length > 2 : showControls
  const showArrows = !isMobile && showControls
  const canLoopRef = useRef<boolean>(canLoop)
  useEffect(() => {
    canLoopRef.current = canLoop
  }, [canLoop])

  const [layout, setLayout] = useState(() => {
    const mob = typeof window !== 'undefined' && window.innerWidth < 640
    return {
      cardWidth: 0,
      gap: mob ? 8 : 2,
      step: 0,
      visible: mob ? 2 : 4,
    }
  })
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTabHidden, setIsTabHidden] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const isTransitioningRef = useRef(false)
  const slideDirectionRef = useRef<'next' | 'prev' | 'dot' | null>(null)
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dotFinishRef = useRef<(() => void) | null>(null)
  const autoSlideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const layoutRef = useRef(layout)

  const initialUidsRef = useRef<string>(originalItems.map((i) => i._uid).join('|'))

  // Drag tracking refs
  const pointerDownRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const startTimeRef = useRef(0)
  const currentDeltaXRef = useRef(0)
  const isDraggingRef = useRef(false)
  const hasDraggedOver5pxRef = useRef(false)
  const suppressClickRef = useRef(false)
  const isGestureIgnoredRef = useRef(false)

  const isManualRef = useRef(false)
  const pendingStepCountRef = useRef(1)

  // Forward ref for handleNext to avoid circular dependency
  const handleNextRef = useRef<(isManual?: boolean, stepCount?: number) => void>(() => {})

  // Preload images
  useEffect(() => {
    items.forEach((item) => {
      if (item.image) {
        const img = new Image()
        img.src = item.image
      }
    })
  }, [items])

  // Sync items if external props change
  useEffect(() => {
    const nextItems = normalizeItems(props)
    const key = nextItems.map((i) => i._uid).join('|')
    if (key !== initialUidsRef.current) {
      initialUidsRef.current = key
      setItems(nextItems)
    }
  }, [props])

  // Visibility change listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Listen to prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Calculate card sizes and visible slots
  const updateLayout = useCallback(() => {
    if (!viewportRef.current) return
    const vpWidth = viewportRef.current.clientWidth
    if (!vpWidth) return

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const mob = windowWidth < 640
    setIsMobile(mob)

    const visible = windowWidth >= 1024 ? 4 : windowWidth >= 640 ? 3 : 2
    const gap = mob ? 8 : 2

    // Card width = (viewport width - gap) / 2 on mobile (8px gap), or (100% - gap * (visible - 1)) / visible
    const cardWidth = Math.max(0, mob ? (vpWidth - gap) / 2 : (vpWidth - gap * (visible - 1)) / visible)
    const step = cardWidth + gap

    const nextLayout = { cardWidth, gap, step, visible }
    layoutRef.current = nextLayout
    setLayout(nextLayout)

    // Reset track if idle
    if (!isTransitioningRef.current && !isDraggingRef.current && trackRef.current) {
      trackRef.current.style.transition = 'none'
      trackRef.current.style.transform = 'translateX(0px)'
    }
  }, [])

  useLayoutEffect(() => {
    updateLayout()
  }, [updateLayout])

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640)
      }
      updateLayout()
      requestAnimationFrame(() => updateLayout())
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateLayout())
        : null

    if (viewportRef.current && observer) {
      observer.observe(viewportRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      observer?.disconnect()
    }
  }, [updateLayout])

  // Timer management
  const clearAutoSlideTimer = useCallback(() => {
    if (autoSlideTimerRef.current) {
      clearTimeout(autoSlideTimerRef.current)
      autoSlideTimerRef.current = null
    }
  }, [])

  const startAutoSlideTimer = useCallback(
    (delay = 3500) => {
      clearAutoSlideTimer()
      if (
        !canLoopRef.current ||
        isHovered ||
        isFocused ||
        isTabHidden ||
        prefersReducedMotion ||
        pointerDownRef.current ||
        isDraggingRef.current
      ) {
        return
      }

      autoSlideTimerRef.current = setTimeout(() => {
        handleNextRef.current()
      }, delay)
    },
    [clearAutoSlideTimer, isHovered, isFocused, isTabHidden, prefersReducedMotion]
  )

  const finishNext = useCallback((stepCount = 1) => {
    const track = trackRef.current
    if (track) {
      track.style.transition = 'none'
    }

    // Move first stepCount cards to the end: push(shift())
    flushSync(() => {
      setItems((prev) => {
        if (prev.length <= 1) return prev
        const count = Math.min(stepCount, prev.length)
        const moved = prev.slice(0, count)
        const rest = prev.slice(count)
        return [...rest, ...moved]
      })
    })

    // Reset translateX to 0 and force reflow
    if (track) {
      track.style.transform = 'translateX(0px)'
      void track.offsetHeight
    }

    isTransitioningRef.current = false
    slideDirectionRef.current = null
    pendingStepCountRef.current = 1
  }, [])

  const finishPrev = useCallback((stepCount = 1) => {
    const track = trackRef.current
    if (track) {
      track.style.transition = 'none'
    }

    // Move last stepCount cards to front (only if stepCount === 1; stepCount === 2 unshifts before animation)
    if (stepCount === 1) {
      flushSync(() => {
        setItems((prev) => {
          if (prev.length <= 1) return prev
          const last = prev[prev.length - 1]
          return [last, ...prev.slice(0, prev.length - 1)]
        })
      })
    }

    if (track) {
      track.style.transform = 'translateX(0px)'
      void track.offsetHeight
    }

    isTransitioningRef.current = false
    slideDirectionRef.current = null
    pendingStepCountRef.current = 1
  }, [])

  // Transitionend handler
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== trackRef.current || e.propertyName !== 'transform') return
      if (!isTransitioningRef.current) return

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = null
      }

      const direction = slideDirectionRef.current
      const stepCount = pendingStepCountRef.current
      const isManual = isManualRef.current
      if (direction === 'next') {
        finishNext(stepCount)
        startAutoSlideTimer(isManual ? 3000 : 3500)
      } else if (direction === 'prev') {
        finishPrev(stepCount)
        startAutoSlideTimer(isManual ? 3000 : 3500)
      } else if (direction === 'dot') {
        dotFinishRef.current?.()
      }
    },
    [finishNext, finishPrev, startAutoSlideTimer]
  )

  // Advance by ONE card (or TWO cards on long swipe release)
  const handleNext = useCallback(
    (isManual = false, stepCount = 1) => {
      if (isTransitioningRef.current || !canLoopRef.current) return
      const track = trackRef.current
      const step = layoutRef.current.step
      if (!track || !step) return

      isTransitioningRef.current = true
      slideDirectionRef.current = 'next'
      isManualRef.current = isManual
      pendingStepCountRef.current = stepCount
      clearAutoSlideTimer()

      const targetX = (isRTL ? 1 : -1) * stepCount * step
      const duration = prefersReducedMotion
        ? '0ms'
        : isManual
        ? '400ms ease-out'
        : '700ms ease-in-out'

      track.style.transition = `transform ${duration}`
      track.style.transform = `translateX(${targetX}px)`

      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = setTimeout(
        () => {
          transitionTimeoutRef.current = null
          if (!isTransitioningRef.current) return
          finishNext(stepCount)
          startAutoSlideTimer(isManual ? 3000 : 3500)
        },
        prefersReducedMotion ? 20 : isManual ? 450 : 750
      )
    },
    [finishNext, isRTL, prefersReducedMotion, clearAutoSlideTimer, startAutoSlideTimer]
  )

  useEffect(() => {
    handleNextRef.current = handleNext
  }, [handleNext])

  // Previous card (1 card, or 2 cards on long swipe release)
  const handlePrev = useCallback(
    (isManual = false, stepCount = 1) => {
      if (isTransitioningRef.current || !canLoopRef.current) return
      const track = trackRef.current
      const step = layoutRef.current.step
      if (!track || !step) return

      isTransitioningRef.current = true
      slideDirectionRef.current = 'prev'
      isManualRef.current = isManual
      pendingStepCountRef.current = stepCount
      clearAutoSlideTimer()

      if (stepCount === 2) {
        track.style.transition = 'none'
        flushSync(() => {
          setItems((prev) => {
            if (prev.length <= 1) return prev
            const moved = prev.slice(-2)
            const rest = prev.slice(0, -2)
            return [...moved, ...rest]
          })
        })

        const currentDelta = currentDeltaXRef.current
        const startX = (isRTL ? 1 : -1) * 2 * step + currentDelta
        track.style.transform = `translateX(${startX}px)`
        void track.offsetHeight

        const duration = prefersReducedMotion ? '0ms' : '400ms ease-out'
        track.style.transition = `transform ${duration}`
        track.style.transform = 'translateX(0px)'

        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = setTimeout(
          () => {
            transitionTimeoutRef.current = null
            if (!isTransitioningRef.current) return
            finishPrev(2)
            startAutoSlideTimer(3000)
          },
          prefersReducedMotion ? 20 : 450
        )
        return
      }

      const targetX = isRTL ? -step : step
      const duration = prefersReducedMotion
        ? '0ms'
        : isManual
        ? '400ms ease-out'
        : '700ms ease-in-out'

      track.style.transition = `transform ${duration}`
      track.style.transform = `translateX(${targetX}px)`

      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
      transitionTimeoutRef.current = setTimeout(
        () => {
          transitionTimeoutRef.current = null
          if (!isTransitioningRef.current) return
          finishPrev(1)
          startAutoSlideTimer(isManual ? 3000 : 3500)
        },
        prefersReducedMotion ? 20 : isManual ? 450 : 750
      )
    },
    [finishPrev, isRTL, prefersReducedMotion, clearAutoSlideTimer, startAutoSlideTimer]
  )

  useEffect(() => {
    startAutoSlideTimer()
    return () => clearAutoSlideTimer()
  }, [startAutoSlideTimer, clearAutoSlideTimer])

  // Manual navigation handlers
  const onNextClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isTransitioningRef.current) return
    handleNext(false)
  }

  const onPrevClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isTransitioningRef.current) return
    handlePrev(false)
  }

  // Active index follows real card index of the first visible card
  const activeIndex = originalItems.findIndex((orig) => orig._uid === items[0]?._uid)
  const activeDotIndex = activeIndex >= 0 ? activeIndex : 0
  const showDots = canLoop && originalItems.length > layout.visible

  // Manual dot slide
  const handleDotClick = useCallback(
    (targetIndex: number) => {
      if (isTransitioningRef.current || !canLoopRef.current) return
      const targetItem = originalItems[targetIndex]
      if (!targetItem) return

      const targetPos = items.findIndex((c) => c._uid === targetItem._uid)
      if (targetPos === -1) return
      if (targetPos === 0) {
        startAutoSlideTimer(3000)
        return
      }

      const track = trackRef.current
      const step = layoutRef.current.step
      if (!track || !step) return

      clearAutoSlideTimer()
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
        transitionTimeoutRef.current = null
      }

      const n = items.length
      const forwardSteps = targetPos
      const backwardSteps = n - targetPos
      const nextSign = isRTL ? 1 : -1

      if (forwardSteps <= backwardSteps) {
        // Slide forward in a single move
        if (prefersReducedMotion) {
          flushSync(() => {
            setItems((prev) => {
              const next = [...prev]
              const moved = next.splice(0, forwardSteps)
              next.push(...moved)
              return next
            })
          })
          track.style.transition = 'none'
          track.style.transform = 'translateX(0px)'
          void track.offsetHeight
          startAutoSlideTimer(3000)
          return
        }

        isTransitioningRef.current = true
        slideDirectionRef.current = 'dot'
        track.style.transition = 'transform 400ms ease-out'
        track.style.transform = `translateX(${nextSign * forwardSteps * step}px)`

        const finishForward = () => {
          if (!isTransitioningRef.current) return
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current)
            transitionTimeoutRef.current = null
          }
          dotFinishRef.current = null

          if (trackRef.current) {
            trackRef.current.style.transition = 'none'
          }
          flushSync(() => {
            setItems((prev) => {
              const next = [...prev]
              const moved = next.splice(0, forwardSteps)
              next.push(...moved)
              return next
            })
          })
          if (trackRef.current) {
            trackRef.current.style.transform = 'translateX(0px)'
            void trackRef.current.offsetHeight
          }
          isTransitioningRef.current = false
          slideDirectionRef.current = null
          startAutoSlideTimer(3000)
        }

        dotFinishRef.current = finishForward
        transitionTimeoutRef.current = setTimeout(finishForward, 450)
      } else {
        // Slide backward in a single move
        if (prefersReducedMotion) {
          flushSync(() => {
            setItems((prev) => {
              const next = [...prev]
              const moved = next.splice(-backwardSteps)
              next.unshift(...moved)
              return next
            })
          })
          track.style.transition = 'none'
          track.style.transform = 'translateX(0px)'
          void track.offsetHeight
          startAutoSlideTimer(3000)
          return
        }

        isTransitioningRef.current = true
        slideDirectionRef.current = 'dot'

        track.style.transition = 'none'
        flushSync(() => {
          setItems((prev) => {
            const next = [...prev]
            const moved = next.splice(-backwardSteps)
            next.unshift(...moved)
            return next
          })
        })

        const startX = isRTL ? backwardSteps * step : -backwardSteps * step
        track.style.transform = `translateX(${startX}px)`
        void track.offsetHeight

        track.style.transition = 'transform 400ms ease-out'
        track.style.transform = 'translateX(0px)'

        const finishBackward = () => {
          if (!isTransitioningRef.current) return
          if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current)
            transitionTimeoutRef.current = null
          }
          dotFinishRef.current = null

          if (trackRef.current) {
            trackRef.current.style.transition = 'none'
            trackRef.current.style.transform = 'translateX(0px)'
            void trackRef.current.offsetHeight
          }
          isTransitioningRef.current = false
          slideDirectionRef.current = null
          startAutoSlideTimer(3000)
        }

        dotFinishRef.current = finishBackward
        transitionTimeoutRef.current = setTimeout(finishBackward, 450)
      }
    },
    [originalItems, items, isRTL, prefersReducedMotion, clearAutoSlideTimer, startAutoSlideTimer]
  )

  // Pointer drag & touch swipe
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTransitioningRef.current || !canLoopRef.current) return
    if (e.button !== 0) return

    pointerDownRef.current = true
    pointerIdRef.current = e.pointerId
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    startTimeRef.current = performance.now()
    currentDeltaXRef.current = 0
    isDraggingRef.current = false
    hasDraggedOver5pxRef.current = false
    isGestureIgnoredRef.current = false

    clearAutoSlideTimer()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current || isGestureIgnoredRef.current) return
    if (isTransitioningRef.current) return

    const deltaX = e.clientX - dragStartXRef.current
    const deltaY = e.clientY - dragStartYRef.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (Math.hypot(deltaX, deltaY) > 5) {
      hasDraggedOver5pxRef.current = true
    }

    if (!isDraggingRef.current) {
      if (absY > absX && absY > 8) {
        isGestureIgnoredRef.current = true
        pointerDownRef.current = false
        startAutoSlideTimer(3000)
        return
      }

      if (absX >= 8 && absX > absY) {
        isDraggingRef.current = true
        try {
          trackRef.current?.setPointerCapture(e.pointerId)
        } catch {
          // ignore
        }
        if (trackRef.current) {
          trackRef.current.style.transition = 'none'
          trackRef.current.style.cursor = 'grabbing'
        }
      }
    }

    if (isDraggingRef.current && trackRef.current) {
      currentDeltaXRef.current = deltaX
      const step = layoutRef.current.step
      const maxDrag = isMobile ? step * 1.5 : step
      const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX))
      trackRef.current.style.transform = `translateX(${clampedDelta}px)`
    }
  }

  const endDrag = (_e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerDownRef.current && !isDraggingRef.current) return

    try {
      if (
        pointerIdRef.current !== null &&
        trackRef.current?.hasPointerCapture(pointerIdRef.current)
      ) {
        trackRef.current.releasePointerCapture(pointerIdRef.current)
      }
    } catch {
      // ignore
    }

    if (trackRef.current) {
      trackRef.current.style.cursor = ''
    }

    if (hasDraggedOver5pxRef.current) {
      suppressClickRef.current = true
      setTimeout(() => {
        suppressClickRef.current = false
        hasDraggedOver5pxRef.current = false
      }, 200)
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false
      pointerDownRef.current = false
      pointerIdRef.current = null

      const deltaX = currentDeltaXRef.current
      const cardWidth = layoutRef.current.cardWidth
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

      const isLongSwipe = isMobile && Math.abs(deltaX) > cardWidth * 0.6
      const stepCount = isLongSwipe ? 2 : 1

      if (shouldGoNext) {
        handleNext(true, stepCount)
      } else if (shouldGoPrev) {
        handlePrev(true, stepCount)
      } else {
        if (trackRef.current) {
          trackRef.current.style.transition = prefersReducedMotion
            ? 'none'
            : 'transform 250ms ease-out'
          trackRef.current.style.transform = 'translateX(0px)'
        }
        startAutoSlideTimer(3000)
      }
    } else {
      pointerDownRef.current = false
      pointerIdRef.current = null
      startAutoSlideTimer(3000)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (suppressClickRef.current || hasDraggedOver5pxRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const getLocalizedTitle = (card: CarouselCardItem) => {
    const key = card.title?.toLowerCase()
    return key ? t(`subBanners.${key}`, { defaultValue: card.title }) : card.title
  }

  if (items.length === 0) return null

  const prevCard = canLoop ? items[items.length - 1] : null

  return (
    <section
      className="sub-banner-row"
      aria-label={ariaLabel || headingText || t('subBanners.categoryCollections')}
    >
      {headingText && <h2 className="sub-banner-heading">{headingText}</h2>}

      <div
        className="sub-banner-carousel"
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocused(false)
          }
        }}
      >
        {showArrows && (
          <button
            type="button"
            className="sub-banner-arrow sub-banner-arrow-prev"
            onClick={onPrevClick}
            aria-label="Previous banners"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}

        <div className="sub-banner-viewport" ref={viewportRef}>
          <div
            ref={trackRef}
            className="sub-banner-track"
            onTransitionEnd={handleTransitionEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {canLoop && prevCard && (
              <Link
                key={`clone-prev-${prevCard._uid}`}
                to={prevCard.to}
                className="sub-banner-card"
                aria-label={getLocalizedTitle(prevCard)}
                tabIndex={-1}
                aria-hidden="true"
                onClick={handleCardClick}
                draggable={false}
                style={{
                  width: layout.cardWidth ? `${layout.cardWidth}px` : undefined,
                  flex: layout.cardWidth ? `0 0 ${layout.cardWidth}px` : undefined,
                  marginInlineStart: layout.step ? `-${layout.step}px` : undefined,
                }}
              >
                <img
                  src={prevCard.image}
                  alt={prevCard.alt || getLocalizedTitle(prevCard)}
                  className="sub-banner-image"
                  loading="eager"
                  draggable={false}
                />
                <div className="sub-banner-overlay" aria-hidden="true" />
                <span className="sub-banner-label">{getLocalizedTitle(prevCard)}</span>
              </Link>
            )}

            {items.map((card, index) => {
              const localizedTitle = getLocalizedTitle(card)
              return (
                <Link
                  key={card._uid}
                  to={card.to}
                  className="sub-banner-card"
                  aria-label={localizedTitle}
                  onClick={handleCardClick}
                  draggable={false}
                  style={{
                    width: layout.cardWidth ? `${layout.cardWidth}px` : undefined,
                    flex: layout.cardWidth ? `0 0 ${layout.cardWidth}px` : undefined,
                  }}
                >
                  <img
                    src={card.image}
                    alt={card.alt || localizedTitle}
                    className="sub-banner-image"
                    loading={index < layout.visible ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                  <div className="sub-banner-overlay" aria-hidden="true" />
                  <span className="sub-banner-label">{localizedTitle}</span>
                </Link>
              )
            })}

            {canLoop &&
              items.slice(0, layout.visible).map((card, index) => {
                const localizedTitle = getLocalizedTitle(card)
                return (
                  <Link
                    key={`clone-next-${card._uid}-${index}`}
                    to={card.to}
                    className="sub-banner-card"
                    aria-label={localizedTitle}
                    tabIndex={-1}
                    aria-hidden="true"
                    onClick={handleCardClick}
                    draggable={false}
                    style={{
                      width: layout.cardWidth ? `${layout.cardWidth}px` : undefined,
                      flex: layout.cardWidth ? `0 0 ${layout.cardWidth}px` : undefined,
                    }}
                  >
                    <img
                      src={card.image}
                      alt={card.alt || localizedTitle}
                      className="sub-banner-image"
                      loading="lazy"
                      draggable={false}
                    />
                    <div className="sub-banner-overlay" aria-hidden="true" />
                    <span className="sub-banner-label">{localizedTitle}</span>
                  </Link>
                )
              })}
          </div>
        </div>

        {showArrows && (
          <button
            type="button"
            className="sub-banner-arrow sub-banner-arrow-next"
            onClick={onNextClick}
            aria-label="Next banners"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {showDots && (
        <div
          className="sub-banner-dots"
          role="tablist"
          aria-label={t('subBanners.pagination', { defaultValue: 'Banners pagination' })}
        >
          {originalItems.map((item, idx) => {
            const isActive = idx === activeDotIndex
            return (
              <button
                key={`sub-banner-dot-${item._uid}`}
                type="button"
                role="tab"
                className={`sub-banner-dot ${isActive ? 'is-active' : ''}`}
                onClick={() => handleDotClick(idx)}
                aria-label={`Go to banner ${idx + 1}`}
                aria-current={isActive ? 'true' : undefined}
                aria-selected={isActive}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
