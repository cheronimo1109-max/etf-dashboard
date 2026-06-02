import { useRef, useCallback } from 'react'

export function useSwipe({ onLeft, onRight, minDist = 60, maxVertical = 80 }) {
  const start = useRef(null)

  const onTouchStart = useCallback(e => {
    const t = e.changedTouches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }, [])

  const onTouchEnd = useCallback(e => {
    if (!start.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.current.x
    const dy = Math.abs(t.clientY - start.current.y)
    start.current = null
    if (dy > maxVertical || Math.abs(dx) < minDist) return
    dx < 0 ? onLeft?.() : onRight?.()
  }, [onLeft, onRight, minDist, maxVertical])

  return { onTouchStart, onTouchEnd }
}
