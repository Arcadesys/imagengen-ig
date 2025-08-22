"use client"

import { useEffect, useState } from "react"

export function useGeneratorSession(slug: string) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function ensureSession() {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/sessions/generator/${encodeURIComponent(slug)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || `Failed to create session (${res.status})`)
        }
        const j = await res.json()
        if (!cancelled) setSessionId(j?.session?.id || null)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to create session")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    ensureSession()
    return () => {
      cancelled = true
    }
  }, [slug])

  return { sessionId, loading, error }
}
