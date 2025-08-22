"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Upload, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { uploadImageViaApi } from "@/lib/client-upload"

interface ImageUploadProps {
  onUpload: (baseImageId: string, url: string) => void
  onRemove: () => void
  uploadedImage?: { id: string; url: string } | null
  disabled?: boolean
  sessionId?: string | null
}

export function ImageUpload({ onUpload, onRemove, uploadedImage, disabled, sessionId }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (disabled) return

      // Validate file type (broader set; server will convert HEIC/AVIF to webp)
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/heic",
        "image/heif",
        "image/avif",
      ]
    if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
      description: "Only PNG, JPEG, WebP, HEIC/HEIF, and AVIF files are allowed.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB.",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)

      try {
        const result = await uploadImageViaApi(file, file.name || "upload.png", sessionId || undefined)
        onUpload(result.baseImageId, result.url)

        toast({
          title: "Upload successful",
          description: "Your base image has been uploaded.",
        })
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload image.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [disabled, onUpload, toast, sessionId],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled || isUploading) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [disabled, isUploading, handleFileUpload],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !isUploading) {
        setIsDragOver(true)
      }
    },
    [disabled, isUploading],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled && !isUploading) {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    },
    [disabled, isUploading],
  )

  const handleRemove = useCallback(() => {
    onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onRemove])

  const handleRemoveKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleRemove()
      }
    },
    [handleRemove],
  )

  if (uploadedImage) {
    return (
      <Card className="relative overflow-hidden">
        <div className="aspect-square relative">
          <img
            src={
              uploadedImage.url ||
              "/placeholder.svg?height=400&width=400&query=uploaded%20base%20image" ||
              "/placeholder.svg"
            }
            alt="Uploaded base image for generation"
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
            onKeyDown={handleRemoveKeyDown}
            disabled={disabled}
            aria-label="Remove uploaded image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Base image uploaded. This will be used for image-to-image generation.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors cursor-pointer",
        isDragOver && "border-primary bg-primary/5",
        disabled && "opacity-50 cursor-not-allowed",
        isUploading && "cursor-wait",
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label="Upload base image for generation"
      aria-describedby="upload-description"
    >
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">Uploading image...</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              {isDragOver ? (
                <ImageIcon className="h-6 w-6 text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="font-medium mb-2">{isDragOver ? "Drop image here" : "Upload base image"}</h3>
            <p className="text-sm text-muted-foreground mb-4" id="upload-description">
              Drop a base image or click to upload
              <br />
              PNG, JPEG, WebP, HEIC/HEIF, AVIF • Max 10MB
            </p>
            <Button variant="outline" size="sm" disabled={disabled}>
              Choose File
            </Button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif,image/avif"
        onChange={handleFileSelect}
        className="sr-only"
        disabled={disabled}
        aria-describedby="upload-description"
      />
    </Card>
  )
}
