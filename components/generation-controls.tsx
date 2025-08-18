"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Settings } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface GenerationControlsProps {
  size: "512x512" | "768x768" | "1024x1024"
  onSizeChange: (size: "512x512" | "768x768" | "1024x1024") => void
  seed: string
  onSeedChange: (seed: string) => void
  onGenerate: () => void
  disabled?: boolean
  isGenerating?: boolean
  variations?: number
  onVariationsChange?: (variations: number) => void
  quality?: "standard" | "hd"
  onQualityChange?: (quality: "standard" | "hd") => void
  style?: "vivid" | "natural"
  onStyleChange?: (style: "vivid" | "natural") => void
  negativePrompt?: string
  onNegativePromptChange?: (negativePrompt: string) => void
  guidanceScale?: number
  onGuidanceScaleChange?: (guidanceScale: number) => void
  steps?: number
  onStepsChange?: (steps: number) => void
}

export function GenerationControls({
  size,
  onSizeChange,
  seed,
  onSeedChange,
  onGenerate,
  disabled,
  isGenerating,
  variations = 1,
  onVariationsChange,
  quality = "standard",
  onQualityChange,
  style = "vivid",
  onStyleChange,
  negativePrompt = "",
  onNegativePromptChange,
  guidanceScale = 7,
  onGuidanceScaleChange,
  steps = 20,
  onStepsChange,
}: GenerationControlsProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const handleSeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSeedChange(e.target.value)
    },
    [onSeedChange],
  )

  const handleGenerateClick = useCallback(() => {
    if (!disabled && !isGenerating) {
      onGenerate()
    }
  }, [disabled, isGenerating, onGenerate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !disabled && !isGenerating) {
        e.preventDefault()
        onGenerate()
      }
    },
    [disabled, isGenerating, onGenerate],
  )

  const handleNegativePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onNegativePromptChange?.(e.target.value)
    },
    [onNegativePromptChange],
  )

  const handleGuidanceScaleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseFloat(e.target.value)
      if (!isNaN(value) && value >= 1 && value <= 20) {
        onGuidanceScaleChange?.(value)
      }
    },
    [onGuidanceScaleChange],
  )

  const handleStepsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number.parseInt(e.target.value)
      if (!isNaN(value) && value >= 10 && value <= 50) {
        onStepsChange?.(value)
      }
    },
    [onStepsChange],
  )

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="size-select">Image Size</Label>
            <Select value={size} onValueChange={onSizeChange} disabled={disabled}>
              <SelectTrigger id="size-select" aria-describedby="size-help">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512x512">512×512 (Small)</SelectItem>
                <SelectItem value="768x768">768×768 (Medium)</SelectItem>
                <SelectItem value="1024x1024">1024×1024 (Large)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground" id="size-help">
              Larger sizes take more time to generate
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variations-select">Variations</Label>
            <Select
              value={variations.toString()}
              onValueChange={(value) => onVariationsChange?.(Number.parseInt(value))}
              disabled={disabled}
            >
              <SelectTrigger id="variations-select" aria-describedby="variations-help">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 image</SelectItem>
                <SelectItem value="2">2 images</SelectItem>
                <SelectItem value="3">3 images</SelectItem>
                <SelectItem value="4">4 images</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground" id="variations-help">
              Choose how many variations to generate
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seed-input">Seed (Optional)</Label>
            <Input
              id="seed-input"
              value={seed}
              onChange={handleSeedChange}
              placeholder="Random"
              disabled={disabled}
              aria-describedby="seed-help"
            />
            <p className="text-xs text-muted-foreground" id="seed-help">
              Use same seed for consistent results
            </p>
          </div>
        </div>

        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-2 h-auto"
              disabled={disabled}
              aria-expanded={isAdvancedOpen}
              aria-controls="advanced-options"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Advanced Options</span>
              </div>
              {isAdvancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent id="advanced-options" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quality Setting */}
              <div className="space-y-2">
                <Label htmlFor="quality-select">Quality</Label>
                <Select value={quality} onValueChange={onQualityChange} disabled={disabled}>
                  <SelectTrigger id="quality-select" aria-describedby="quality-help">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hd">HD (Higher Quality)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground" id="quality-help">
                  HD quality takes longer but produces better results
                </p>
              </div>

              {/* Style Setting */}
              <div className="space-y-2">
                <Label htmlFor="style-select">Style</Label>
                <Select value={style} onValueChange={onStyleChange} disabled={disabled}>
                  <SelectTrigger id="style-select" aria-describedby="style-help">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">Vivid (More Creative)</SelectItem>
                    <SelectItem value="natural">Natural (More Realistic)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground" id="style-help">
                  Vivid creates more artistic images, Natural is more photorealistic
                </p>
              </div>

              {/* Guidance Scale */}
              <div className="space-y-2">
                <Label htmlFor="guidance-scale">Guidance Scale</Label>
                <Input
                  id="guidance-scale"
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidanceScale}
                  onChange={handleGuidanceScaleChange}
                  disabled={disabled}
                  aria-describedby="guidance-help"
                />
                <p className="text-xs text-muted-foreground" id="guidance-help">
                  How closely to follow the prompt (1-20, default: 7)
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <Label htmlFor="steps">Inference Steps</Label>
                <Input
                  id="steps"
                  type="number"
                  min="10"
                  max="50"
                  value={steps}
                  onChange={handleStepsChange}
                  disabled={disabled}
                  aria-describedby="steps-help"
                />
                <p className="text-xs text-muted-foreground" id="steps-help">
                  More steps = higher quality but slower (10-50, default: 20)
                </p>
              </div>
            </div>

            {/* Negative Prompt */}
            <div className="space-y-2">
              <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
              <Textarea
                id="negative-prompt"
                value={negativePrompt}
                onChange={handleNegativePromptChange}
                placeholder="Describe what you don't want in the image..."
                disabled={disabled}
                rows={3}
                aria-describedby="negative-help"
              />
              <p className="text-xs text-muted-foreground" id="negative-help">
                Specify elements to avoid in the generated images
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button
          onClick={handleGenerateClick}
          onKeyDown={handleKeyDown}
          disabled={disabled || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Creating {variations} image{variations > 1 ? "s" : ""}...
            </>
          ) : (
            `Generate ${variations} Image${variations > 1 ? "s" : ""}`
          )}
        </Button>
      </div>
    </Card>
  )
}
