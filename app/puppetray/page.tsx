"use client"

import { useState, useEffect } from "react"
import { EnhancedImageUpload } from "@/components/enhanced-image-upload"
import { WebcamCapture } from "@/components/webcam-capture"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { GenerationResults } from "@/components/generation-results"
import { PuppetConfigurationModal, type PuppetConfiguration } from "@/components/puppet-flow-modal"
import { PuppetGenerationModal } from "@/components/puppet-generation-modal"
import { PuppetResultsModal } from "@/components/puppet-results-modal"
import type { GeneratedImage } from "@/lib/types"
import { generatePuppetPrompt } from "@/lib/puppet-prompts"
import { Camera, Upload, Sparkles } from "lucide-react"

type FlowStep = "upload" | "configure" | "generating" | "results"

export default function PuppetrayPage() {
  const { toast } = useToast()
  const [flowStep, setFlowStep] = useState<FlowStep>("upload")
  const [preferredInputMode, setPreferredInputMode] = useState<"webcam" | "upload" | null>(null)
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null)
  
  // Image state
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [baseImageId, setBaseImageId] = useState<string | null>(null)
  
  // Configuration state
  const [puppetConfig, setPuppetConfig] = useState<PuppetConfiguration | null>(null)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState<"generating" | "complete" | "error">("generating")
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedImage[]>([])

  // Check for webcam availability on mount
  useEffect(() => {
    async function checkWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setHasWebcam(true)
        setPreferredInputMode("webcam")
      } catch {
        setHasWebcam(false)
        setPreferredInputMode("upload")
      }
    }
    checkWebcam()
  }, [])

  const handleImageCapture = (id: string, url: string) => {
    setBaseImageId(id)
    setBaseImage(url)
    setFlowStep("configure")
  }

  const handleConfigurationComplete = (config: PuppetConfiguration) => {
    setPuppetConfig(config)
    setFlowStep("generating")
    startGeneration(config)
  }

  const startGeneration = async (config: PuppetConfiguration) => {
    if (!baseImageId) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus("generating")
    setGenerationError(null)
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 1000)

    try {
      const puppetPrompt = generatePuppetPrompt(config, false)

      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: puppetPrompt,
          size: "1024x1024",
          n: 1,
          baseImageId,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Generation failed (${res.status})`)
      }

      const data = await res.json()
      setResults(data.images || [])
      setGenerationProgress(100)
      setGenerationStatus("complete")
      
      // Brief delay to show completion
      setTimeout(() => {
        setFlowStep("results")
      }, 1500)

    } catch (e) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : "Generation failed. Please try again."
      setGenerationError(errorMessage)
      setGenerationStatus("error")
      clearInterval(progressInterval)
      
      toast({ 
        title: "Generation failed", 
        description: errorMessage, 
        variant: "destructive" 
      })
    } finally {
      setIsGenerating(false)
      clearInterval(progressInterval)
    }
  }

  const handleStartOver = () => {
    setFlowStep("upload")
    setBaseImage(null)
    setBaseImageId(null)
    setPuppetConfig(null)
    setResults([])
    setGenerationProgress(0)
    setGenerationStatus("generating")
    setGenerationError(null)
  }

  const handleRetakePhoto = () => {
    setFlowStep("upload")
    setBaseImage(null)
    setBaseImageId(null)
    // Keep the puppet config so they don't have to reconfigure
  }

  const handleRemixPrompt = () => {
    setFlowStep("configure")
    // Keep the image but allow them to change the puppet configuration
  }

  const handleSubmitToWall = (image: GeneratedImage) => {
    // In this app, images automatically appear on the wall if they have a base image
    // This is just for user feedback - the image is already eligible for the wall
    console.log("Image submitted to wall:", image.id)
  }

  const handleGenerationModalClose = () => {
    if (generationStatus === "complete") {
      setFlowStep("results")
    } else if (generationStatus === "error") {
      setFlowStep("configure")
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Puppet Photobooth
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Turn yourself into any puppet you can imagine
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {flowStep === "upload" && (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Let's Make You a Puppet!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start by capturing or uploading a photo of yourself. Then we'll guide you through creating the perfect puppet transformation.
              </p>
            </div>

            {/* Input Method Selection */}
            <Card className="max-w-2xl mx-auto p-8">
              {hasWebcam === null ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Checking for camera...</p>
                </div>
              ) : (
                <Tabs 
                  value={preferredInputMode || "upload"} 
                  onValueChange={(value) => setPreferredInputMode(value as "webcam" | "upload")}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                    <TabsTrigger value="webcam" disabled={!hasWebcam}>
                      <Camera className="w-4 h-4 mr-2" />
                      Camera
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="webcam" className="mt-6">
                    {hasWebcam ? (
                      <WebcamCapture
                        onUpload={handleImageCapture}
                        onCancel={() => setPreferredInputMode("upload")}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Camera not available</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="upload" className="mt-6">
                    <EnhancedImageUpload
                      onUpload={handleImageCapture}
                      onRemove={() => {
                        setBaseImage(null)
                        setBaseImageId(null)
                      }}
                      onMaskChange={() => {}} // No-op since we don't use masks
                      uploadedImage={baseImage ? { id: baseImageId ?? "", url: baseImage } : null}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          </div>
        )}

        {/* Show current image when in other steps */}
        {flowStep !== "upload" && baseImage && (
          <Card className="max-w-md mx-auto mb-8 overflow-hidden">
            <img 
              src={baseImage} 
              alt="Your photo" 
              className="w-full aspect-square object-cover"
            />
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Your photo</p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleStartOver}
                className="mt-2"
              >
                Change Photo
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Modals */}
      <PuppetConfigurationModal
        isOpen={flowStep === "configure"}
        onClose={() => setFlowStep("upload")}
        onComplete={handleConfigurationComplete}
        initialConfig={puppetConfig || undefined}
      />

      <PuppetGenerationModal
        isOpen={flowStep === "generating"}
        onClose={handleGenerationModalClose}
        onCancel={() => {
          setFlowStep("configure")
          setIsGenerating(false)
        }}
        progress={generationProgress}
        status={generationStatus}
        error={generationError || undefined}
        canCancel={isGenerating}
      />

      <PuppetResultsModal
        isOpen={flowStep === "results"}
        onClose={() => setFlowStep("upload")}
        onStartOver={handleStartOver}
        onRetakePhoto={handleRetakePhoto}
        onRemixPrompt={handleRemixPrompt}
        onSubmitToWall={handleSubmitToWall}
        results={results}
        puppetConfig={puppetConfig || undefined}
      />
    </div>
  )
}
