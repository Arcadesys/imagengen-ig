'use client'

// Next.js dynamic config – ensure this page is always dynamic (no caching)
export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { sanitizePromptForImage } from '@/lib/prompt-sanitizer'
import { WebcamCapture } from '@/components/webcam-capture'
import { uploadImageViaApi } from '@/lib/client-upload'

export default function DinosonaPage() {
  const [species, setSpecies] = useState('velociraptor')
  const [colors, setColors] = useState('teal and purple')
  const [personality, setPersonality] = useState('playful and curious')
  const [accessory, setAccessory] = useState('wearing a tiny hoodie')
  const [background, setBackground] = useState('sunny park with ferns')
  const [style, setStyle] = useState('cute stylized illustration, soft shading, studio quality')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [baseImageId, setBaseImageId] = useState<string | null>(null)
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(null)

  const composedPrompt = useMemo(() => {
    const raw = [
      `A ${species} dinosona character`,
      `colors: ${colors}`,
      `personality: ${personality}`,
      `accessory: ${accessory}`,
      `background: ${background}`,
      `style: ${style}`,
      'friendly, family-friendly, highly detailed, character turntable ready',
    ].join('. ')
    return sanitizePromptForImage(raw)
  }, [species, colors, personality, accessory, background, style])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setImageUrl(null)
    try {
      if (!baseImageId) {
        throw new Error('Please take a photo first')
      }
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: composedPrompt, size: '1024x1024', n: 1, baseImageId }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Generation failed (${res.status})`)
      }
      const j = await res.json()
      const first = j?.images?.[0]?.url as string | undefined
      if (!first) throw new Error('No image returned')
      setImageUrl(first)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSamplePhoto() {
    try {
      // Use a tiny PNG-like blob to avoid atob/File reliance in tests
      const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])
      const blob = new Blob([bytes], { type: 'image/png' })
      const uploaded = await uploadImageViaApi(blob, 'sample.png')
      setBaseImageId(uploaded.baseImageId)
      setBaseImageUrl(uploaded.url)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to add sample photo')
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Dinosona Generator</h1>
        <p className="text-muted-foreground">Photobooth: take a base photo, then generate your dinosaur persona.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="font-semibold">Step 1: Take a photo</h2>
              <p className="text-sm text-muted-foreground">We’ll transform the subject into a dinosona and keep your background.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <WebcamCapture
                onUpload={(id, url) => { setBaseImageId(id); setBaseImageUrl(url); setError(null) }}
                disabled={isGenerating}
              />
              <Card className="p-4 flex flex-col items-center justify-center">
                {baseImageUrl ? (
                  <img src={baseImageUrl} alt="Captured photo" className="rounded max-w-full h-auto" />
                ) : (
                  <div className="text-sm text-muted-foreground text-center">
                    No photo captured yet.
                  </div>
                )}
                <div className="mt-3">
                  <Button type="button" variant="outline" onClick={handleSamplePhoto} data-testid="use-sample-photo">
                    Use sample photo
                  </Button>
                </div>
              </Card>
            </div>
          </Card>

          <Card className="p-6">
            <form className="space-y-4" onSubmit={handleGenerate} aria-label="dinosona-form">
              <div className="mb-2 text-sm">
                <span className={baseImageId ? 'text-green-700' : 'text-red-700'}>
                  {baseImageId ? 'Photo ready ✓' : 'Please take a photo to enable Generate'}
                </span>
              </div>
              <div>
                <label htmlFor="species" className="block text-sm font-medium">Species</label>
                <input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="e.g., triceratops" />
              </div>
              <div>
                <label htmlFor="colors" className="block text-sm font-medium">Colors</label>
                <input id="colors" value={colors} onChange={(e) => setColors(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="e.g., teal and purple" />
              </div>
              <div>
                <label htmlFor="personality" className="block text-sm font-medium">Personality</label>
                <input id="personality" value={personality} onChange={(e) => setPersonality(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="e.g., brave, kind" />
              </div>
              <div>
                <label htmlFor="accessory" className="block text-sm font-medium">Accessory</label>
                <input id="accessory" value={accessory} onChange={(e) => setAccessory(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="e.g., scarf, headphones" />
              </div>
              <div>
                <label htmlFor="background" className="block text-sm font-medium">Background</label>
                <input id="background" value={background} onChange={(e) => setBackground(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="e.g., prehistoric jungle" />
              </div>
              <div>
                <label htmlFor="style" className="block text-sm font-medium">Art Style</label>
                <input id="style" value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full rounded border p-2" placeholder="e.g., watercolor illustration" />
              </div>

              <Card className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground" aria-label="composed-prompt">{composedPrompt}</p>
              </Card>

              <div className="flex gap-2">
                <Button type="submit" disabled={isGenerating || !baseImageId}>{isGenerating ? 'Generating…' : 'Generate'}</Button>
                <Button type="button" variant="outline" onClick={() => setImageUrl(null)}>Clear</Button>
              </div>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            </form>
          </Card>
        </div>

        <Card className="p-6 min-h-[300px] flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Generated dinosona" className="max-w-full h-auto rounded" />
          ) : (
            <p className="text-muted-foreground">Your result will appear here.</p>
          )}
        </Card>
      </div>
    </main>
  )
}
