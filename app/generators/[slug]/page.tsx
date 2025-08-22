"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SessionSelector } from "@/components/session-selector"

interface Generator {
  id: string
  slug: string
  name: string
  description?: string
  style?: string
  theme?: any
}

export default function GeneratorDetail({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [generator, setGenerator] = useState<Generator | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/generators/${params.slug}`).then(async (r) => {
      if (!r.ok) return
      const data = await r.json()
      setGenerator(data.generator)
    })
  }, [params.slug])

  const theme = generator?.theme || {}

  return (
    <main className={`min-h-dvh ${theme.gradientBg || 'bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-black'}`}>
      <header className={`border-b ${theme.headerBg || 'bg-white/70 dark:bg-black/50 backdrop-blur'}`}>
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className={`text-xl font-bold ${theme.accent || ''}`}>{generator?.name || 'Generator'}</h1>
          <Button variant="outline" onClick={() => router.push('/generators')} className={theme.buttonSecondary || ''}>All Generators</Button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">{generator?.description}</p>
        </Card>

        <SessionSelector
          generator={generator?.style || generator?.slug || 'custom'}
          generatorSlug={generator?.slug}
          selectedSessionId={sessionId}
          onSessionChange={setSessionId}
          className={theme.card || ''}
        />

        <Card className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button className={theme.buttonPrimary || ''} onClick={async () => {
              // Create a session for this generator if none selected
              let sid = sessionId
              if (!sid && generator) {
                const r = await fetch(`/api/sessions`, { 
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: `${generator.name} Session`, generatorSlug: generator.slug })
                })
                if (r.ok) {
                  const d = await r.json()
                  sid = d.session.id
                  setSessionId(sid)
                }
              }
              // Route user to a specific app page based on style hint
              const style = generator?.style || generator?.slug
              if (style?.includes('toon')) router.push(`/turn-toon?generator=${generator?.slug}`)
              else if (style?.includes('puppet')) router.push(`/puppetray?generator=${generator?.slug}`)
              else router.push(`/generate?generator=${generator?.slug}`)
            }}>Start</Button>
            {/* Owner tools */}
            <Button variant="outline" className={theme.buttonSecondary || ''} onClick={() => router.push(`/generators/${generator?.slug}/edit`)}>Edit</Button>
          </div>
        </Card>
      </div>
    </main>
  )
}
