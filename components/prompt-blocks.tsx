"use client"

import React, { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, GripVertical } from "lucide-react"
import type { Trait, TraitCategory } from "@/lib/types"
import { TraitChipInput } from "@/components/trait-chip-input"

export type PromptBlockType = "Subject" | "Style" | "Lighting" | "Color" | "Mood" | "Composition" | "Camera" | "Details"

export interface PromptBlock {
  id: string
  type: PromptBlockType
  value: string
  traits?: Trait[]
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function blockPlaceholder(type: PromptBlockType) {
  switch (type) {
    case "Subject":
      return "e.g., a playful fox wearing a scarf"
    case "Style":
      return "e.g., watercolor, impressionist, minimalist"
    case "Lighting":
      return "e.g., golden hour, soft studio light"
    case "Color":
      return "e.g., pastel palette, bold complementary colors"
    case "Mood":
      return "e.g., cozy, adventurous, serene"
    case "Composition":
      return "e.g., wide shot, centered subject, rule of thirds"
    case "Camera":
      return "e.g., 35mm, macro, shallow depth of field"
    case "Details":
      return "e.g., intricate textures, fine linework"
    default:
      return ""
  }
}

function formatExpanded(blocks: PromptBlock[]) {
  const parts: string[] = []
  for (const b of blocks) {
    const v = b.value.trim()
    const traitNames = (b.traits ?? []).map((t) => t.name).filter(Boolean)
    const combined = [v, traitNames.join(", ")].filter((s) => s && s.length > 0).join(", ")
    if (!combined) continue
    // Use labels for readability
    parts.push(`${b.type}: ${combined}`)
  }
  return parts.join(". ")
}

export function PromptBlocks({
  disabled,
  onChange,
  initialBlocks,
}: {
  disabled?: boolean
  onChange?: (expandedPrompt: string, blocks: PromptBlock[]) => void
  initialBlocks?: PromptBlock[]
}) {
  const [blocks, setBlocks] = useState<PromptBlock[]>(
    initialBlocks ?? [
      { id: uid(), type: "Subject", value: "", traits: [] },
      { id: uid(), type: "Style", value: "", traits: [] },
      { id: uid(), type: "Lighting", value: "", traits: [] },
    ],
  )

  const expanded = useMemo(() => formatExpanded(blocks), [blocks])

  React.useEffect(() => {
    onChange?.(expanded, blocks)
  }, [expanded, blocks, onChange])

  const addBlock = (type: PromptBlockType) => {
    setBlocks((prev) => [...prev, { id: uid(), type, value: "", traits: [] }])
  }
  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }
  const updateBlock = (id: string, patch: Partial<PromptBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }
  const move = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx < 0) return prev
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  const availableTypes: PromptBlockType[] = [
    "Subject",
    "Style",
    "Lighting",
    "Color",
    "Mood",
    "Composition",
    "Camera",
    "Details",
  ]

  const traitEnabledTypes: TraitCategory[] = [
    "Style",
    "Lighting",
    "Color",
    "Mood",
    "Composition",
    "Camera",
    "Details",
  ]

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1">
          <div className="font-medium">Prompt Blocks</div>
          <div className="text-xs text-muted-foreground">Add descriptive blocks to build an expanded prompt.</div>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => addBlock(v as PromptBlockType)} disabled={disabled}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Add block" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {blocks.map((b, idx) => (
          <div key={b.id} className="grid gap-2 border rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor={`pb-type-${b.id}`} className="text-xs">
                  Type
                </Label>
                <Select
                  value={b.type}
                  onValueChange={(v) => updateBlock(b.id, { type: v as PromptBlockType })}
                  disabled={disabled}
                >
                  <SelectTrigger id={`pb-type-${b.id}`} className="w-44 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => move(b.id, -1)} disabled={disabled || idx === 0}>
                  ↑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => move(b.id, +1)}
                  disabled={disabled || idx === blocks.length - 1}
                >
                  ↓
                </Button>
                <Button variant="ghost" size="sm" onClick={() => removeBlock(b.id)} disabled={disabled}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {b.type === "Details" || b.type === "Composition" ? (
              <Textarea
                value={b.value}
                onChange={(e) => updateBlock(b.id, { value: e.target.value })}
                placeholder={blockPlaceholder(b.type)}
                disabled={disabled}
                rows={3}
              />
            ) : (
              <Input
                value={b.value}
                onChange={(e) => updateBlock(b.id, { value: e.target.value })}
                placeholder={blockPlaceholder(b.type)}
                disabled={disabled}
              />
            )}

            {traitEnabledTypes.includes(b.type as TraitCategory) ? (
              <div className="mt-2">
                <Label className="text-xs">{b.type} traits</Label>
                <TraitChipInput
                  value={b.traits ?? []}
                  onChange={(traits) => updateBlock(b.id, { traits })}
                  categories={[b.type as TraitCategory]}
                  placeholder={`Search ${b.type.toLowerCase()} traits...`}
                  disabled={disabled}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Label className="text-xs">Expanded Prompt (auto-updates)</Label>
        <div className="mt-1 text-sm bg-muted p-3 rounded-md min-h-[44px]">
          {expanded || <span className="text-muted-foreground">(empty)</span>}
        </div>
      </div>
    </Card>
  )
}
