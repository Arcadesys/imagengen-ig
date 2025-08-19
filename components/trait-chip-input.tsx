"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Chip } from "@/components/ui/chip"
import { cn } from "@/lib/utils"
import type { Trait, TraitCategory } from "@/lib/types"

export interface TraitChipInputProps {
  value: Trait[]
  onChange: (traits: Trait[]) => void
  categories?: TraitCategory[]
  placeholder?: string
  disabled?: boolean
}

export function TraitChipInput({ value, onChange, categories, placeholder, disabled }: TraitChipInputProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Trait[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const categoryParam = useMemo(() => categories?.join(","), [categories])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const q = query.trim()
    if (!q) {
      setSuggestions([])
      setOpen(false)
      return () => controller.abort()
    }

    const url = new URL("/api/traits", window.location.origin)
    url.searchParams.set("q", q)
    if (categoryParam) url.searchParams.set("categories", categoryParam)
    url.searchParams.set("limit", "8")

    fetch(url.toString(), { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        const items: Trait[] = data?.items ?? []
        // Remove already selected
        const filtered = items.filter((t) => !value.some((v) => v.id === t.id))
        setSuggestions(filtered)
        setOpen(filtered.length > 0)
        setHighlight(0)
      })
      .catch(() => {
        if (!active) return
        setSuggestions([])
        setOpen(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [query, categoryParam, value])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return
      if (boxRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [])

  function addTrait(t: Trait) {
    if (disabled) return
    if (value.some((v) => v.id === t.id)) return
    onChange([...value, t])
    setQuery("")
    setOpen(false)
    inputRef.current?.focus()
  }
  function removeTrait(id: string) {
    onChange(value.filter((v) => v.id !== id))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      addTrait(suggestions[highlight])
    }
  }

  return (
    <div ref={boxRef} className="w-full">
      <div className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-2 focus-within:ring-2 focus-within:ring-ring">
        {value.map((t) => (
          <Chip key={t.id} onRemove={() => removeTrait(t.id)}>
            {t.name}
          </Chip>
        ))}
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? "Search traits..."}
          className="border-none shadow-none focus-visible:ring-0 px-0 flex-1 min-w-[10ch]"
          disabled={disabled}
        />
      </div>

      {open ? (
        <div className="relative">
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  i === highlight && "bg-accent/70",
                )}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => addTrait(s)}
              >
                <div className="truncate">
                  {s.name}
                  <span className="ml-2 text-xs text-muted-foreground">{s.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
