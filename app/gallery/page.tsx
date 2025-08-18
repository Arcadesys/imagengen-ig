"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { LiveRegion } from "@/components/accessibility/live-region"
import { AltTextInput } from "@/components/alt-text-input"
import { useToast } from "@/hooks/use-toast"
import { ImageIcon, ArrowLeft, Trash2, RotateCcw, Calendar, Palette, Eye, Download, Edit } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { GalleryImage } from "@/lib/types"

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [editForm, setEditForm] = useState({ prompt: "", expandedPrompt: "" })
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [liveMessage, setLiveMessage] = useState("")
  const [imageAltTexts, setImageAltTexts] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedImage) {
        setSelectedImage(null)
      }

      if (e.key === "Delete" && selectedImages.size > 0 && !selectedImage) {
        e.preventDefault()
        handleBulkDelete()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a" && !selectedImage) {
        e.preventDefault()
        handleSelectAll(selectedImages.size !== images.length)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedImages, images.length, selectedImage])

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const response = await fetch("/api/gallery")
        if (!response.ok) {
          throw new Error("Failed to load gallery")
        }
        const galleryImages = await response.json()
        setImages(galleryImages)
        setLiveMessage(`Gallery loaded with ${galleryImages.length} images`)
      } catch (error) {
        console.error("Error loading gallery:", error)
        setLiveMessage("Failed to load gallery")
        toast({
          title: "Failed to load gallery",
          description: "Please refresh the page to try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGallery()
  }, [toast])

  const handleImageSelect = useCallback((imageId: string, selected: boolean) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(imageId)
      } else {
        newSet.delete(imageId)
      }
      setLiveMessage(`${selected ? "Selected" : "Deselected"} image. ${newSet.size} images selected.`)
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedImages(new Set(images.map((img) => img.id)))
        setLiveMessage(`Selected all ${images.length} images`)
      } else {
        setSelectedImages(new Set())
        setLiveMessage("Deselected all images")
      }
    },
    [images],
  )

  const handleBulkDelete = useCallback(async () => {
    if (selectedImages.size === 0) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedImages.size} image(s)? This action cannot be undone.`,
    )
    if (!confirmDelete) return

    setIsDeleting(true)
    setLiveMessage(`Deleting ${selectedImages.size} images...`)

    try {
      const deletePromises = Array.from(selectedImages).map((imageId) =>
        fetch(`/api/images/${imageId}`, { method: "DELETE" }),
      )

      await Promise.all(deletePromises)

      setImages((prev) => prev.filter((img) => !selectedImages.has(img.id)))
      setSelectedImages(new Set())
      setLiveMessage(`Successfully deleted ${selectedImages.size} images`)

      toast({
        title: "Images deleted",
        description: `${selectedImages.size} image(s) removed from gallery.`,
      })
    } catch (error) {
      console.error("Error deleting images:", error)
      setLiveMessage("Failed to delete some images")
      toast({
        title: "Delete failed",
        description: "Some images could not be deleted. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }, [selectedImages, toast])

  const handleSingleDelete = useCallback(
    async (imageId: string) => {
      const confirmDelete = window.confirm("Are you sure you want to delete this image? This action cannot be undone.")
      if (!confirmDelete) return

      try {
        const response = await fetch(`/api/images/${imageId}`, { method: "DELETE" })
        if (!response.ok) {
          throw new Error("Failed to delete image")
        }

        setImages((prev) => prev.filter((img) => img.id !== imageId))
        setSelectedImages((prev) => {
          const newSet = new Set(prev)
          newSet.delete(imageId)
          return newSet
        })
        setLiveMessage("Image deleted successfully")

        toast({
          title: "Image deleted",
          description: "Image removed from gallery.",
        })
      } catch (error) {
        console.error("Error deleting image:", error)
        setLiveMessage("Failed to delete image")
        toast({
          title: "Delete failed",
          description: "Could not delete image. Please try again.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleReusePrompt = useCallback(
    (image: GalleryImage) => {
      const reuseData = {
        prompt: image.prompt,
        size: image.size,
        seed: image.seed,
        baseImageId: image.baseImageId,
      }
      sessionStorage.setItem("reusePrompt", JSON.stringify(reuseData))
      setLiveMessage("Prompt settings saved. Redirecting to generator...")
      router.push("/")
    },
    [router],
  )

  const handleDownload = useCallback(
    async (image: GalleryImage) => {
      try {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `gallery-${image.id}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setLiveMessage("Image download started")
      } catch (error) {
        console.error("Download failed:", error)
        setLiveMessage("Download failed")
        toast({
          title: "Download failed",
          description: "Could not download image. Please try again.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleAltTextSave = useCallback((imageId: string, altText: string) => {
    setImageAltTexts((prev) => ({ ...prev, [imageId]: altText }))
    setLiveMessage("Alt text saved for accessibility")
  }, [])

  const handleEditImage = useCallback((image: GalleryImage) => {
    setEditingImage(image)
    setEditForm({
      prompt: image.prompt,
      expandedPrompt: image.expandedPrompt || "",
    })
    setSelectedImage(null) // Close detail view
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingImage) return

    setIsSaving(true)
    setLiveMessage("Saving image changes...")

    try {
      const response = await fetch(`/api/images/${editingImage.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: editForm.prompt,
          expandedPrompt: editForm.expandedPrompt || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update image")
      }

      const updatedImage = await response.json()

      setImages((prev) => prev.map((img) => (img.id === editingImage.id ? { ...img, ...updatedImage } : img)))

      setEditingImage(null)
      setLiveMessage("Image updated successfully")

      toast({
        title: "Image updated",
        description: "Image details have been saved.",
      })
    } catch (error) {
      console.error("Error updating image:", error)
      setLiveMessage("Failed to update image")
      toast({
        title: "Update failed",
        description: "Could not update image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [editingImage, editForm, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card" role="banner">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Generate
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Gallery</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8" role="main">
          <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true" />
            <span className="sr-only">Loading gallery...</span>
          </div>
        </main>
      </div>
    )
  }

  return (
    <>
      <LiveRegion message={liveMessage} />

      <div className="min-h-screen bg-background">
        <header className="border-b bg-card" role="banner">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Generate
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold">Gallery</h1>
                <Badge variant="secondary" aria-label={`${images.length} images in gallery`}>
                  {images.length} images
                </Badge>
              </div>

              {selectedImages.size > 0 && (
                <div className="flex items-center gap-2" role="toolbar" aria-label="Bulk actions">
                  <span className="text-sm text-muted-foreground" aria-live="polite">
                    {selectedImages.size} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    aria-label={`Delete ${selectedImages.size} selected images`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Selected"}
                  </Button>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Checkbox
                  id="select-all"
                  checked={selectedImages.size === images.length}
                  onCheckedChange={handleSelectAll}
                  aria-describedby="select-all-help"
                />
                <label htmlFor="select-all" className="text-sm cursor-pointer">
                  Select all images
                </label>
                <span id="select-all-help" className="sr-only">
                  Use Ctrl+A or Cmd+A to select all images, Delete key to delete selected images
                </span>
              </div>
            )}
          </div>
        </header>

        <main className="container mx-auto px-4 py-8" role="main">
          {images.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                <h2 className="text-xl font-medium mb-2">No images in gallery</h2>
                <p className="text-muted-foreground mb-6">Generate some images and save them to see them here.</p>
                <Link href="/">
                  <Button>
                    <Palette className="h-4 w-4 mr-2" />
                    Start Generating
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              role="grid"
              aria-label="Gallery images"
            >
              {images.map((image, index) => {
                const altText = imageAltTexts[image.id] || (image.expandedPrompt || image.prompt).slice(0, 100)

                return (
                  <Card key={image.id} className="overflow-hidden group" role="gridcell">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedImages.has(image.id)}
                        onCheckedChange={(checked) => handleImageSelect(image.id, checked as boolean)}
                        className="bg-background/80 backdrop-blur-sm"
                        aria-label={`Select image ${index + 1}`}
                      />
                    </div>

                    <div className="aspect-square relative cursor-pointer" onClick={() => setSelectedImage(image)}>
                      <img
                        src={
                          image.url ||
                          "https://example.com/v0-placeholder.svg?height=400&width=400&query=generated%20image%20placeholder" ||
                          "/placeholder.svg"
                        }
                        alt={altText}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary" aria-label={`View full size image ${index + 1}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>

                      {image.baseImageId && (
                        <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700">Base Image Used</Badge>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <p
                          className="text-sm font-medium line-clamp-2 mb-1"
                          title={image.expandedPrompt || image.prompt}
                        >
                          {image.expandedPrompt || image.prompt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          <time dateTime={image.createdAt}>{formatDate(image.createdAt)}</time>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {image.size}
                        </Badge>
                        {image.seed && (
                          <Badge variant="outline" className="text-xs">
                            Seed: {image.seed}
                          </Badge>
                        )}
                      </div>

                      <AltTextInput
                        imageUrl={image.url}
                        currentAltText={imageAltTexts[image.id] || ""}
                        onSave={(altText) => handleAltTextSave(image.id, altText)}
                      />

                      <div className="flex gap-2" role="group" aria-label={`Actions for image ${index + 1}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReusePrompt(image)}
                          className="flex-1"
                          aria-label={`Re-use prompt from image ${index + 1}`}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Re-use
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditImage(image)}
                          aria-label={`Edit image ${index + 1}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSingleDelete(image.id)}
                          aria-label={`Delete image ${index + 1}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl" aria-labelledby="image-detail-title">
            <DialogHeader>
              <DialogTitle id="image-detail-title">Image Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={
                    selectedImage.url ||
                    "https://example.com/v0-placeholder.svg?height=600&width=600&query=full%20size%20generated%20image" ||
                    "/placeholder.svg"
                  }
                  alt={imageAltTexts[selectedImage.id] || selectedImage.prompt}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Prompt</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedImage.expandedPrompt || selectedImage.prompt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-muted-foreground">
                      <time dateTime={selectedImage.createdAt}>{formatDate(selectedImage.createdAt)}</time>
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>
                    <p className="text-muted-foreground">{selectedImage.size}</p>
                  </div>
                  {selectedImage.seed && (
                    <div>
                      <span className="font-medium">Seed:</span>
                      <p className="text-muted-foreground">{selectedImage.seed}</p>
                    </div>
                  )}
                  {selectedImage.baseImageId && (
                    <div>
                      <span className="font-medium">Base Image:</span>
                      <p className="text-muted-foreground">Used for generation</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t" role="group" aria-label="Image actions">
                <Button onClick={() => handleReusePrompt(selectedImage)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Re-use Prompt
                </Button>
                <Button variant="outline" onClick={() => handleEditImage(selectedImage)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleSingleDelete(selectedImage.id)
                    setSelectedImage(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingImage && (
        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent className="max-w-2xl" aria-labelledby="edit-image-title">
            <DialogHeader>
              <DialogTitle id="edit-image-title">Edit Image Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={editingImage.url || "/placeholder.svg?height=300&width=300&query=editing%20image%20preview"}
                  alt={editingImage.prompt}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-prompt">Prompt</Label>
                  <Textarea
                    id="edit-prompt"
                    value={editForm.prompt}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Enter the main prompt..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-expanded-prompt">Expanded Prompt (Optional)</Label>
                  <Textarea
                    id="edit-expanded-prompt"
                    value={editForm.expandedPrompt}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, expandedPrompt: e.target.value }))}
                    placeholder="Enter detailed or expanded prompt..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-3 rounded-lg">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-muted-foreground">
                      <time dateTime={editingImage.createdAt}>{formatDate(editingImage.createdAt)}</time>
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>
                    <p className="text-muted-foreground">{editingImage.size}</p>
                  </div>
                  {editingImage.seed && (
                    <div>
                      <span className="font-medium">Seed:</span>
                      <p className="text-muted-foreground">{editingImage.seed}</p>
                    </div>
                  )}
                  {editingImage.baseImageId && (
                    <div>
                      <span className="font-medium">Base Image:</span>
                      <p className="text-muted-foreground">Used for generation</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t" role="group" aria-label="Edit actions">
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setEditingImage(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
