/**
 * usePanelResize Hook
 * Handles panel resizing with proper event listener cleanup
 * Prevents memory leaks from dangling event listeners
 */

import { useCallback, useRef, useEffect } from 'react'

interface UsePanelResizeOptions {
  minLeftWidth?: number
  maxLeftWidth?: number
  minRightWidth?: number
  maxRightWidth?: number
  minCenterWidth?: number
}

export function usePanelResize(
  containerRef: React.RefObject<HTMLDivElement>,
  onLeftWidthChange: (width: number) => void,
  onRightWidthChange: (width: number) => void,
  options: UsePanelResizeOptions = {}
) {
  const {
    minLeftWidth = 20,
    maxLeftWidth = 55,
    minRightWidth = 18,
    maxRightWidth = 45,
    minCenterWidth = 20,
  } = options

  const isDraggingLeft = useRef(false)
  const isDraggingRight = useRef(false)
  const moveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const upHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)

  // Cleanup function - properly removes all listeners
  const cleanup = useCallback(() => {
    isDraggingLeft.current = false
    isDraggingRight.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    // Remove listeners if they exist
    if (moveHandlerRef.current) {
      document.removeEventListener('mousemove', moveHandlerRef.current)
    }
    if (upHandlerRef.current) {
      document.removeEventListener('mouseup', upHandlerRef.current)
    }

    // Clear refs to prevent memory leaks
    moveHandlerRef.current = null
    upHandlerRef.current = null
  }, [])

  // Ensure cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const startDrag = useCallback(
    (isLeft: boolean) => (e: React.MouseEvent) => {
      e.preventDefault()

      if (isLeft) {
        isDraggingLeft.current = true
      } else {
        isDraggingRight.current = true
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const moveHandler = (me: MouseEvent) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = me.clientX - rect.left
        const total = rect.width

        if (isDraggingLeft.current) {
          const newWidth = Math.min(Math.max((x / total) * 100, minLeftWidth), maxLeftWidth)
          onLeftWidthChange(newWidth)
        }

        if (isDraggingRight.current) {
          const newWidth = Math.min(
            Math.max(((total - x) / total) * 100, minRightWidth),
            maxRightWidth
          )
          onRightWidthChange(newWidth)
        }
      }

      const upHandler = () => {
        cleanup()
      }

      moveHandlerRef.current = moveHandler
      upHandlerRef.current = upHandler

      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', upHandler, { once: true })
    },
    [containerRef, onLeftWidthChange, onRightWidthChange, cleanup, minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth]
  )

  return { startDrag, cleanup }
}
