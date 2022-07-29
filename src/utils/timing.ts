import { useCallback, useEffect, useRef, useState } from 'react'

export const DEFAULT_DELAY = 200

export function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(() => resolve(true), milliseconds))
}

export async function promiseTimeout<T extends any>(promise: Promise<T>, milliseconds: number) {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise<null>((resolve) => {
    const id = setTimeout(() => {
      clearTimeout(id)
      resolve(null)
    }, milliseconds)
  })
  // Awaits the race, which will throw on timeout
  const result = await Promise.race([promise, timeout])
  return result
}

// https://usehooks-typescript.com/react-hook/use-interval
export function useInterval(callback: () => void, delay: number | null, immediateStart?: boolean) {
  const savedCallback = useRef<() => void | null>()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    const tick = () => {
      if (typeof savedCallback?.current !== 'undefined') {
        savedCallback?.current()
      }
    }

    if (delay !== null) {
      if (immediateStart) {
        tick()
      }

      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }

    return undefined
  }, [delay, immediateStart])
}

// https://medium.com/javascript-in-plain-english/usetimeout-react-hook-3cc58b94af1f
export const useTimeout = (
  callback: () => void,
  delay = 0 // in ms (default: immediately put into JS Event Queue)
): (() => void) => {
  const timeoutIdRef = useRef<any>()

  const cancel = useCallback(() => {
    const timeoutId = timeoutIdRef.current
    if (timeoutId) {
      timeoutIdRef.current = undefined
      clearTimeout(timeoutId)
    }
  }, [timeoutIdRef])

  useEffect(() => {
    if (delay >= 0) {
      timeoutIdRef.current = setTimeout(callback, delay)
    }
    return cancel
  }, [callback, delay, cancel])

  return cancel
}

export const useSecondCountdownTimer = (
  shouldRun: boolean,
  time: number, // in seconds
  timerEndCallback: () => void,
  countdownInterval = 1 // in seconds
) => {
  const [countdownTime, setCountdownTime] = useState(time)

  useEffect(() => {
    if (!shouldRun) return
    const interval = setInterval(() => {
      if (countdownTime === 0) {
        timerEndCallback()
        setCountdownTime(time)
        return
      }

      setCountdownTime(countdownTime - countdownInterval)
    }, countdownInterval * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [shouldRun, countdownTime, countdownInterval, timerEndCallback, time])

  return countdownTime
}

// Copied from https://github.com/Uniswap/interface/blob/main/src/hooks/useDebounce.ts
// Which is modified from https://usehooks.com/useDebounce/
export function useDebounce<T>(value: T, delay: number = DEFAULT_DELAY): T {
  const [debouncedValue] = useDebounceWithStatus(value, delay)
  return debouncedValue
}

export function useDebounceWithStatus<T>(value: T, delay: number = DEFAULT_DELAY): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
    }, delay)

    setIsDebouncing(true)

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return [debouncedValue, isDebouncing]
}
