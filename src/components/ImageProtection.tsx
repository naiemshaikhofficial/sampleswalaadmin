'use client'

import { useEffect } from 'react'

export function ImageProtection() {
  useEffect(() => {
    // Bypass image protection on localhost and local development
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

      const isImage =
        target.tagName === 'IMG' ||
        target.tagName === 'SVG' ||
        target.closest('img') ||
        target.closest('picture')

      if (isImage) {
        const anchor = target.closest('a') as HTMLAnchorElement | null
        if (anchor && anchor.href) {
          if (e.dataTransfer) {
            e.dataTransfer.setData('text/uri-list', anchor.href)
            e.dataTransfer.setData('text/plain', anchor.href)
            e.dataTransfer.effectAllowed = 'copyLink'
          }
        } else {
          e.preventDefault()
        }
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'IMG' ||
          target.tagName === 'SVG' ||
          target.closest('img') ||
          target.closest('picture'))
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener('dragstart', handleDragStart)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('dragstart', handleDragStart)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  return null
}
