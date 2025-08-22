"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useGenerationProgress } from "@/hooks/use-generation-progress"
import { GenerationProgressModal } from "@/components/generation-progress-modal"
import { InstantResults } from "@/components/instant-results"
import { SessionCodeVerify } from "@/components/session-code-verify"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Camera, RefreshCw, Sparkles, ArrowLeft, Users } from "lucide-react"

interface QuestionsPayload {
  title: string
  intro?: string
  questions: Array<{ id: string; text: string; placeholder?: string }>
  references?: Array<{ label: string; url: string }>
  promptTemplate: string
}

export default function PhotoboothPage() {
  const [schema, setSchema] = useState<QuestionsPayload | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [sessionCode, setSessionCode] = useState<any>(null)
  const [remainingGenerations, setRemainingGenerations] = useState<number>(0)

  // webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showResults, setShowResults] = useState<boolean>(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])

  const progress = useGenerationProgress()
  const { toast } = useToast()

  const handleGenerationComplete = (images: any[]) => {
    setGeneratedImages(images)
    setShowResults(true)
    // Update remaining generations after successful generation
    setRemainingGenerations(prev => Math.max(0, prev - 1))
  }

  const handleSaveImage = async (image: any) => {
    // Already saved to gallery during generation
  }

  const handleDiscardImage = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleCloseResults = () => {
    setShowResults(false)
    setGeneratedImages([])
  }

  const handleRetakePhoto = () => {
    setShowResults(false)
    setGeneratedImages([])
    setSnapshotUrl(null)
    // This will show the camera again for a new photo
  }

  const handleRemixPrompt = () => {
    setShowResults(false)
    setGeneratedImages([])
    // Keep the photo but allow them to modify answers/prompt
  }

  const handleSubmitToWall = (image: any) => {
    // Images are automatically eligible for the wall since they have base images
    console.log("Image submitted to wall:", image.id)
  }

  const handleSessionCodeVerified = (verifiedSessionCode: any) => {
    setSessionCode(verifiedSessionCode)
    setRemainingGenerations(verifiedSessionCode.maxGenerations - verifiedSessionCode.usedGenerations)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/questions")
        if (!res.ok) throw new Error("Failed to load questions")
        const json: QuestionsPayload = await res.json()
        setSchema(json)
      } catch (e: any) {
        setError(e?.message || "Failed to load questions")
      }
    })()
  }, [])

  useEffect(() => {
    // try to start webcam
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setHasCamera(true)
        }
      } catch {
        setHasCamera(false)
      }
    })()
  }, [])

  function capture() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const w = video.videoWidth || 512
    const h = video.videoHeight || 512
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, 0, 0, w, h)
    const url = canvas.toDataURL("image/png")
    setSnapshotUrl(url)
  }

  function retake() {
    setSnapshotUrl(null)
  }

  const prompt = useMemo(() => {
    if (!schema) return ""
    const refStr = (schema.references || []).map((r) => r.label).join(", ")
    return schema.promptTemplate
      .replace("{{subject}}", answers["subject"] || "subject")
      .replace("{{style}}", answers["style"] || "portrait")
      .replace("{{references}}", refStr)
  }, [schema, answers])

  async function generate() {
    if (!prompt.trim() || !snapshotUrl || remainingGenerations <= 0) return
    
    setBusy(true)
    try {
      // First, use a generation from the session code
      const verifyResponse = await fetch("/api/session-codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sessionCode.code, useGeneration: true }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json()
        throw new Error(error.error || "Session code verification failed")
      }

      const verifyData = await verifyResponse.json()
      setRemainingGenerations(verifyData.remainingGenerations)

      // upload snapshot to get baseImageId
      progress.updateProgress("uploading", 10, "Uploading snapshot...")
      const blob = await (await fetch(snapshotUrl)).blob()
      const { uploadImageViaApi } = await import("@/lib/client-upload")
      const { baseImageId } = await uploadImageViaApi(blob, "snapshot.png")

      // Create a full transparent mask to allow AI to stylize entire portrait (edit whole image)
      const maskCanvas = document.createElement("canvas")
      const img = new Image()
      img.src = snapshotUrl
      await new Promise((res) => (img.onload = res))
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      const mctx = maskCanvas.getContext("2d")!
      // Fill with transparent = editable everywhere
      mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      const maskData = maskCanvas.toDataURL("image/png")

      progress.updateProgress("generating", 30, "Generating photo...")
      const gen = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, n: 1, size: "1024x1024", baseImageId, maskData }),
      })
      if (!gen.ok) {
        const err = await gen.json().catch(() => ({ error: "Generation failed" }))
        throw new Error(err.error || "Generation failed")
      }

      progress.updateProgress("downloading", 90, "Saving to gallery...")
      const result = await gen.json()
      await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: result.images }),
      })

      progress.complete(result.images)
      // Images will be displayed via the onComplete callback instead of redirecting
    } catch (e: any) {
      progress.setError(e?.message || "Failed to generate")
    } finally {
      setBusy(false)
    }
  }

  // Show session code verification if not verified
  if (!sessionCode) {
    return <SessionCodeVerify onVerified={handleSessionCodeVerified} />
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Photobooth</h1>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {sessionCode.name || sessionCode.code}
            </Badge>
            <Badge variant={remainingGenerations > 0 ? "default" : "destructive"}>
              {remainingGenerations} generations left
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-2">
        <section>
          <Card className="p-4">
            <h2 className="font-medium mb-2">Step 1 — Answer</h2>
            {schema ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{schema.intro}</p>
                {schema.questions.map((q) => (
                  <div key={q.id} className="grid gap-1">
                    <Label htmlFor={`q-${q.id}`}>{q.text}</Label>
                    <Input
                      id={`q-${q.id}`}
                      placeholder={q.placeholder}
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                ))}
                {schema.references && schema.references.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    References: {schema.references.map((r) => r.label).join(", ")}
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading questions…</div>
            )}
          </Card>

          <Card className="p-4 mt-4">
            <h2 className="font-medium mb-2">Step 2 — Capture</h2>
            {!hasCamera && <p className="text-sm text-muted-foreground">No camera access. Check permissions.</p>}

            <div className="relative aspect-square bg-black/5 rounded-lg overflow-hidden">
              {!snapshotUrl ? (
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              ) : (
                <img src={snapshotUrl} alt="snapshot" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {!snapshotUrl ? (
                <Button onClick={capture} disabled={!hasCamera || busy}>
                  <Camera className="h-4 w-4 mr-2" /> Snap
                </Button>
              ) : (
                <Button variant="outline" onClick={retake} disabled={busy}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Retake
                </Button>
              )}
              <Button onClick={generate} disabled={!snapshotUrl || busy || !prompt.trim() || remainingGenerations <= 0}>
                <Sparkles className="h-4 w-4 mr-2" /> 
                {remainingGenerations <= 0 ? "No Generations Left" : "Generate"}
              </Button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </Card>
        </section>

        <section>
          <Card className="p-4">
            <h2 className="font-medium mb-2">Step 3 — Preview Prompt</h2>
            <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg min-h-32">{prompt}</pre>
          </Card>

          {showResults && generatedImages.length > 0 && (
            <Card className="p-4 mt-4">
              <h2 className="font-medium mb-2">Generated Results</h2>
              <InstantResults
                images={generatedImages}
                prompt={prompt}
                onSave={handleSaveImage}
                onDiscard={handleDiscardImage}
                onClose={handleCloseResults}
                onRetakePhoto={handleRetakePhoto}
                onRemixPrompt={handleRemixPrompt}
                onSubmitToWall={handleSubmitToWall}
              />
            </Card>
          )}
        </section>
      </main>

      <GenerationProgressModal
        isOpen={progress.isOpen}
        onClose={progress.close}
        onCancel={progress.cancel}
        status={progress.status}
        progress={progress.progress}
        message={progress.message}
        error={progress.error}
        generatedCount={progress.generatedCount}
        totalCount={progress.totalCount}
        onComplete={handleGenerationComplete}
        generatedImages={progress.generatedImages}
      />
    </div>
  )
}
