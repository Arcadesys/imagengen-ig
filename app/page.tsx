"use client"

import { useState, useCallback, useEffect } from "react"
import { ImageUpload } from "@/components/image-upload"
import { PromptInput } from "@/components/prompt-input"
import { GenerationControls } from "@/components/generation-controls"
import { GenerationResults } from "@/components/generation-results"
import { LiveRegion } from "@/components/accessibility/live-region"
import { useImageUpload } from "@/hooks/use-image-upload"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ImageIcon, GalleryThumbnailsIcon as Gallery, Keyboard } from "lucide-react"
import Link from "next/link"
import type { GeneratedImage } from "@/lib/types"

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState<"512x512" | "768x768" | "1024x1024">("1024x1024")
  const [seed, setSeed] = useState("")
  const [variations, setVariations] = useState(1)
  const [quality, setQuality] = useState<"standard" | "hd">("standard")
  const [style, setStyle] = useState<"vivid" | "natural">("vivid")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [guidanceScale, setGuidanceScale] = useState(7)
  const [steps, setSteps] = useState(20)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [liveMessage, setLiveMessage] = useState("")
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  const { uploadedImage, handleUpload, handleRemove } = useImageUpload()
  const { toast } = useToast()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isGenerating && prompt.trim()) {
        e.preventDefault()
        handleGenerate()
      }

      // Alt + G to focus on gallery link
      if (e.altKey && e.key === "g") {
        e.preventDefault()
        const galleryLink = document.querySelector('a[href="/gallery"]') as HTMLElement
        galleryLink?.focus()
      }

      // Alt + P to focus on prompt input
      if (e.altKey && e.key === "p") {
        e.preventDefault()
        const promptInput = document.getElementById("prompt-input")
        promptInput?.focus()
      }

      // Show keyboard shortcuts with ?
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isGenerating, prompt])

  useEffect(() => {
    const reuseData = sessionStorage.getItem("reusePrompt")
    if (reuseData) {
      try {
        const data = JSON.parse(reuseData)
        setPrompt(data.prompt || "")
        setSize(data.size || "1024x1024")
        setSeed(data.seed || "")
        setVariations(data.variations || 1)
        setQuality(data.quality || "standard")
        setStyle(data.style || "vivid")
        setNegativePrompt(data.negativePrompt || "")
        setGuidanceScale(data.guidanceScale || 7)
        setSteps(data.steps || 20)
        sessionStorage.removeItem("reusePrompt")

        setLiveMessage("Prompt and settings restored from gallery image")
        toast({
          title: "Prompt restored",
          description: "Settings from gallery image have been loaded.",
        })
      } catch (error) {
        console.error("Error parsing reuse data:", error)
      }
    }
  }, [toast])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setLiveMessage("Error: Prompt is required to generate images")
      toast({
        title: "Prompt required",
        description: "Please enter a prompt to generate images.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedImages([])
    setLiveMessage(`Starting image generation. Creating ${variations} variation${variations > 1 ? "s" : ""}...`)

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          n: variations,
          seed: seed || null,
          baseImageId: uploadedImage?.id || null,
          quality,
          style,
          negativePrompt: negativePrompt.trim() || null,
          guidanceScale,
          steps,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Generation failed"

        try {
          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json()
            errorMessage = error.error || errorMessage
          } else {
            // Handle HTML error pages or other non-JSON responses
            const errorText = await response.text()
            if (errorText.includes("Internal Server Error")) {
              errorMessage = "Internal server error. Please check your OpenAI API key and try again."
            } else if (response.status === 500) {
              errorMessage = "Server error. Please try again later."
            } else if (response.status === 400) {
              errorMessage = "Invalid request. Please check your inputs."
            } else {
              errorMessage = `Server error (${response.status}). Please try again.`
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
          errorMessage = `Server error (${response.status}). Please try again.`
        }

        throw new Error(errorMessage)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned invalid response format")
      }

      const result = await response.json()
      setGeneratedImages(result.images)
      setHasGenerated(true)
      setLiveMessage(
        `Successfully generated ${variations} image${variations > 1 ? "s" : ""}. You can now save your favorites to the gallery.`,
      )

      toast({
        title: "Images generated successfully",
        description: `${variations} variation${variations > 1 ? "s have" : " has"} been created. Save the ones you like to your gallery.`,
      })
    } catch (error) {
      console.error("Generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate images. Please try again."
      setLiveMessage(`Generation failed: ${errorMessage}`)
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, size, seed, variations, uploadedImage?.id, quality, style, negativePrompt, guidanceScale, steps, toast])

  const handleSaveToGallery = useCallback(
    async (image: GeneratedImage) => {
      try {
        const response = await fetch("/api/gallery", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: image.id,
            url: image.url,
            prompt: image.metadata.prompt,
            size: image.metadata.size,
            seed: image.metadata.seed,
            baseImageId: image.metadata.baseImageId,
          }),
        })

        if (!response.ok) {
          let errorMessage = "Failed to save to gallery"

          try {
            const contentType = response.headers.get("content-type")
            if (contentType && contentType.includes("application/json")) {
              const error = await response.json()
              errorMessage = error.error || errorMessage
            } else {
              errorMessage = `Server error (${response.status}). Failed to save to gallery.`
            }
          } catch (parseError) {
            console.error("Error parsing save error response:", parseError)
            errorMessage = `Server error (${response.status}). Failed to save to gallery.`
          }

          throw new Error(errorMessage)
        }

        setLiveMessage("Image saved to gallery successfully")
        toast({
          title: "Saved to gallery",
          description: "Image has been added to your gallery.",
        })
      } catch (error) {
        console.error("Save error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to save image to gallery."
        setLiveMessage(`Save failed: ${errorMessage}`)
        toast({
          title: "Save failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const samplePrompts = [
    "A serene mountain landscape at sunset with golden light",
    "A futuristic city with flying cars and neon lights",
    "A cozy coffee shop interior with warm lighting",
    "An abstract digital art piece with vibrant colors",
  ]

  const handleSamplePrompt = useCallback((samplePrompt: string) => {
    setPrompt(samplePrompt)
    setLiveMessage(`Sample prompt loaded: ${samplePrompt}`)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <LiveRegion message={liveMessage} />

      {/* Header */}
      <header className="border-b bg-card" role="banner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h1 className="text-xl font-semibold">AI Image Generator</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(true)}
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Shortcuts
              </Button>
              <Link href="/gallery">
                <Button variant="outline" size="sm">
                  <Gallery className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8" tabIndex={-1} role="main">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <section aria-labelledby="controls-heading" className="space-y-6">
            <div>
              <h2 id="controls-heading" className="text-lg font-medium mb-4">
                Create Images
              </h2>

              {/* Prompt Input */}
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleGenerate}
                disabled={isGenerating}
                placeholder="Describe what to make..."
              />

              {/* Sample Prompts */}
              {!hasGenerated && (
                <Card className="p-4 mt-4">
                  <h3 className="text-sm font-medium mb-3">Try these prompts:</h3>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Sample prompts">
                    {samplePrompts.map((samplePrompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSamplePrompt(samplePrompt)}
                        disabled={isGenerating}
                        className="text-xs h-auto py-2 px-3 whitespace-normal text-left"
                        aria-label={`Use sample prompt: ${samplePrompt}`}
                      >
                        {samplePrompt}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <Separator />

            {/* Base Image Upload */}
            <section aria-labelledby="upload-heading">
              <h3 id="upload-heading" className="text-md font-medium mb-4">
                Base Image (Optional)
              </h3>
              <ImageUpload
                onUpload={handleUpload}
                onRemove={handleRemove}
                uploadedImage={uploadedImage}
                disabled={isGenerating}
              />
            </section>

            <Separator />

            {/* Generation Controls */}
            <section aria-labelledby="generation-heading">
              <GenerationControls
                size={size}
                onSizeChange={setSize}
                seed={seed}
                onSeedChange={setSeed}
                variations={variations}
                onVariationsChange={setVariations}
                onGenerate={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                isGenerating={isGenerating}
                quality={quality}
                onQualityChange={setQuality}
                style={style}
                onStyleChange={setStyle}
                negativePrompt={negativePrompt}
                onNegativePromptChange={setNegativePrompt}
                guidanceScale={guidanceScale}
                onGuidanceScaleChange={setGuidanceScale}
                steps={steps}
                onStepsChange={setSteps}
              />
            </section>
          </section>

          {/* Right Panel - Results */}
          <section aria-labelledby="results-heading" className="space-y-6">
            <div>
              <h2 id="results-heading" className="text-lg font-medium mb-4">
                Generated Images
              </h2>

              {isGenerating && (
                <Card className="p-8" role="status" aria-live="polite">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div
                      className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="font-medium mb-2">
                      Creating {variations} image{variations > 1 ? "s" : ""}...
                    </h3>
                    <p className="text-sm text-muted-foreground">This may take a few moments. Please wait.</p>
                  </div>
                </Card>
              )}

              {!isGenerating && generatedImages.length > 0 && (
                <GenerationResults
                  images={generatedImages}
                  onSave={handleSaveToGallery}
                  onDiscard={(imageId) => {
                    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId))
                    setLiveMessage("Image discarded")
                  }}
                />
              )}

              {!isGenerating && !hasGenerated && (
                <Card className="p-8">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
                    <h3 className="font-medium mb-2">Ready to generate</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter a prompt and click generate to create AI images.
                      <br />
                      <span className="text-xs">Press Ctrl+Enter (Cmd+Enter on Mac) to generate quickly.</span>
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Keyboard Shortcuts Dialog */}
      {showKeyboardShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-labelledby="shortcuts-title"
        >
          <Card className="p-6 max-w-md mx-4">
            <h2 id="shortcuts-title" className="text-lg font-semibold mb-4">
              Keyboard Shortcuts
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Generate images:</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>Focus prompt:</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Alt+P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Go to gallery:</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Alt+G</kbd>
              </div>
              <div className="flex justify-between">
                <span>Show shortcuts:</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => setShowKeyboardShortcuts(false)} autoFocus>
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
