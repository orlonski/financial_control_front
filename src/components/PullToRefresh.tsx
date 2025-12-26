import React, { useState, useRef, useCallback, useEffect } from 'react'
import { RefreshCw, ChevronUp } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  disabled?: boolean
}

const PULL_THRESHOLD = 80
const MAX_PULL = 120

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const startedAtTop = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return

    // Check if page is scrolled to top using window.scrollY
    startedAtTop.current = window.scrollY <= 0

    if (!startedAtTop.current) return

    touchStartY.current = e.touches[0].clientY
    isPulling.current = true
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return

    // If user scrolled down, cancel pull
    if (window.scrollY > 0) {
      isPulling.current = false
      setPullDistance(0)
      return
    }

    const touchCurrentY = e.touches[0].clientY
    const delta = touchCurrentY - touchStartY.current

    // Only activate pull-to-refresh on deliberate pull down
    if (delta > 10 && startedAtTop.current) {
      // Prevent default scroll when pulling down
      e.preventDefault()
      // Apply resistance to make it feel more natural
      const distance = Math.min(delta * 0.5, MAX_PULL)
      setPullDistance(distance)
    } else if (delta < 0) {
      // User is scrolling up, cancel pull and allow normal scroll
      isPulling.current = false
      setPullDistance(0)
    }
  }, [disabled, isRefreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled || isRefreshing) return

    isPulling.current = false
    startedAtTop.current = false

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true)
      setPullDistance(PULL_THRESHOLD / 2)

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, onRefresh, disabled, isRefreshing])

  // Use native event listeners with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Scroll to top button visibility - listen to window scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const rotation = progress * 180

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center transition-transform duration-200 pointer-events-none z-10"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: progress,
        }}
      >
        <div className={`
          bg-white rounded-full p-2 shadow-lg
          ${isRefreshing ? 'animate-spin' : ''}
        `}>
          <RefreshCw
            className="h-5 w-5 text-blue-600"
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
        }}
      >
        {children}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-20 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
