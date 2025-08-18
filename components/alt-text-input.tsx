"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Edit3 } from "lucide-react"

interface AltTextInputProps {
  imageUrl: string
  currentAltText?: string
  onSave: (altText: string) => void
  disabled?: boolean
}

export function AltTextInput({ imageUrl, currentAltText = "", onSave, disabled }: AltTextInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [altText, setAltText] = useState(currentAltText)

  const handleSave = useCallback(() => {
    onSave(altText.trim())
    setIsOpen(false)
  }, [altText, onSave])

  const handleCancel = useCallback(() => {
    setAltText(currentAltText)
    setIsOpen(false)
  }, [currentAltText])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        aria-label="Add or edit alt text for accessibility"
      >
        <Edit3 className="h-4 w-4 mr-2" />
        {currentAltText ? "Edit Alt Text" : "Add Alt Text"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Alt Text for Accessibility</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="p-4">
              <img
                src={imageUrl || "https://via.placeholder.com/400x256.png?text=image+for+alt+text+editing"}
                alt="Preview of image for alt text editing"
                className="w-full h-auto max-h-64 object-contain rounded"
              />
            </Card>

            <div className="space-y-2">
              <Label htmlFor="alt-text-input">
                Alt Text
                <span className="text-muted-foreground ml-2">(Describes the image for screen readers)</span>
              </Label>
              <Input
                id="alt-text-input"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe what's in this image..."
                maxLength={250}
                aria-describedby="alt-text-help"
              />
              <p className="text-xs text-muted-foreground" id="alt-text-help">
                Good alt text is concise but descriptive. Avoid starting with "Image of" or "Picture of".
                {altText.length > 0 && ` (${altText.length}/250 characters)`}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Alt Text</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
