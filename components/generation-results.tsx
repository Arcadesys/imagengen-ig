"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Save, Trash2, Eye, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GeneratedImage } from "@/lib/types"

interface GenerationResultsProps {
  images: GeneratedImage[]
  onSave: (image: GeneratedImage) => void
  onDiscard: (imageId: string) => void
}

export function GenerationResults({ images, onSave, onDiscard }: GenerationResultsProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set())

  const handleSave = useCallback(
    (image: GeneratedImage) => {
      onSave(image)
      setSavedImages((prev) => new Set(prev).add(image.id))
    },
    [onSave],
  )

  const handleDiscard = useCallback(
    (imageId: string) => {
      onDiscard(imageId)
      setSavedImages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(imageId)
        return newSet
      })
    },
    [onDiscard],
  )

  const handleView = useCallback((image: GeneratedImage) => {
    setSelectedImage(image)
  }, [])

  const handleDownload = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `generated-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      action()
    }
  }, [])

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => {
          const isSaved = savedImages.has(image.id)

          return (
            <Card key={image.id} className="overflow-hidden group">
              <div className="aspect-square relative">
                <img
                  src={image.url || "/placeholder.svg"}
                  alt={`Generated image ${index + 1}: ${image.metadata.prompt.slice(0, 50)}...`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleView(image)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleView(image))}
                      aria-label={`View full size image ${index + 1}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(image)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleDownload(image))}
                      aria-label={`Download image ${index + 1}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Saved badge */}
                {isSaved && <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">Saved</Badge>}
              </div>

              {/* Actions */}
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSave(image)}
                    disabled={isSaved}
                    className={cn("flex-1", isSaved && "opacity-50")}
                    aria-label={`Save image ${index + 1} to gallery`}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDiscard(image.id)}
                    aria-label={`Discard image ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="truncate" title={image.metadata.prompt}>
                    {image.metadata.prompt}
                  </p>
                  <p className="mt-1">
                    {image.metadata.size} • {image.metadata.provider}
                    {image.metadata.seed && ` • Seed: ${image.metadata.seed}`}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Full size view dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generated Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage.url || "/placeholder.svg"}
                  alt={`Full size view: ${selectedImage.metadata.prompt}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Prompt:</strong> {selectedImage.metadata.prompt}
                </p>
                <p className="text-sm text-muted-foreground">
                  Size: {selectedImage.metadata.size} • Provider: {selectedImage.metadata.provider}
                  {selectedImage.metadata.seed && ` • Seed: ${selectedImage.metadata.seed}`}
                  {selectedImage.metadata.baseImageId && " • Used base image"}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => selectedImage && handleSave(selectedImage)}
                  disabled={savedImages.has(selectedImage.id)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savedImages.has(selectedImage.id) ? "Saved to Gallery" : "Save to Gallery"}
                </Button>
                <Button variant="outline" onClick={() => selectedImage && handleDownload(selectedImage)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
