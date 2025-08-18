"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface FocusTrapProps {
  children: ReactNode
  active: boolean
}

export function FocusTrap({ children, active }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as NodeListOf<HTMLElement>
    }

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus the first element
    if (firstElement) {
      firstElement.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      const currentFocusableElements = getFocusableElements()
      const currentFirstElement = currentFocusableElements[0]
      const currentLastElement = currentFocusableElements[currentFocusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === currentFirstElement) {
          e.preventDefault()
          currentLastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === currentLastElement) {
          e.preventDefault()
          currentFirstElement?.focus()
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)

    return () => {
      container.removeEventListener("keydown", handleKeyDown)
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [active])

  return (
    <div ref={containerRef} className={active ? "contents" : "contents"}>
      {children}
    </div>
  )
}
