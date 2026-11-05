/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

export interface ToastData {
  id: string
  message: string
  type?: 'success' | 'info' | 'error'
  duration?: number
}

export interface ShowToastOptions {
  type?: 'success' | 'info' | 'error'
  duration?: number
}

export interface ToastContextType {
  toast: ToastData | null
  isExiting: boolean
  showToast: (messageOrKey: string, options?: ShowToastOptions) => void
  hideToast: () => void
  pauseToast: () => void
  resumeToast: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const DEFAULT_DURATION = 4000
const EXIT_ANIMATION_DURATION = 200

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastData | null>(null)
  const [isExiting, setIsExiting] = useState(false)

  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTriggerRef = useRef<{ message: string; timestamp: number } | null>(null)
  const remainingTimeRef = useRef<number>(DEFAULT_DURATION)
  const startTimeRef = useRef<number>(0)

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  const hideToast = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }

    setIsExiting(true)
    exitTimerRef.current = setTimeout(() => {
      setToast(null)
      setIsExiting(false)
      exitTimerRef.current = null
      lastTriggerRef.current = null
    }, EXIT_ANIMATION_DURATION)
  }, [])

  const pauseToast = useCallback(() => {
    if (autoDismissTimerRef.current && toast) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
      const elapsed = Date.now() - startTimeRef.current
      const currentDuration = toast.duration ?? DEFAULT_DURATION
      remainingTimeRef.current = Math.max(currentDuration - elapsed, 1000)
    }
  }, [toast])

  const resumeToast = useCallback(() => {
    if (!autoDismissTimerRef.current && toast && !isExiting) {
      startTimeRef.current = Date.now()
      autoDismissTimerRef.current = setTimeout(() => {
        hideToast()
      }, remainingTimeRef.current)
    }
  }, [toast, isExiting, hideToast])

  const showToast = useCallback(
    (messageOrKey: string, options?: ShowToastOptions) => {
      if (!messageOrKey) return

      const now = Date.now()

      // Avoid duplicate notifications for a single action within 350ms
      if (
        lastTriggerRef.current &&
        lastTriggerRef.current.message === messageOrKey &&
        now - lastTriggerRef.current.timestamp < 350
      ) {
        return
      }
      lastTriggerRef.current = { message: messageOrKey, timestamp: now }

      // Clear any pending timers
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current)
        autoDismissTimerRef.current = null
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }

      setIsExiting(false)
      const duration = options?.duration ?? DEFAULT_DURATION
      remainingTimeRef.current = duration
      startTimeRef.current = now

      setToast({
        id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
        message: messageOrKey,
        type: options?.type ?? 'success',
        duration,
      })

      autoDismissTimerRef.current = setTimeout(() => {
        hideToast()
      }, duration)
    },
    [hideToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toast,
        isExiting,
        showToast,
        hideToast,
        pauseToast,
        resumeToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

