"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface WallTransformation {
  id: string
  beforeImageUrl: string
  afterImageUrl: string
  style: string
  prompt?: string
  timestamp: string
  session?: {
    id: string
    name: string
    generator: string
    createdAt: string
  } | null
}

function LiveWallContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  
  const [transformations, setTransformations] = useState<WallTransformation[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<{
    name: string
    generator: string
  } | null>(null)

  // Auto-advance settings
  const DISPLAY_DURATION = 8000 // 8 seconds per transformation
  const TRANSITION_DURATION = 2000 // 2 seconds for wipe transition

  // Load transformations from API
  const loadTransformations = async () => {
    try {
      const url = sessionId ? `/api/wall?session=${sessionId}` : "/api/wall"
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const transformations = data.transformations || []
        setTransformations(transformations)
        
        // Set session info if filtering by session
        if (sessionId && transformations.length > 0 && transformations[0].session) {
          setSessionInfo({
            name: transformations[0].session.name,
            generator: transformations[0].session.generator
          })
        } else {
          setSessionInfo(null)
        }
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
    
    // Keyboard shortcuts for TV control
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'f':
        case 'F':
          // Toggle fullscreen
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen()
          }
          break
        case ' ':
          // Space bar to advance manually
          event.preventDefault()
          setCurrentIndex((prev) => (prev + 1) % transformations.length)
          setShowAfter(false)
          setIsTransitioning(false)
          break
        case 'ArrowRight':
          // Right arrow to advance
          event.preventDefault()
          setCurrentIndex((prev) => (prev + 1) % transformations.length)
          setShowAfter(false)
          setIsTransitioning(false)
          break
        case 'ArrowLeft':
          // Left arrow to go back
          event.preventDefault()
          setCurrentIndex((prev) => (prev - 1 + transformations.length) % transformations.length)
          setShowAfter(false)
          setIsTransitioning(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    // Hide instructions after 5 seconds
    const instructionsTimer = setTimeout(() => {
      setShowInstructions(false)
    }, 5000)
    
    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(instructionsTimer)
    }
  }, [transformations.length])

  // Auto-advance slideshow
  useEffect(() => {
    if (transformations.length === 0) return

    const showTransition = () => {
      setIsTransitioning(true)
      // Start the wipe transition after a brief delay
      setTimeout(() => setShowAfter(true), 300)
    }

    const advanceSlide = () => {
      setIsTransitioning(false)
      setShowAfter(false)
      setCurrentIndex((prev) => (prev + 1) % transformations.length)
    }

    // Show before image for 5 seconds, then transition to after
    const beforeTimer = setTimeout(showTransition, 5000)
    
    // Show after image for 3 seconds, then advance to next
    const afterTimer = setTimeout(advanceSlide, DISPLAY_DURATION)

    return () => {
      clearTimeout(beforeTimer)
      clearTimeout(afterTimer)
    }
  }, [currentIndex, transformations.length, DISPLAY_DURATION])

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
            showAfter ? "opacity-0 scale-105" : "opacity-100 scale-100"
          }`}
        >
          <img
            src={currentTransformation.beforeImageUrl}
            alt="Original photo"
            className="w-full h-full object-contain animate-fade-in"
            key={`before-${currentIndex}`}
          />
          
          {/* Subtle overlay for dramatic effect */}
          {!showAfter && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
          )}
        </div>

        {/* After Image with Wipe Effect */}
        <div
          className={`absolute inset-0 transition-all ease-in-out ${
            showAfter ? "animate-wipe-in" : "animate-wipe-out"
          }`}
        >
          <img
            src={currentTransformation.afterImageUrl}
            alt={`AI transformed to ${currentTransformation.style}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Dramatic Reveal Effect */}
        {isTransitioning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Sparkle particles */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 animate-pulse" />
            
            {/* Moving wipe line */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white to-transparent animate-wipe-line"
              style={{
                boxShadow: "0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(147, 51, 234, 0.6)"
              }}
            />
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
        {sessionId && (
          <Button
            asChild
            variant="secondary"
            className="bg-black/70 text-white border-0 backdrop-blur-sm hover:bg-black/80"
          >
            <Link href="/sessions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
          </Button>
        )}
        
        <Badge 
          variant="secondary" 
          className="text-2xl px-6 py-3 bg-black/70 text-white border-0 backdrop-blur-sm"
        >
          {showAfter ? "AFTER" : "BEFORE"}
        </Badge>
        
        {sessionInfo && (
          <Badge 
            variant="outline" 
            className="text-lg px-4 py-2 bg-black/70 text-white border-white/20 backdrop-blur-sm"
          >
            {sessionInfo.name}
          </Badge>
        )}
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

      {/* TV Control Instructions */}
      {showInstructions && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="bg-black/80 backdrop-blur-sm rounded-xl p-8 text-white text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-purple-400">TV Wall Controls</h2>
            <div className="space-y-2 text-lg">
              <p><kbd className="bg-gray-700 px-2 py-1 rounded">F</kbd> - Toggle Fullscreen</p>
              <p><kbd className="bg-gray-700 px-2 py-1 rounded">Space</kbd> or <kbd className="bg-gray-700 px-2 py-1 rounded">→</kbd> - Next</p>
              <p><kbd className="bg-gray-700 px-2 py-1 rounded">←</kbd> - Previous</p>
            </div>
            <p className="text-sm text-gray-400 mt-4">This message will disappear in 5 seconds</p>
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
        
        @keyframes wipeIn {
          from {
            clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%);
            filter: brightness(1.5) saturate(1.3);
          }
          to {
            clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
            filter: brightness(1) saturate(1);
          }
        }
        
        @keyframes wipeOut {
          from {
            clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
          }
          to {
            clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%);
          }
        }
        
        @keyframes wipeLine {
          from {
            left: -2px;
          }
          to {
            left: 100%;
          }
        }
        
        .animate-wipe-in {
          animation: wipeIn 2s ease-out forwards;
        }
        
        .animate-wipe-out {
          animation: wipeOut 0.5s ease-in forwards;
        }
        
        .animate-wipe-line {
          animation: wipeLine 2s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
      `}</style>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Loading Wall</h1>
        <p className="text-gray-400">Preparing transformation display...</p>
      </div>
    </div>
  )
}

export default function LiveWallPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LiveWallContent />
    </Suspense>
  )
}
