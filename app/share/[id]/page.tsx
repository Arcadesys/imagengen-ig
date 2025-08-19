"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Camera } from "lucide-react"

interface PhotoData {
  id: string
  imageUrl: string
  style: string
  timestamp: string
  email?: string
}

export default function SharePhotoPage() {
  const params = useParams()
  const photoId = params.id as string

  const [photo, setPhoto] = useState<PhotoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPhoto = async () => {
      try {
        const response = await fetch(`/api/photo/${photoId}`)
        if (response.ok) {
          const photoData = await response.json()
          setPhoto(photoData)
        } else {
          setError("Photo not found")
        }
      } catch (err) {
        setError("Failed to load photo")
      } finally {
        setLoading(false)
      }
    }

    if (photoId) {
      loadPhoto()
    }
  }, [photoId])

  const downloadPhoto = () => {
    if (photo?.imageUrl) {
      const link = document.createElement("a")
      link.href = photo.imageUrl
      link.download = `ai-photo-${photo.id}.png`
      link.click()
    }
  }

  const sharePhoto = async () => {
    if (navigator.share && photo) {
      try {
        await navigator.share({
          title: "Check out my AI Photo!",
          text: "I created this amazing photo at the AI Photo Booth",
          url: window.location.href,
        })
      } catch (err) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading photo...</p>
        </div>
      </div>
    )
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950 flex items-center justify-center">
        <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Photo Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The photo you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Try the Photo Booth
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-fredoka">
              AI Photo Booth
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Created with {photo.style} style • {new Date(photo.timestamp).toLocaleDateString()}
            </p>
          </div>

          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="relative mb-6">
                <img
                  src={photo.imageUrl || "/placeholder.svg"}
                  alt="AI generated photo"
                  className="w-full h-96 object-cover rounded-lg shadow-lg"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={downloadPhoto}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Photo
                </Button>

                <Button onClick={sharePhoto} variant="outline" className="px-6 py-3 bg-transparent">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Photo
                </Button>
              </div>

              <div className="text-center mt-6">
                <Button
                  variant="ghost"
                  onClick={() => (window.location.href = "/")}
                  className="text-gray-600 dark:text-gray-300"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Create Your Own Photo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
