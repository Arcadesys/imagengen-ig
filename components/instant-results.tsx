"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Save, Share2, Eye, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { GeneratedImage } from "@/lib/types"

interface InstantResultsProps {
  images: GeneratedImage[]
  prompt: string
  onSave?: (image: GeneratedImage) => void
  onDiscard?: (imageId: string) => void
  onClose?: () => void
}

export function InstantResults({ 
  images, 
  prompt, 
  onSave, 
  onDiscard, 
  onClose 
}: InstantResultsProps) {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set())

  const handleSave = (image: GeneratedImage) => {
    onSave?.(image)
    setSavedImages(prev => new Set(prev).add(image.id))
  }

  const handleDiscard = (imageId: string) => {
    onDiscard?.(imageId)
    setSavedImages(prev => {
      const newSet = new Set(prev)
      newSet.delete(imageId)
      return newSet
    })
  }

  const handleDownload = async (image: GeneratedImage) => {
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
  }

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my AI-generated image!",
          text: `Created with prompt: ${prompt}`,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // Could show a toast here
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
      }
    }
  }

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
              ✨ Your images are ready!
            </h2>
            <p className="text-muted-foreground">Generated {images.length} image{images.length > 1 ? 's' : ''}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image, index) => {
            const isSaved = savedImages.has(image.id)
            
            return (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square relative group">
                  <img
                    src={image.url}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover overlay with view button */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelectedImage(image)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4 space-y-3">
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(image)}
                      disabled={isSaved}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(image)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(image)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Prompt Display */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Prompt Used:</h3>
            <p className="text-sm text-muted-foreground">{prompt}</p>
          </CardContent>
        </Card>
      </div>

      {/* Full size view dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generated Image</DialogTitle>
            <DialogDescription>Full size view of your AI-generated image</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage.url}
                  alt="Full size generated image"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleSave(selectedImage)}
                  disabled={savedImages.has(selectedImage.id)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savedImages.has(selectedImage.id) ? "Saved to Gallery" : "Save to Gallery"}
                </Button>
                <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => handleShare(selectedImage)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
