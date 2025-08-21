"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface WallTransformation {
  id: string
  beforeImageUrl: string
  afterImageUrl: string
  style: string
  prompt?: string
  timestamp: string
}

interface EventData {
  id: string
  name: string
  active: boolean
  photoCount: number
}

export default function LiveWallPage() {
  const [transformations, setTransformations] = useState<WallTransformation[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-advance settings
  const DISPLAY_DURATION = 8000 // 8 seconds per transformation
  const TRANSITION_DURATION = 2000 // 2 seconds for wipe transition

  // Load transformations and event data
  const loadWallData = async () => {
    try {
      // Load current event
      const eventResponse = await fetch("/api/events")
      if (eventResponse.ok) {
        const eventData = await eventResponse.json()
        setCurrentEvent(eventData)
      }

      // Load wall transformations
      const wallResponse = await fetch("/api/wall")
      if (wallResponse.ok) {
        const wallData = await wallResponse.json()
        setTransformations(wallData.transformations || [])
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

  if (loading && transformations.length === 0) {
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
            Loading Transformation Wall...
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
                Live Transformation Wall
              </h1>
              {currentEvent && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-sm">
                    {currentEvent.name}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {transformations.length} transformations
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

      {/* Transformation Grid */}
      <div className="container mx-auto px-4 py-8">
        {transformations.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <Camera className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Transformations Yet</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Be the first to create an amazing AI transformation! Upload a photo and watch the magic happen.
              </p>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 rounded-full"
            >
              <Camera className="w-5 h-5 mr-3" />
              Start Creating
              <Sparkles className="w-5 h-5 ml-3" />
            </Button>
          </div>
        ) : (
          <>
            {/* Masonry Grid of Before/After Transformations */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {transformations.map((transformation, index) => (
                <Card
                  key={transformation.id}
                  className="break-inside-avoid bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  onClick={() => window.open(`/share/${transformation.id}`, "_blank")}
                >
                  <CardContent className="p-0">
                    {/* Before/After Images Container */}
                    <div className="relative">
                      {/* Before Image */}
                      <div className="relative">
                        <img
                          src={transformation.beforeImageUrl || "/placeholder.svg"}
                          alt="Original photo"
                          className="w-full h-auto object-cover rounded-t-lg"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                            BEFORE
                          </Badge>
                        </div>
                      </div>

                      {/* Arrow/Divider */}
                      <div className="flex items-center justify-center py-2 bg-gradient-to-r from-pink-500 to-purple-600">
                        <div className="text-white text-xs font-medium">
                          ↓ AI TRANSFORMATION ↓
                        </div>
                      </div>

                      {/* After Image */}
                      <div className="relative">
                        <img
                          src={transformation.afterImageUrl || "/placeholder.svg"}
                          alt={`AI transformed to ${transformation.style} style`}
                          className="w-full h-auto object-cover rounded-b-lg"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs bg-black/50 text-white border-0">
                            {transformation.style.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs bg-green-600 text-white border-0">
                            AFTER
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(transformation.timestamp).toLocaleTimeString()}</span>
                        <Sparkles className="w-3 h-3" />
                      </div>
                      {transformation.prompt && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {transformation.prompt}
                        </p>
                      )}
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
                      <span className="font-semibold text-purple-600">{transformations.length}</span>
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
