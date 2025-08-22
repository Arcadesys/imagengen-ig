"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Mail, Sparkles, CheckCircle, ArrowLeft, Share2, Download, Copy } from "lucide-react"
import { getDetailedStylePrompt } from "@/lib/style-prompts"

interface GenerationStep {
  id: string
  name: string
  description: string
  duration: number
}

export default function GeneratePage() {
  const searchParams = useSearchParams()
  const styleId = searchParams.get("style")

  const [currentStep, setCurrentStep] = useState<"capture" | "generating" | "signup" | "complete">("capture")
  const [email, setEmail] = useState("")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [photoId, setPhotoId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [styles, setStyles] = useState<Array<{ id: string; name: string; prompt: string; preview?: string }>>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadGenerationSteps = async () => {
      try {
        const response = await fetch("/api/questions")
        if (response.ok) {
          const data = await response.json()
          setGenerationSteps(
            data.generationSteps || [
              { id: "prep", name: "Preparing", description: "Setting up generation", duration: 500 },
              { id: "generate", name: "Generating", description: "AI is creating your image", duration: 500 },
              { id: "finalize", name: "Finalizing", description: "Saving your masterpiece", duration: 500 },
            ],
          )
          if (Array.isArray(data?.styles)) {
            setStyles(data.styles)
          }
        }
      } catch (error) {
        console.error("Failed to load generation steps:", error)
      }
    }

    loadGenerationSteps()
  }, [])

  useEffect(() => {
    if (currentStep === "capture") {
      initializeCamera()
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [currentStep])

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error("Failed to access camera:", error)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
  const imageData = canvas.toDataURL("image/png")
        setCapturedImage(imageData)
        setCurrentStep("generating")
        startGeneration(imageData)
      }
    }
  }

  const startGeneration = async (imageData: string) => {
    setIsGenerating(true)
    setCurrentStepIndex(0)
    try {
      // 1) Upload captured image to obtain a baseImageId
  const blob = await (await fetch(imageData)).blob()
  const { baseImageId } = await (await import("@/lib/client-upload")).uploadImageViaApi(blob, "snapshot.png")

      // 2) Build a prompt from the selected style
  const selected = styles.find((s) => s.id === styleId)
  const detail = getDetailedStylePrompt(styleId)
  const base = selected?.prompt || "cartoon style, bold lines, vibrant colors"
  
  // Add explicit clothing preservation instructions (enhanced to match puppet-level detail)
  const clothingPreservation = "CRITICAL: PRESERVE ALL CLOTHING AND OUTFIT DETAILS. Maintain exact clothing items, patterns, colors, textures, logos, accessories, jewelry, and styling. Convert clothing materials to style-appropriate textures while keeping all design elements identical (same colors, patterns, cuts, fit). Preserve outfit completely: shirts, pants, dresses, jackets, shoes, hats, glasses, jewelry - everything must remain recognizable in the new style. Keep clothing colors, patterns, textures, logos, text, designs, cuts, and fit identical to the original photo. Do not change the person's outfit - preserve shirts, pants, dresses, jackets, shoes, hats, accessories, jewelry, watches, belts, ties, scarves, bags, etc. exactly as shown in the original image but transformed to match the artistic style."
  
  // New: enforce composition and background preservation for illusion of transformation
  const compositionPreservation = "MAINTAIN ORIGINAL COMPOSITION AND BACKGROUND. Keep the same camera framing, subject position and scale, pose, angle, and lighting from the source photo. Do not alter or replace the background or environment; do not add or remove background elements. Only transform the subject into the chosen style while leaving the background and composition intact."
  
  const prompt = `${detail} ${base}. ${clothingPreservation} ${compositionPreservation}`

      // 3) Create a fully-transparent mask so the whole image can be edited
      const imgEl = new Image()
      imgEl.src = imageData
      await new Promise((res) => (imgEl.onload = () => res(null)))
      const maskCanvas = document.createElement("canvas")
      maskCanvas.width = imgEl.width
      maskCanvas.height = imgEl.height
      const mctx = maskCanvas.getContext("2d")!
      mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height) // transparent = editable
      const maskData = maskCanvas.toDataURL("image/png")

      // 4) Request generation via SSE stream so we can preview ASAP
      const controller = new AbortController()
      const genResp = await fetch("/api/images/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size: "512x512", n: 1, baseImageId, maskData }),
        signal: controller.signal,
      })
      if (!genResp.ok || !genResp.body) {
        const err = await genResp.json().catch(() => ({ error: "Generation failed" }))
        throw new Error(err.error || "Generation failed")
      }
      const reader = genResp.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value)
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue
            try {
              const ev = JSON.parse(line.slice(6))
              if (ev.type === "progress") {
                // Advance the simple step indicator
                setCurrentStepIndex((i) => Math.min(i + 1, generationSteps.length - 1))
                if (Array.isArray(ev.images) && ev.images[0]?.url && !generatedImageUrl) {
                  setGeneratedImageUrl(ev.images[0].url)
                }
              } else if (ev.type === "complete") {
                if (Array.isArray(ev.images) && ev.images[0]?.url) {
                  setGeneratedImageUrl(ev.images[0].url)
                }
              }
            } catch {}
          }
        }
      }

      // 5) Save to gallery (best-effort)
      try {
        // Re-fetch the last image URL from state
        if (generatedImageUrl) {
          await fetch("/api/gallery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              images: [
                {
                  id: crypto.randomUUID(),
                  url: generatedImageUrl,
                  metadata: { prompt, size: "512x512", provider: "openai", baseImageId, hasMask: true },
                },
              ],
            }),
          })
        }
      } catch (e) {
        console.warn("Failed to add to gallery:", e)
      }
    } catch (error) {
      console.error("Generation failed:", error)
      setGeneratedImageUrl("/artistic-photo.png")
    }

    setIsGenerating(false)
    setCurrentStep("signup")
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setEmailSubmitted(true)

    try {
      const response = await fetch("/api/photo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          imageUrl: generatedImageUrl,
          style: styleId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setPhotoId(result.photoId)
        const shareLink = `${window.location.origin}/share/${result.photoId}`
        setShareUrl(shareLink)

        const qrResponse = await fetch(`/api/qr?url=${encodeURIComponent(shareLink)}`)
        if (qrResponse.ok) {
          const qrData = await qrResponse.json()
          setQrCodeUrl(qrData.qrCodeUrl)
        }

        setTimeout(() => setCurrentStep("complete"), 1000)
      }
    } catch (error) {
      console.error("Failed to save photo:", error)
      setTimeout(() => setCurrentStep("complete"), 1000)
    }
  }

  const copyToClipboard = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
      }
    }
  }

  const shareToSocial = (platform: string) => {
    if (!shareUrl) return

    const text = "Check out my AI-transformed photo from the photo booth!"
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`,
    }

    window.open(urls[platform as keyof typeof urls], "_blank", "width=600,height=400")
  }

  const resetFlow = () => {
    setCapturedImage(null)
    setGeneratedImageUrl(null)
    setEmail("")
    setEmailSubmitted(false)
    setCurrentStep("capture")
    setCurrentStepIndex(0)
  }

  if (currentStep === "capture") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Styles
            </Button>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-fredoka">
              Strike a Pose!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Get ready for your AI transformation</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-96 object-cover rounded-lg bg-gray-200 dark:bg-gray-800"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute inset-0 border-4 border-dashed border-pink-400 rounded-lg pointer-events-none opacity-50" />
                </div>

                <div className="text-center mt-6">
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-6 text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Camera className="w-6 h-6 mr-3" />
                    Capture Photo
                    <Sparkles className="w-6 h-6 ml-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === "generating") {
    const currentGenerationStep = generationSteps[currentStepIndex]
    const progress = ((currentStepIndex + 1) / generationSteps.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          {/* Live preview if available */}
          {generatedImageUrl ? (
            <div className="mb-8">
              <div className="relative inline-block rounded-xl overflow-hidden shadow-2xl ring-4 ring-purple-500/20">
                <img
                  src={generatedImageUrl}
                  alt="Generating preview"
                  className="w-80 h-80 object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Preview updating as it finishes…</p>
            </div>
          ) : null}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-white dark:bg-gray-900 rounded-full p-8 shadow-2xl">
                <Sparkles className="w-24 h-24 text-purple-600 mx-auto animate-spin" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 font-fredoka">
            Creating Magic...
          </h1>

          {currentGenerationStep && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">{currentGenerationStep.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">{currentGenerationStep.description}</p>
            </div>
          )}

          <div className="w-full max-w-md mx-auto mb-8">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{Math.round(progress)}% complete</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-lg mx-auto">
            {generationSteps.map((step, index) => (
              <div key={step.id} className="text-center">
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    index < currentStepIndex
                      ? "bg-green-500"
                      : index === currentStepIndex
                        ? "bg-purple-500 animate-pulse"
                        : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <span className="text-white font-semibold">{index + 1}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{step.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (currentStep === "signup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                {generatedImageUrl && (
                  <img
                    src={generatedImageUrl || "/placeholder.svg"}
                    alt="Generated photo"
                    className="w-64 h-64 object-cover rounded-lg mx-auto shadow-lg"
                  />
                )}
              </div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 font-fredoka">
                Your Photo is Ready!
              </h1>

              <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                Enter your email to receive your AI-transformed photo
              </p>

              <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
                <div className="flex gap-4 mb-6">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                    disabled={emailSubmitted}
                  />
                  <Button
                    type="submit"
                    disabled={emailSubmitted || !email.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6"
                  >
                    {emailSubmitted ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Photo
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                We&apos;ll send you a link to download your photo and share it with friends!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-fredoka">
              Photo Ready to Share!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Your AI-transformed photo has been sent to your email
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold mb-2">Your AI Photo</h3>
                </div>

                {generatedImageUrl && (
                  <div className="relative">
                    <img
                      src={generatedImageUrl || "/placeholder.svg"}
                      alt="AI generated photo"
                      className="w-full h-80 object-cover rounded-lg shadow-lg"
                    />
                    <Button
                      onClick={() => window.open(generatedImageUrl, "_blank")}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Share Your Photo</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Scan the QR code or use the sharing options below
                  </p>
                </div>

                {qrCodeUrl && (
                  <div className="text-center mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-inner inline-block">
                      <img
                        src={qrCodeUrl || "/placeholder.svg"}
                        alt="QR Code for photo sharing"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Scan to view and share your photo</p>
                  </div>
                )}

                {shareUrl && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Direct Link</label>
                    <div className="flex gap-2">
                      <Input value={shareUrl} readOnly className="flex-1 text-sm" />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className={copySuccess ? "bg-green-100 text-green-700" : ""}
                      >
                        {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    {copySuccess && <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>}
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Share on Social Media</label>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => shareToSocial("twitter")}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                    >
                      Twitter
                    </Button>
                    <Button
                      onClick={() => shareToSocial("facebook")}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2"
                    >
                      Facebook
                    </Button>
                    <Button
                      onClick={() => shareToSocial("whatsapp")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                    >
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={resetFlow}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take Another Photo
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = "/wall")}
                className="px-8 py-3 rounded-full"
              >
                <Share2 className="w-5 h-5 mr-2" />
                View Photo Wall
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => (window.location.href = "/")}
              className="text-gray-600 dark:text-gray-300"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
