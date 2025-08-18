"use client"

import { useState, useCallback } from "react"

interface UploadedImage {
  id: string
  url: string
}

export function useImageUpload() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = useCallback((baseImageId: string, url: string) => {
    setUploadedImage({ id: baseImageId, url })
  }, [])

  const handleRemove = useCallback(() => {
    setUploadedImage(null)
  }, [])

  const clearUpload = useCallback(() => {
    setUploadedImage(null)
  }, [])

  return {
    uploadedImage,
    isUploading,
    handleUpload,
    handleRemove,
    clearUpload,
  }
}
