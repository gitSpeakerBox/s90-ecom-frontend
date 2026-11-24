import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseOtpCountdownOptions {
  /** Initial countdown seconds (defaults to 30) */
  initialSeconds?: number
  /** Auto start on mount (defaults to false) */
  autoStart?: boolean
  /** Callback fired when countdown completes */
  onComplete?: () => void
}

export interface UseOtpCountdownReturn {
  secondsLeft: number
  isActive: boolean
  isFinished: boolean
  formattedTime: string
  start: (seconds?: number) => void
  reset: () => void
}

/**
 * Reusable OTP countdown timer hook.
 * - Formats time as MM:SS (e.g. "00:30")
 * - Cleans up interval on unmount
 * - Prevents duplicate interval timers
 * - Starts only when explicitly invoked
 */
export function useOtpCountdown({
  initialSeconds = 30,
  autoStart = false,
  onComplete,
}: UseOtpCountdownOptions = {}): UseOtpCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds)
  const [isActive, setIsActive] = useState<boolean>(autoStart)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const clearCurrentTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(
    (seconds?: number) => {
      clearCurrentTimer()
      const startSecs = typeof seconds === 'number' ? seconds : initialSeconds
      setSecondsLeft(startSecs)
      setIsActive(true)

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearCurrentTimer()
            setIsActive(false)
            if (onCompleteRef.current) {
              onCompleteRef.current()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    [clearCurrentTimer, initialSeconds]
  )

  const reset = useCallback(() => {
    clearCurrentTimer()
    setSecondsLeft(initialSeconds)
    setIsActive(false)
  }, [clearCurrentTimer, initialSeconds])

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      clearCurrentTimer()
    }
  }, [clearCurrentTimer])

  // Format as MM:SS (e.g., "00:30")
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return {
    secondsLeft,
    isActive,
    isFinished: !isActive && secondsLeft === 0,
    formattedTime,
    start,
    reset,
  }
}
