"use client"

import { useState, useEffect } from "react"
import { EnhancedImageUpload } from "@/components/enhanced-image-upload"
import { WebcamCapture } from "@/components/webcam-capture"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import type { GeneratedImage } from "@/lib/types"
import { Camera, Upload, Sparkles } from "lucide-react"
import { AnimationConfigurationModal } from "@/components/animation-flow-modal"
import { ToonGenerationModal } from "@/components/toon-generation-modal"
import { ToonResultsModal } from "@/components/toon-results-modal"
import type { AnimationConfiguration } from "@/lib/animation-prompts"
import { generateAnimationPrompt } from "@/lib/animation-prompts"
import { useGeneratorSession } from "@/hooks/use-generator-session"
import { useGeneratorTheme } from "@/components/theme-provider"

// type FlowStep = "upload" | "configure" | "generating" | "results"
type FlowStep = "upload" | "configure" | "generating" | "results"

export default function TurnToonPage() {
  const { toast } = useToast()
  const [flowStep, setFlowStep] = useState<FlowStep>("upload")
  const [preferredInputMode, setPreferredInputMode] = useState<"webcam" | "upload" | null>(null)
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null)

  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [baseImageId, setBaseImageId] = useState<string | null>(null)

  const [toonConfig, setToonConfig] = useState<AnimationConfiguration | null>(null)
  const [editedPrompt, setEditedPrompt] = useState<string | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState<"generating" | "complete" | "error">("generating")
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [results, setResults] = useState<GeneratedImage[]>([])

  // Theming for this generator
  const { theme } = useGeneratorTheme()
  const containerBg = theme.gradientBg || "bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950 dark:via-orange-950 dark:to-red-950"
  const headerBg = `${theme.headerBg || "bg-white/80 dark:bg-black/70"} backdrop-blur supports-[backdrop-filter]:bg-white/60`
  const accentGradient = theme.accent || "from-yellow-600 to-red-600"

  // Create or fetch a session bound to this generator
  const { sessionId } = useGeneratorSession("toon")

  useEffect(() => {
    async function checkWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach((t) => t.stop())
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

  const handleConfigurationComplete = (config: AnimationConfiguration, finalPrompt?: string) => {
    setToonConfig(config)
    setEditedPrompt(finalPrompt ?? null)
    setFlowStep("generating")
    startGeneration(config, finalPrompt)
  }

  const startGeneration = async (config: AnimationConfiguration, finalPrompt?: string | null) => {
    if (!baseImageId) return
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus("generating")
    setGenerationError(null)

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 1000)

    try {
      // Use user-edited prompt if provided, otherwise compose animation prompt
      const prompt = (finalPrompt && finalPrompt.trim()) ? finalPrompt : generateAnimationPrompt(config, false)

      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          size: "1024x1024",
          n: 1,
          baseImageId,
          sessionId: sessionId || null,
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
      setTimeout(() => setFlowStep("results"), 1500)
    } catch (e) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : "Generation failed. Please try again."
      setGenerationError(errorMessage)
      setGenerationStatus("error")
      clearInterval(progressInterval)
      toast({ title: "Generation failed", description: errorMessage, variant: "destructive" })
    } finally {
      setIsGenerating(false)
      clearInterval(progressInterval)
    }
  }

  const handleStartOver = () => {
    setFlowStep("upload")
    setBaseImage(null)
    setBaseImageId(null)
    setToonConfig(null)
    setEditedPrompt(null)
    setResults([])
    setGenerationProgress(0)
    setGenerationStatus("generating")
    setGenerationError(null)
  }

  const handleRetakePhoto = () => {
    setFlowStep("upload")
    setBaseImage(null)
    setBaseImageId(null)
  }

  const handleRemixPrompt = () => {
    setFlowStep("configure")
  }

  const handleSubmitToWall = (image: GeneratedImage) => {
    console.log("Image submitted to wall:", image.id)
  }

  const handleGenerationModalClose = () => {
    if (generationStatus === "complete") setFlowStep("results")
    else if (generationStatus === "error") setFlowStep("configure")
  }

  return (
    <div className={`min-h-dvh ${containerBg}`}>
      <header className={`sticky top-0 z-10 border-b ${headerBg}`}>
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Turn Toon</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Turn yourself into any animation style</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {flowStep === "upload" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>
                Let's Make You a Toon!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Capture or upload a photo, then we'll guide you through your animation-style transformation.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto p-8">
              {hasWebcam === null ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Checking for camera...</p>
                </div>
              ) : (
                <Tabs value={preferredInputMode || "upload"} onValueChange={(v) => setPreferredInputMode(v as any)} className="w-full">
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
                      <WebcamCapture onUpload={handleImageCapture} onCancel={() => setPreferredInputMode("upload")} sessionId={sessionId} />
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
                      onMaskChange={() => {}}
                      uploadedImage={baseImage ? { id: baseImageId ?? "", url: baseImage } : null}
                      sessionId={sessionId}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </Card>
          </div>
        )}

        {flowStep !== "upload" && baseImage && (
          <Card className="max-w-md mx-auto mb-8 overflow-hidden">
            <img src={baseImage} alt="Your photo" className="w-full aspect-square object-cover" />
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Your photo</p>
              <Button variant="ghost" size="sm" onClick={handleStartOver} className="mt-2">
                Change Photo
              </Button>
            </div>
          </Card>
        )}
      </main>

      <AnimationConfigurationModal
        isOpen={flowStep === "configure"}
        onClose={() => setFlowStep("upload")}
        onComplete={handleConfigurationComplete}
        initialConfig={toonConfig || undefined}
      />

      <ToonGenerationModal
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

      <ToonResultsModal
        isOpen={flowStep === "results"}
        onClose={() => setFlowStep("upload")}
        onStartOver={handleStartOver}
        onRetakePhoto={handleRetakePhoto}
        onRemixPrompt={handleRemixPrompt}
        onSubmitToWall={handleSubmitToWall}
        results={results}
        toonConfig={toonConfig || undefined}
      />
    </div>
  )
}
