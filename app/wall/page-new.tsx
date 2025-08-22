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

export default function LiveWallPage() {
  const [transformations, setTransformations] = useState<WallTransformation[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-advance settings
  const DISPLAY_DURATION = 8000 // 8 seconds per transformation
  const TRANSITION_DURATION = 2000 // 2 seconds for wipe transition

  // Load transformations from API
  const loadTransformations = async () => {
    try {
      const response = await fetch("/api/wall")
      if (response.ok) {
        const data = await response.json()
        setTransformations(data.transformations || [])
      }
    } catch (error) {
      console.error("Failed to load transformations:", error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize and set up auto-refresh
  useEffect(() => {
    loadTransformations()
    const refreshInterval = setInterval(loadTransformations, 30000) // Refresh every 30 seconds
    return () => clearInterval(refreshInterval)
  }, [])

  // Auto-advance slideshow
  useEffect(() => {
    if (transformations.length === 0) return

    const showTransition = () => {
      setIsTransitioning(true)
      setShowAfter(true)
    }

    const advanceSlide = () => {
      setIsTransitioning(false)
      setShowAfter(false)
      setCurrentIndex((prev) => (prev + 1) % transformations.length)
    }

    // Show before image for 4 seconds, then transition to after
    const beforeTimer = setTimeout(showTransition, 4000)
    
    // Show after image for 4 seconds, then advance to next
    const afterTimer = setTimeout(advanceSlide, DISPLAY_DURATION)

    return () => {
      clearTimeout(beforeTimer)
      clearTimeout(afterTimer)
    }
  }, [currentIndex, transformations.length])

  // Loading state
  if (loading || transformations.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
        <div className="text-center text-white">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gray-900 rounded-full p-12 shadow-2xl">
              <Sparkles className="w-24 h-24 text-purple-400 mx-auto animate-spin" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4 font-fredoka">
            {loading ? "Loading Transformations..." : "Waiting for Transformations..."}
          </h1>
          <p className="text-2xl text-gray-400">
            {loading ? "Gathering amazing photos" : "Create your first AI transformation"}
          </p>
        </div>
      </div>
    )
  }

  const currentTransformation = transformations[currentIndex]

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative">
      {/* Main Image Display */}
      <div className="relative h-full w-full">
        {/* Before Image */}
        <div
          className={`absolute inset-0 transition-all duration-1000 ${
            showAfter ? "opacity-0" : "opacity-100"
          }`}
        >
          <img
            src={currentTransformation.beforeImageUrl}
            alt="Original photo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* After Image with Wipe Effect */}
        <div
          className={`absolute inset-0 transition-all duration-2000 ease-in-out ${
            showAfter ? "opacity-100" : "opacity-0"
          }`}
          style={{
            clipPath: showAfter 
              ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" 
              : "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
          }}
        >
          <img
            src={currentTransformation.afterImageUrl}
            alt={`AI transformed to ${currentTransformation.style}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Animated Wipe Overlay */}
        {isTransitioning && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-20 animate-pulse"
            style={{
              animation: "wipeRight 2s ease-in-out",
            }}
          />
        )}
      </div>

      {/* Status Indicators */}
      <div className="absolute top-8 left-8 z-20">
        <Badge 
          variant="secondary" 
          className="text-2xl px-6 py-3 bg-black/70 text-white border-0 backdrop-blur-sm"
        >
          {showAfter ? "AFTER" : "BEFORE"}
        </Badge>
      </div>

      <div className="absolute top-8 right-8 z-20">
        <Badge 
          variant="secondary" 
          className="text-2xl px-6 py-3 bg-purple-600/80 text-white border-0 backdrop-blur-sm"
        >
          {currentTransformation.style.toUpperCase()}
        </Badge>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-8 right-8 z-20">
        <div className="flex items-center justify-between text-white">
          <div className="text-xl">
            <span className="text-purple-400">{currentIndex + 1}</span> / {transformations.length}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-lg">LIVE</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-100"
            style={{ 
              width: `${((currentIndex + (showAfter ? 0.5 : 0)) / transformations.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Transformation Details Overlay */}
      {showAfter && currentTransformation.prompt && (
        <div className="absolute bottom-20 left-8 right-8 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-6 text-white">
            <p className="text-lg line-clamp-2">
              {currentTransformation.prompt}
            </p>
          </div>
        </div>
      )}

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes wipeRight {
          from {
            clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%);
          }
          to {
            clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          }
        }
      `}</style>
    </div>
  )
}
