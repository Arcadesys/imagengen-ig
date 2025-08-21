"use client"

import { useState, useMemo } from "react"
import { EnhancedImageUpload } from "@/components/enhanced-image-upload"
import { WebcamCapture } from "@/components/webcam-capture"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { GenerationResults } from "@/components/generation-results"
import type { GeneratedImage } from "@/lib/types"
import { generatePuppetPrompt, type PuppetStyle } from "@/lib/puppet-prompts"

const PUPPET_STYLES = ["sock", "muppet", "mascot", "felt", "paper", "plush"] as const

type Size = "512x512" | "768x768" | "1024x1024"

export default function PuppetrayPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [baseImageId, setBaseImageId] = useState<string | null>(null)

  const [puppetStyle, setPuppetStyle] = useState<PuppetStyle>("muppet")
  const [species, setSpecies] = useState<string>("human")
  const [action, setAction] = useState<string>("waving at the camera")
  const [size, setSize] = useState<Size>("512x512")
  const [n, setN] = useState<number>(1)
  const [seed, setSeed] = useState<string>("")

  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<GeneratedImage[]>([])

  const userPrompt = useMemo(() => {
    const bits = [
      species ? `Species: ${species}` : "",
      action ? `Action: ${action}` : "",
    ].filter(Boolean)
    return bits.join(". ")
  }, [species, action])

  async function generate() {
    if (!baseImageId) {
      toast({ title: "Upload a photo first", description: "Upload or take a webcam shot.", variant: "destructive" })
      setActiveTab("upload")
      return
    }
    setIsGenerating(true)
    setResults([])
    try {
      // Generate the puppet transformation prompt
      const puppetPrompt = generatePuppetPrompt(puppetStyle, userPrompt, false)

      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: puppetPrompt,
          size,
          n: n,
          seed: seed.trim() || undefined,
          baseImageId,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Generation failed (${res.status})`)
      }
      const data = await res.json()
      setResults(data.images || [])
    } catch (e) {
      console.error(e)
      toast({ title: "Generation failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-black dark:to-neutral-900 text-black dark:text-white">
      <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Puppet Photobooth</h1>
          <div className="text-xs sm:text-sm text-muted-foreground">Turn your photo into a puppet — kiosk mode</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6 grid gap-6 lg:grid-cols-2">
        {/* Left: Capture/Upload */}
        <section className="space-y-4">
          <Card className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="webcam">Webcam</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="webcam" className="mt-4">
                <WebcamCapture
                  onUpload={(id, url) => {
                    setBaseImageId(id)
                    setBaseImage(url)
                  }}
                  onCancel={() => setActiveTab("upload")}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <EnhancedImageUpload
                  onUpload={(id, url) => {
                    setBaseImageId(id)
                    setBaseImage(url)
                  }}
                  onRemove={() => {
                    setBaseImage(null)
                    setBaseImageId(null)
                    setActiveTab("upload")
                  }}
                  onMaskChange={() => {}} // No-op since we don't use masks
                  uploadedImage={baseImage ? { id: baseImageId ?? "", url: baseImage } : null}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </section>

        {/* Right: Big, touch-friendly controls */}
        <section className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-2">Pick your puppet style</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PUPPET_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPuppetStyle(s)}
                      className={`rounded-lg border px-3 py-3 text-sm font-medium capitalize transition ${puppetStyle === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="species" className="text-sm">Species</Label>
                  <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="e.g., human, cat, dragon" className="h-11 text-base" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="action" className="text-sm">Action</Label>
                  <Input id="action" value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g., waving, holding a coffee" className="h-11 text-base" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="size" className="text-sm">Size</Label>
                  <select id="size" className="h-11 px-3 rounded-md border bg-background" value={size} onChange={(e) => setSize(e.target.value as Size)}>
                    {( ["512x512", "768x768", "1024x1024"] as Size[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Non-admin requests are forced to 512x512.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="n" className="text-sm">Variations</Label>
                  <Input
                    id="n"
                    type="number"
                    min={1}
                    max={4}
                    value={n}
                    onChange={(e) => setN(Number(e.target.value))}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seed" className="text-sm">Seed (optional)</Label>
                  <Input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="repeatability" className="h-11 text-base" />
                </div>
              </div>

              <div className="pt-2">
                <Button onClick={generate} disabled={isGenerating || !baseImageId} className="h-12 w-full text-base">
                  {isGenerating ? "Generating…" : "Turn me into a puppet"}
                </Button>
                {!baseImageId && (
                  <p className="text-xs text-muted-foreground mt-2">Capture or upload a photo first.</p>
                )}
              </div>
            </div>
          </Card>

          {userPrompt && (
            <Card className="p-4">
              <div className="text-sm font-medium mb-1">Prompt preview</div>
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{userPrompt}</pre>
            </Card>
          )}
        </section>

        {results.length > 0 && (
          <section className="lg:col-span-2">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Results</h2>
              <GenerationResults
                images={results}
                onSave={async (img) => {
                  await fetch("/api/gallery", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: img.id,
                      url: img.url,
                      prompt: img.metadata.expandedPrompt || img.metadata.prompt,
                      size: img.metadata.size,
                      seed: img.metadata.seed,
                      baseImageId: img.metadata.baseImageId || null,
                    }),
                  })
                  toast({ title: "Saved to gallery" })
                }}
                onDiscard={async (id) => {
                  setResults((prev) => prev.filter((x) => x.id !== id))
                }}
              />
            </Card>
          </section>
        )}
      </main>
    </div>
  )
}
