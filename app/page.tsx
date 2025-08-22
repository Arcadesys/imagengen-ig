"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Upload, Camera, X, RotateCcw } from "lucide-react"

export default function PuppetrayPage() {
  const [step, setStep] = useState<"upload" | "configure" | "generate" | "results">("upload")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [puppetStyle, setPuppetStyle] = useState<string>("muppet")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState<"generating" | "complete" | "error">("generating")
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Webcam state
  const [hasWebcam, setHasWebcam] = useState<boolean | null>(null)
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [preferredInputMode, setPreferredInputMode] = useState<"webcam" | "upload">("upload")
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [canSwitchCamera, setCanSwitchCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check for webcam availability on mount
  useEffect(() => {
    async function checkWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        setHasWebcam(true)
        setPreferredInputMode("webcam")

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setCanSwitchCamera(videoDevices.length > 1)
      } catch {
        setHasWebcam(false)
        setPreferredInputMode("upload")
      }
    }
    checkWebcam()
  }, [])

  // Start webcam
  const startWebcam = async () => {
    try {
      stopWebcam()
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1024 },
          height: { ideal: 1024 },
          facingMode: facingMode
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsWebcamActive(true)
      }
    } catch (error) {
      console.error("Failed to start webcam:", error)
      setPreferredInputMode("upload")
    }
  }

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsWebcamActive(false)
  }

  // Switch camera
  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user")
  }

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        
        setImageFile(file)
        setImagePreview(url)
        stopWebcam()
        setStep("configure")
      }
    }, 'image/jpeg', 0.9)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
        setStep("configure")
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToServer = async (file: File): Promise<{ id: string, url: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    
    // Try the simple upload endpoint (more reliable in production)
    const response = await fetch("/api/upload-simple", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(error.error || `Upload failed with status ${response.status}`)
    }

    const data = await response.json()
    return {
      id: data.baseImageId || data.id,
      url: data.url
    }
  }

  const handleGenerate = async () => {
    if (!imageFile) return

    setStep("generate")
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStatus("generating")
    setGenerationError(null)

    try {
      // Upload the image first
      setGenerationProgress(20)
      const uploadResult = await uploadImageToServer(imageFile)
      
      setGenerationProgress(60)
      
      // Call the puppetray API for generation
      const generateResponse = await fetch("/api/puppetray", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseImageId: uploadResult.id,
          puppetStyle: puppetStyle,
          species: "human",
          personality: "friendly"
        }),
      })

      setGenerationProgress(90)

      if (!generateResponse.ok) {
        const error = await generateResponse.json().catch(() => ({ error: "Generation failed" }))
        throw new Error(error.error || `Generation failed with status ${generateResponse.status}`)
      }

      setGenerationProgress(100)
      setGenerationStatus("complete")
      
      setTimeout(() => {
        setStep("results")
      }, 1000)

    } catch (error) {
      console.error("Generation failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Generation failed. Please try again."
      setGenerationError(errorMessage)
      setGenerationStatus("error")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartOver = () => {
    setStep("upload")
    setImageFile(null)
    setImagePreview(null)
    setPuppetStyle("muppet")
    setFacingMode("user")
    setGenerationProgress(0)
    setGenerationStatus("generating")
    setGenerationError(null)
    stopWebcam()
  }

  // Start webcam when webcam tab is selected
  useEffect(() => {
    if (preferredInputMode === "webcam" && hasWebcam && step === "upload") {
      startWebcam()
    } else {
      stopWebcam()
    }
  }, [preferredInputMode, hasWebcam, step])

  // Restart webcam when facing mode changes
  useEffect(() => {
    if (isWebcamActive) {
      startWebcam()
    }
  }, [facingMode])

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-black/70 backdrop-blur">
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
        {step === "upload" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Let's Make You a Puppet!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start by uploading a photo of yourself. Then we'll guide you through creating the perfect puppet transformation.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto p-8">
              <div className="text-center space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-4">
                    <p className="text-lg font-medium">Upload Your Photo</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a clear photo of yourself for the best results
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Choose Your Puppet Style</h2>
            </div>

            {imagePreview && (
              <Card className="max-w-md mx-auto mb-8">
                <img 
                  src={imagePreview} 
                  alt="Your photo" 
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </Card>
            )}

            <Card className="max-w-2xl mx-auto p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Puppet Style</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "muppet", name: "Muppet", desc: "Classic Sesame Street style" },
                      { id: "sock", name: "Sock Puppet", desc: "Simple knitted sock" },
                      { id: "marionette", name: "Marionette", desc: "String puppet with wooden joints" },
                      { id: "felt", name: "Felt Puppet", desc: "Hand-stitched wool felt" }
                    ].map((style) => (
                      <Button
                        key={style.id}
                        variant={puppetStyle === style.id ? "default" : "outline"}
                        className="h-auto p-4 flex-col"
                        onClick={() => setPuppetStyle(style.id)}
                      >
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs text-muted-foreground">{style.desc}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Back
                  </Button>
                  <Button onClick={handleGenerate} className="flex-1">
                    Generate Puppet
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "generate" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Creating Your Puppet...</h2>
            </div>

            <Card className="max-w-md mx-auto p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium">Transforming your photo</p>
                  <p className="text-sm text-muted-foreground">This may take a few moments...</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Your Puppet is Ready!</h2>
            </div>

            <Card className="max-w-md mx-auto p-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Generated puppet would appear here</p>
              </div>
            </Card>

            <div className="text-center space-x-4">
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
              <Button onClick={() => console.log("Download")}>
                Download
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
