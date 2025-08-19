"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Camera, Users, Sparkles, RefreshCw } from "lucide-react"

interface WallPhoto {
  id: string
  imageUrl: string
  style: string
  timestamp: string
  email?: string
}

interface EventData {
  id: string
  name: string
  active: boolean
  photoCount: number
}

export default function LiveWallPage() {
  const [photos, setPhotos] = useState<WallPhoto[]>([])
  const [currentEvent, setCurrentEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load photos and event data
  const loadWallData = async () => {
    try {
      // Load current event
      const eventResponse = await fetch("/api/events")
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setCurrentEvent(eventData)
      }

      // Load wall photos
      const wallResponse = await fetch("/api/wall")
      if (wallResponse.ok) {
        const wallData = await wallResponse.json()
        setPhotos(wallData.photos || [])
      }
    } catch (error) {
      console.error("Failed to load wall data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallData()
  }, [])

  // Auto-refresh every 10 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadWallData()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  const manualRefresh = () => {
    setLoading(true)
    loadWallData()
  }

  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative bg-white dark:bg-gray-900 rounded-full p-8 shadow-2xl">
              <Sparkles className="w-16 h-16 text-purple-600 mx-auto animate-spin" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-fredoka">
            Loading Photo Wall...
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Gathering all the amazing photos</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-fredoka">
                Live Photo Wall
              </h1>
              {currentEvent && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {currentEvent.name}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {photos.length} photos
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRefresh}
                className={autoRefresh ? "bg-green-100 text-green-700 border-green-300" : ""}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto Refresh {autoRefresh ? "ON" : "OFF"}
              </Button>

              <Button variant="outline" size="sm" onClick={manualRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                size="sm"
              >
                <Camera className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="container mx-auto px-4 py-8">
        {photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <Camera className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Photos Yet</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Be the first to create an amazing AI photo! The wall will come alive as people use the photo booth.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-full"
            >
              <Camera className="w-5 h-5 mr-3" />
              Start the Photo Booth
              <Sparkles className="w-5 h-5 ml-3" />
            </Button>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {photos.map((photo, index) => (
                <Card
                  key={photo.id}
                  className="break-inside-avoid bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  onClick={() => window.open(`/share/${photo.id}`, "_blank")}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={photo.imageUrl || "/placeholder.svg"}
                        alt={`AI photo in ${photo.style} style`}
                        className="w-full h-auto object-cover rounded-t-lg"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                          {photo.style}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(photo.timestamp).toLocaleTimeString()}</span>
                        <Sparkles className="w-3 h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Floating Stats */}
            <div className="fixed bottom-6 right-6 z-10">
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-gray-600 dark:text-gray-300">Live</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-600">{photos.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Projection Mode Toggle */}
      <div className="fixed bottom-6 left-6 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              document.documentElement.requestFullscreen()
            }
          }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl"
        >
          Fullscreen
        </Button>
      </div>
    </div>
  )
}
