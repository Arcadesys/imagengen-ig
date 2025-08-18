"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Describe what to make...",
}: PromptInputProps) {
  const [charCount, setCharCount] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setCharCount(value.length)
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      onChange(newValue)
      setCharCount(newValue.length)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !disabled) {
        e.preventDefault()
        onSubmit()
      }
    },
    [onSubmit, disabled],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit()
      }
    },
    [onSubmit, disabled, value],
  )

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="prompt-input" className="text-sm font-medium">
            Prompt
          </Label>
          <div className="relative">
            <Textarea
              ref={textareaRef}
              id="prompt-input"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[100px] resize-none pr-16"
              aria-describedby="prompt-help char-count"
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground" id="char-count" aria-live="polite">
              {charCount}
            </div>
          </div>
          <p className="text-xs text-muted-foreground" id="prompt-help">
            Press Ctrl+Enter (Cmd+Enter on Mac) to generate
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={disabled || !value.trim()} className="flex-1">
            Generate 4 Images
          </Button>
        </div>
      </form>
    </Card>
  )
}
