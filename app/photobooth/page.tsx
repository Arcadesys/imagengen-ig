"use client"

import { useEffect, useRef, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useGenerationProgress } from "@/hooks/use-generation-progress"
import { GenerationProgressModal } from "@/components/generation-progress-modal"
import { InstantResults } from "@/components/instant-results"
import { SessionCodeVerify } from "@/components/session-code-verify"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Camera, RefreshCw, Sparkles, ArrowLeft, Users, Upload as UploadIcon, ChevronLeft, ChevronRight, Images, ExternalLink } from "lucide-react"
// Add: generator session to associate uploads and generations
import { useGeneratorSession } from "@/hooks/use-generator-session"

interface QuestionsPayload {
  title: string
  intro?: string
  questions: Array<{
    id: string
    text: string
    placeholder?: string
    type?: string
    options?: Array<string | { value: string; label: string }>
    allowCustom?: boolean
    defaultValue?: string
  }>
  references?: Array<{ label: string; url: string }>
  promptTemplate: string
}

// New: minimal session type for listing
interface MiniSession {
  id: string
  name: string
  generator: string
  createdAt: string
  _count: { images: number }
}

function PhotoboothContent() {
  const searchParams = useSearchParams()
  // Default to puppetray when no generator is specified
  const queryGenerator = (searchParams.get("generator") || "").trim()
  const generatorSlug = queryGenerator || "puppetray"

  // Create or get a generator session. If a specific generator is chosen (e.g. "puppetray"), attach to that; otherwise use default
  const { sessionId } = useGeneratorSession(generatorSlug)

  const [schema, setSchema] = useState<QuestionsPayload | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)
  const [sessionCode, setSessionCode] = useState<any>({ code: "ABC123", name: "Guest", maxGenerations: Number.MAX_SAFE_INTEGER, usedGenerations: 0 })
  const [remainingGenerations, setRemainingGenerations] = useState<number>(Infinity)

  // webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showResults, setShowResults] = useState<boolean>(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])

  // New: editable prompt state
  const [promptDraft, setPromptDraft] = useState<string>("")
  const [hasEditedPrompt, setHasEditedPrompt] = useState<boolean>(false)

  // Wizard step management
  type Step = "photo" | "questions" | "prompt"
  const [step, setStep] = useState<Step>("photo")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const progress = useGenerationProgress()
  const { toast } = useToast()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const handleUploadClick = () => fileInputRef.current?.click()

  // Infinite session flag
  const isInfinite = !!sessionCode?.code && String(sessionCode.code).toUpperCase() === "ABC123"

  // Per-question filter state for multi-select search
  const [qFilters, setQFilters] = useState<Record<string, string>>({})

  // New: list of sessions user can access
  const [sessions, setSessions] = useState<MiniSession[] | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const handleGenerationComplete = (images: any[]) => {
    setGeneratedImages(images)
    setShowResults(true)
    // Update remaining generations after successful generation
    if (!isInfinite) {
      setRemainingGenerations((prev) => Math.max(0, prev - 1))
    }
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
        // Prefer per-generator schema when generator param is provided
        let res: Response
        if (generatorSlug) {
          res = await fetch(`/api/generators/${generatorSlug}/questions`)
          if (!res.ok) throw new Error("Failed to load generator questions")
          const j = await res.json()
          setSchema(j.schema)
        } else {
          res = await fetch("/api/questions")
          if (!res.ok) throw new Error("Failed to load questions")
          const json = await res.json()
          const s = json?.schema || json // back-compat
          setSchema(s)
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load questions")
      }
    })()
  }, [generatorSlug])

  // Load sessions the user has access to
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setSessionsLoading(true)
      setSessionsError(null)
      try {
        // Build query string to optionally filter by generatorSlug
        const qsParts: string[] = []
        if (generatorSlug) qsParts.push(`generatorSlug=${encodeURIComponent(generatorSlug)}`)
        qsParts.push(`limit=12`)
        const qs = qsParts.length ? `?${qsParts.join("&")}` : ""
        const res = await fetch(`/api/sessions${qs}`, { cache: "no-store" })
        if (!res.ok) {
          if (res.status === 401) {
            if (!cancelled) {
              setSessions([])
            }
            return
          }
          const err = await res.json().catch(() => ({} as any))
          throw new Error(err.error || "Failed to load sessions")
        }
        const data = await res.json()
        if (!cancelled) {
          setSessions(Array.isArray(data.sessions) ? data.sessions : [])
        }
      } catch (e: any) {
        if (!cancelled) setSessionsError(e?.message || "Failed to load sessions")
      } finally {
        if (!cancelled) setSessionsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [generatorSlug])

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
    // Move to next step automatically
    setStep("questions")
  }

  function retake() {
    setSnapshotUrl(null)
    setStep("photo")
  }

  // When a photo is uploaded via file chooser, also advance to questions
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setSnapshotUrl(dataUrl)
      setStep("questions")
    }
    reader.readAsDataURL(file)
  }

  // Helper to render a question by type (no hooks inside)
  const renderQuestionInput = (q: QuestionsPayload["questions"][number]) => {
    const value = answers[q.id]

    if (q.type === "multi-select") {
      const opts = (q.options || []) as Array<string | { value: string; label: string }>
      const stringOpts = opts.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
      const filter = qFilters[q.id] || ""
      const filtered = stringOpts.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
      const selected: string[] = Array.isArray(value) ? value : []

      return (
        <div className="space-y-2">
          <Input
            placeholder={q.placeholder || "Search"}
            value={filter}
            onChange={(e) => setQFilters((prev) => ({ ...prev, [q.id]: e.target.value }))}
          />
          <div className="max-h-40 overflow-auto border rounded p-2 space-y-1">
            {filtered.map((opt) => {
              const checked = selected.includes(opt.value)
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setAnswers((prev) => {
                        const curr: string[] = Array.isArray(prev[q.id]) ? prev[q.id] : []
                        return {
                          ...prev,
                          [q.id]: e.target.checked ? [...curr, opt.value] : curr.filter((x: string) => x !== opt.value),
                        }
                      })
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              )
            })}
            {filtered.length === 0 && <div className="text-xs text-muted-foreground">No matches</div>}
          </div>
        </div>
      )
    }

    if (q.type === "select") {
      const opts = (q.options || []) as Array<string | { value: string; label: string }>
      const normalized = opts.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
      const selected = typeof value === "string" ? value : (q.defaultValue ?? "")

      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {normalized.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={selected === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    if (q.type === "gender") {
      const opts = (q.options || ["male", "female", "nonbinary"]) as Array<string | { value: string; label: string }>
      const normalized = opts.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
      const selected = typeof value === "string" ? value : ""
      const isCustom = selected && !normalized.some((o) => o.value === selected)
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {normalized.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={selected === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
              >
                {opt.label}
              </Button>
            ))}
            {q.allowCustom !== false && (
              <Button
                type="button"
                variant={isCustom || selected === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: "custom" }))}
              >
                Custom
              </Button>
            )}
          </div>
          {(selected === "custom" || isCustom) && (
            <Input
              placeholder={q.placeholder || "Enter gender"}
              value={isCustom ? selected : answers[`${q.id}_custom`] || ""}
              onChange={(e) => {
                const v = e.target.value
                setAnswers((prev) => ({ ...prev, [q.id]: v, [`${q.id}_custom`]: v }))
              }}
            />
          )}
        </div>
      )
    }

    return (
      <Input
        id={`q-${q.id}`}
        placeholder={q.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
        autoFocus
      />
    )
  }

  // Build composed prompt from answers
  const composedPrompt = useMemo(() => {
    if (!schema) return ""

    // Support conditional blocks like {{#if key}}...{{/if}}
    const condRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g

    // First, resolve conditionals
    let base = schema.promptTemplate.replace(condRegex, (_m, key: string, inner: string) => {
      const v = answers[key]
      const truthy = Array.isArray(v) ? v.length > 0 : !!v
      if (!truthy) return ""
      // If truthy, allow nested token replacement within inner
      let replacedInner = inner
      for (const [ik, iv] of Object.entries(answers)) {
        replacedInner = replacedInner.replaceAll(`{{${ik}}}`, Array.isArray(iv) ? iv.join(", ") : String(iv ?? ""))
      }
      return replacedInner
    })

    // Replace remaining tokens
    for (const [k, v] of Object.entries(answers)) {
      base = base.replaceAll(`{{${k}}}`, Array.isArray(v) ? v.join(", ") : String(v ?? ""))
    }

    const clothingPreservation =
      "CRITICAL: PRESERVE ALL CLOTHING AND OUTFIT DETAILS. Maintain exact clothing items, patterns, colors, textures, logos, accessories, jewelry, and styling. Convert clothing materials to style-appropriate textures while keeping all design elements identical (same colors, patterns, cuts, fit)."
    const compositionPreservation =
      "MAINTAIN ORIGINAL COMPOSITION AND BACKGROUND. Keep the same camera framing, subject position and scale, pose, angle, and lighting from the source photo. Do not alter or replace the background or environment; do not add or remove background elements. Only transform the subject into the chosen style while leaving the background and composition intact."

    return `${base} ${clothingPreservation} ${compositionPreservation}`.trim()
  }, [schema, answers])

  useEffect(() => {
    if (step === "prompt" && !hasEditedPrompt) {
      setPromptDraft(composedPrompt)
    }
  }, [step, composedPrompt, hasEditedPrompt])

  // Navigation helpers for questions
  const totalQuestions = schema?.questions?.length || 0
  const isFirstQuestion = currentQuestionIndex === 0
  const isLastQuestion = currentQuestionIndex >= Math.max(0, totalQuestions - 1)

  const goNextQuestion = () => {
    if (!schema) return
    if (isLastQuestion) {
      // proceed to prompt edit step
      setStep("prompt")
      return
    }
    setCurrentQuestionIndex((i) => Math.min(i + 1, totalQuestions - 1))
  }
  const goPrevQuestion = () => setCurrentQuestionIndex((i) => Math.max(0, i - 1))

  async function generate() {
    const finalPrompt = (promptDraft || "").trim()
    if (!finalPrompt || !snapshotUrl || remainingGenerations <= 0) return
    
    setBusy(true)
    try {
      // First, use a generation from the session code (skip for infinite code)
      if (!isInfinite) {
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
      }

      // upload snapshot to get baseImageId
      progress.updateProgress("uploading", 10, "Uploading snapshot...")
      const blob = await (await fetch(snapshotUrl)).blob()
      const { uploadImageViaApi } = await import("@/lib/client-upload")
      const { baseImageId } = await uploadImageViaApi(blob, "snapshot.png", sessionId || undefined)

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
        body: JSON.stringify({ prompt: finalPrompt, n: 1, size: "1024x1024", baseImageId, maskData, sessionId: sessionId || null }),
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
          <h1 className="text-lg font-semibold">Photobooth{generatorSlug ? ` — ${generatorSlug}` : ""}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {sessionCode.name || sessionCode.code}
            </Badge>
            <Badge variant={remainingGenerations > 0 ? "default" : "destructive"}>
              {Number.isFinite(remainingGenerations) ? `${remainingGenerations} generations left` : "∞ generations left"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-2">
        {/* Left column: step frames */}
        <section>
          {step === "photo" && (
            <Card className="p-4">
              <h2 className="font-medium mb-2">Step 1 — Add Photo</h2>
              {!hasCamera && <p className="text-sm text-muted-foreground">No camera access. You can upload a photo instead.</p>}

              <div className="relative aspect-square bg-black/5 rounded-lg overflow-hidden">
                {!snapshotUrl ? (
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                ) : (
                  <img src={snapshotUrl} alt="snapshot" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {!snapshotUrl ? (
                  <Button onClick={capture} disabled={!hasCamera || busy}>
                    <Camera className="h-4 w-4 mr-2" /> Snap
                  </Button>
                ) : (
                  <Button variant="outline" onClick={retake} disabled={busy}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Retake
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={handleUploadClick} disabled={busy}>
                  <UploadIcon className="h-4 w-4 mr-2" /> Upload Photo
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

                {snapshotUrl && (
                  <Button className="ml-auto" onClick={() => setStep("questions")}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </Card>
          )}

          {step === "questions" && (
            <Card className="p-4">
              <h2 className="font-medium mb-2">Step 2 — Answer Questions</h2>
              {schema ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{schema.intro}</p>

                  {totalQuestions > 0 ? (
                    <div className="grid gap-1">
                      <Label htmlFor={`q-${schema.questions[currentQuestionIndex].id}`}>
                        {schema.questions[currentQuestionIndex].text}
                      </Label>
                      {/* Render by type */}
                      {renderQuestionInput(schema.questions[currentQuestionIndex])}

                      <div className="flex justify-between mt-4">
                        <Button variant="ghost" onClick={() => setStep("photo")}>
                          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Photo
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={goPrevQuestion} disabled={isFirstQuestion}>
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                          </Button>
                          <Button onClick={goNextQuestion}>
                            {isLastQuestion ? "Continue" : "Next"} <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No questions configured.</div>
                  )}
                </div>
              ) : error ? (
                <div className="text-sm text-red-600">{error}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Loading questions…</div>
              )}
            </Card>
          )}

          {step === "prompt" && (
            <Card className="p-4">
              <h2 className="font-medium mb-2">Step 3 — Edit Full Prompt</h2>
              <p className="text-sm text-muted-foreground mb-2">
                This is the exact prompt that will be sent. You can edit it before generating.
              </p>
              <Textarea
                className="min-h-40"
                value={promptDraft}
                onChange={(e) => {
                  setPromptDraft(e.target.value)
                  setHasEditedPrompt(true)
                }}
                placeholder="Your full prompt will appear here"
              />
              <div className="flex justify-between mt-3">
                <Button variant="ghost" onClick={() => setStep("questions")}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back to Questions
                </Button>
                <Button onClick={generate} disabled={!snapshotUrl || busy || !promptDraft.trim() || remainingGenerations <= 0}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {remainingGenerations <= 0 ? "No Generations Left" : "Generate"}
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Right column: results + sessions panel */}
        <section className="space-y-4">
          {showResults && generatedImages.length > 0 && (
            <Card className="p-4">
              <h2 className="font-medium mb-2">Generated Results</h2>
              <InstantResults
                images={generatedImages}
                prompt={promptDraft}
                onSave={handleSaveImage}
                onDiscard={handleDiscardImage}
                onClose={handleCloseResults}
                onRetakePhoto={handleRetakePhoto}
                onRemixPrompt={handleRemixPrompt}
                onSubmitToWall={handleSubmitToWall}
              />
            </Card>
          )}

          {/* Sessions list */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Your Sessions</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sessions">Manage</Link>
              </Button>
            </div>
            {sessionsLoading ? (
              <div className="text-sm text-muted-foreground">Loading sessions…</div>
            ) : sessionsError ? (
              <div className="text-sm text-muted-foreground">Sign in to view your sessions.</div>
            ) : !sessions || sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sessions yet.</div>
            ) : (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.generator}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Images className="w-3 h-3 mr-1" /> {s._count.images}
                      </Badge>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/wall?session=${s.id}`}>
                          <ExternalLink className="w-3 h-3 mr-1" /> Wall
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
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

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-600">Preparing your photobooth experience</p>
        </div>
      </div>
    </div>
  )
}

export default function PhotoboothPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PhotoboothContent />
    </Suspense>
  )
}
