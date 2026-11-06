import { useCallback } from 'react'

export interface CarouselSlideOptions {
  trackRef: React.RefObject<HTMLDivElement | null>
  isRTL: boolean
  isMobile: boolean
  cardWidthRef: React.RefObject<number>
  stepRef: React.RefObject<number>
  isAnimatingRef: React.RefObject<boolean>
  canLoopRef: React.RefObject<boolean>
  onCycleComplete: (direction: 'next' | 'prev') => void
  duration?: number
}

/**
 * Shared continuous physics and DOM transform animation logic for carousel cards.
 */
export function useCarouselAnimation({
  trackRef,
  isRTL,
  cardWidthRef,
  stepRef,
  isAnimatingRef,
  canLoopRef,
  onCycleComplete,
  duration = 380,
}: CarouselSlideOptions) {
  const slide = useCallback(
    (direction: 'next' | 'prev') => {
      const track = trackRef.current
      if (!track || isAnimatingRef.current) return

      const step = stepRef.current || cardWidthRef.current || 280
      const sign = direction === 'next' ? (isRTL ? 1 : -1) : (isRTL ? -1 : 1)
      const targetOffset = sign * step

      if (!canLoopRef.current) {
        // Simple non-loop translation or bounce
        track.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        track.style.transform = `translateX(${targetOffset}px)`
        return
      }

      isAnimatingRef.current = true

      if (direction === 'prev') {
        // Pre-rotate DOM before animating
        onCycleComplete('prev')
        track.style.transition = 'none'
        track.style.transform = `translateX(${-sign * step}px)`

        // Force browser layout flush
        void track.offsetHeight

        track.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        track.style.transform = 'translateX(0px)'

        const handleTransitionEnd = (e: TransitionEvent) => {
          if (e.target !== track) return
          track.removeEventListener('transitionend', handleTransitionEnd)
          track.style.transition = 'none'
          isAnimatingRef.current = false
        }
        track.addEventListener('transitionend', handleTransitionEnd)
      } else {
        // Forward animation: slide first, rotate items on transitionend
        track.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`
        track.style.transform = `translateX(${targetOffset}px)`

        const handleTransitionEnd = (e: TransitionEvent) => {
          if (e.target !== track) return
          track.removeEventListener('transitionend', handleTransitionEnd)
          track.style.transition = 'none'
          track.style.transform = 'translateX(0px)'
          onCycleComplete('next')
          void track.offsetHeight
          isAnimatingRef.current = false
        }
        track.addEventListener('transitionend', handleTransitionEnd)
      }
    },
    [
      trackRef,
      isRTL,
      cardWidthRef,
      stepRef,
      isAnimatingRef,
      canLoopRef,
      onCycleComplete,
      duration,
    ]
  )

  return { slide }
}

