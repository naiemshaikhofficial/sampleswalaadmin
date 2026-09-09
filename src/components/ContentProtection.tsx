'use client'

import { useEffect } from 'react'

export function ContentProtection() {
  useEffect(() => {
    // Copy, paste, and text selection are 100% enabled across local and production
    // Only raw image/audio ripping prevention handlers are attached in production
    if (
      process.env.NODE_ENV === 'development' ||
      (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.startsWith('192.168.') ||
          window.location.hostname.endsWith('.local')))
    ) {
      return
    }

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      const isMedia =
        target.tagName === 'IMG' ||
        target.tagName === 'AUDIO' ||
        target.tagName === 'CANVAS' ||
        target.closest('img') ||
        target.closest('audio')

      if (isMedia) {
        const anchor = target.closest('a') as HTMLAnchorElement | null
        if (anchor && anchor.href) {
          if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', anchor.href)
          }
        } else {
          e.preventDefault()
        }
      }
    }

    document.addEventListener('dragstart', handleDragStart)

    return () => {
      document.removeEventListener('dragstart', handleDragStart)
    }
  }, [])

  return null
}

export default ContentProtection
