"use client"

import { Button } from "@/components/ui/button"

export function SkipNav() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <Button
        variant="outline"
        className="absolute top-4 left-4 z-50 focus:relative focus:z-auto bg-transparent"
        onClick={() => {
          const main = document.getElementById("main-content")
          if (main) {
            main.focus()
            main.scrollIntoView()
          }
        }}
      >
        Skip to main content
      </Button>
    </div>
  )
}
