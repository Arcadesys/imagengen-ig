"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Sparkles, Palette, ArrowRight } from "lucide-react"

interface StyleOption {
  id: string
  name: string
  description: string
  prompt: string
  preview?: string
}

interface Event {
  id: string
  name: string
  active: boolean
}

export default function PhotoBoothPage() {
  const [currentStep, setCurrentStep] = useState<"entry" | "styles">("entry")
  const [styles, setStyles] = useState<StyleOption[]>([])
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(false)

  // Load event and styles data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load current event
        const eventResponse = await fetch("/api/events")
        if (eventResponse.ok) {
          const eventData = await eventResponse.json()
          setCurrentEvent(eventData)
        }

        // Load available styles
        const stylesResponse = await fetch("/api/questions")
        if (stylesResponse.ok) {
          const stylesData = await stylesResponse.json()
          setStyles(stylesData.styles || [])
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [])

  const handleStartBooth = () => {
    setCurrentStep("styles")
  }

  const handleStyleSelect = (style: StyleOption) => {
    setSelectedStyle(style)
    setLoading(true)
    // Navigate to generation flow
    setTimeout(() => {
      window.location.href = `/generate?style=${style.id}`
    }, 500)
  }

  if (currentStep === "entry") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          {/* Event Header */}
          {currentEvent && (
            <div className="mb-8 text-center">
              <Badge variant="secondary" className="mb-2 text-lg px-4 py-2">
                {currentEvent.name}
              </Badge>
            </div>
          )}

          {/* Main Photo Booth Interface */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative bg-white dark:bg-gray-900 rounded-full p-8 shadow-2xl">
                  <Camera className="w-24 h-24 text-purple-600 mx-auto" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 font-fredoka">
              Make Memories
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
              Step into our AI Photo Booth and create magical memories with stunning artistic styles!
            </p>

            <Button
              onClick={handleStartBooth}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-6 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Camera className="w-6 h-6 mr-3" />
              Start Photo Booth
              <Sparkles className="w-6 h-6 ml-3" />
            </Button>
          </div>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Palette className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Choose Your Style</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Pick from amazing artistic styles to transform your photo
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">AI Magic</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Watch as AI transforms your photo into a work of art
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Camera className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Share & Save</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Get your photo via QR code or email to share with friends
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Style Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-fredoka">
            Choose Your Style
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Select an artistic style to transform your photo</p>
        </div>

        {/* Style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {styles.map((style) => (
            <Card
              key={style.id}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
              onClick={() => handleStyleSelect(style)}
            >
              <CardContent className="p-6">
                {style.preview && (
                  <div className="w-full h-48 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 rounded-lg mb-4 flex items-center justify-center">
                    <Palette className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                  </div>
                )}

                <h3 className="font-semibold text-xl mb-2 text-center">{style.name}</h3>

                <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-4">{style.description}</p>

                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  disabled={loading && selectedStyle?.id === style.id}
                >
                  {loading && selectedStyle?.id === style.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Select Style
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => setCurrentStep("entry")} className="px-8">
            Back to Start
          </Button>
        </div>
      </div>
    </div>
  )
}
