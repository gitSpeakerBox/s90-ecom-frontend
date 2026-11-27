import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * ScrollToTop
 *
 * Handles global scroll restoration across route transitions:
 * - When navigating to a new pathname (PUSH or REPLACE), scrolls window to top (0, 0).
 * - Preserves native scroll position restoration on browser back/forward (POP) navigation.
 * - Handles hash-anchor navigation (e.g. #section-id) by scrolling the target element into view.
 * - Ignores query-string-only changes (does not reset scroll when only searchParams change).
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const prevPathnameRef = useRef(pathname)

  useEffect(() => {
    const isNewPathname = prevPathnameRef.current !== pathname
    prevPathnameRef.current = pathname

    // If there is a valid hash anchor in the URL, attempt to scroll to it
    if (hash) {
      const targetId = decodeURIComponent(hash.slice(1))
      if (targetId) {
        // Small delay / rAF to allow the DOM to render the target element
        const frameId = window.requestAnimationFrame(() => {
          const element = document.getElementById(targetId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          } else if (isNewPathname && navigationType !== 'POP') {
            // If anchor element not found on a new pathname, fallback to top
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
          }
        })
        return () => window.cancelAnimationFrame(frameId)
      }
    }

    // On POP navigation (browser back/forward), allow the browser's native scroll restoration
    if (navigationType === 'POP') {
      return
    }

    // If pathname changed (PUSH or REPLACE) and no hash anchor is targeted, scroll to top
    if (isNewPathname) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [pathname, hash, navigationType])

  return null
}

