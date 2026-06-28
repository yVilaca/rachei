import { useState, useRef, useCallback, useEffect } from 'react'

export function useToast(durationMs = 3500) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    timerRef.current = setTimeout(() => setMessage(null), durationMs)
  }, [durationMs])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { message, show }
}
