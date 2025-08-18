"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean
  onRemove?: () => void
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, children, selected, onRemove, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
          selected ? "bg-primary/10 border-primary/30" : "bg-muted/60 border-muted-foreground/20",
          className,
        )}
        {...props}
      >
        <span className="truncate max-w-[12rem]">{children}</span>
        {onRemove ? (
          <button
            type="button"
            aria-label="Remove chip"
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    )
  },
)
Chip.displayName = "Chip"
