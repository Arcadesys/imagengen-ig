"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, RefreshCw, Sparkles, Repeat2, Search, ExternalLink, X } from "lucide-react"
import { useGeneratorSession } from "@/hooks/use-generator-session"

interface WallItem {
  id: string
  beforeImageUrl: string
  afterImageUrl: string
  style: string
  prompt?: string
  timestamp: string
  likesCount?: number
  session?: {
    id: string
    name: string
    generator: string
    createdAt: string
  } | null
}

export default function WallPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionFilter = searchParams.get("session") || ""

  // Use a lightweight generator session so guests can like
  const { sessionId } = useGeneratorSession("wall")

  const [items, setItems] = useState<WallItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>(searchParams.get("q") || "")
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Track per-item liked state
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (sessionFilter) params.set("session", sessionFilter)
      if (debouncedQuery) params.set("search", debouncedQuery)
      params.set("limit", "48")

      const res = await fetch(`/api/wall?${params.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load wall")
      const data = await res.json()
      const list: WallItem[] = data.transformations || []
      setItems(list)

      // seed like counts from API payload
      const counts: Record<string, number> = {}
      for (const it of list) counts[it.id] = it.likesCount ?? 0
      setLikeCounts(counts)

      // fetch liked status per item (best-effort)
      if (sessionId) {
        const statuses = await Promise.all(
          list.map(async (it) => {
            try {
              const r = await fetch(`/api/images/${it.id}/like?sessionId=${encodeURIComponent(sessionId)}`)
              if (r.ok) {
                const j = await r.json()
                return [it.id, !!j.userLiked] as const
              }
            } catch {}
            return [it.id, false] as const
          })
        )
        const likedMap: Record<string, boolean> = {}
        for (const [id, l] of statuses) likedMap[id] = l
        setLiked(likedMap)
      } else {
        setLiked({})
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load wall")
    } finally {
      setLoading(false)
    }
  }, [sessionFilter, debouncedQuery, sessionId])

  useEffect(() => {
    load()
  }, [load])

  // Keep URL in sync with search
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) params.set("q", query)
    else params.delete("q")
    router.replace(`/wall?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const toggleLike = async (imageId: string) => {
    if (!sessionId) return // session not ready yet
    try {
      const res = await fetch(`/api/images/${imageId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error("Failed to like")
      const j = await res.json()
      setLiked((prev) => ({ ...prev, [imageId]: !!j.liked }))
      setLikeCounts((prev) => ({ ...prev, [imageId]: Math.max(0, (prev[imageId] ?? 0) + (j.liked ? 1 : -1)) }))
    } catch (e) {
      // noop
    }
  }

  const remix = async (imageId: string, style: string) => {
    try {
      const res = await fetch(`/api/images/${imageId}/remix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, sessionId }),
      })
      if (!res.ok) throw new Error("Failed to prepare remix")
      const j = await res.json()
      if (j.redirectUrl) window.location.href = j.redirectUrl
    } catch (e) {
      // noop
    }
  }

  const clearSessionFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("session")
    router.replace(`/wall?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-fredoka">
              Community Wall
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {sessionFilter && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Session: {sessionFilter}
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={clearSessionFilter}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {items.length > 0 && (
                <Badge variant="outline">{items.length} results</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts or session names"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsRefreshing(true)
                load().finally(() => setIsRefreshing(false))
              }}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="text-sm text-red-600 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse h-80 bg-muted rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 mx-auto text-purple-600 mb-3" />
            <h2 className="text-xl font-semibold mb-1">No results</h2>
            <p className="text-muted-foreground mb-4">Try adjusting your search or add more photos.</p>
            <Button onClick={() => router.push("/")}>Start Creating</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((it) => {
              const isLiked = !!liked[it.id]
              const count = likeCounts[it.id] ?? 0
              return (
                <Card key={it.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="relative">
                      {/* Before */}
                      <img src={it.beforeImageUrl} alt="Before" className="w-full aspect-square object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary">Before</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-center py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs">
                      ↓ AI TRANSFORMATION ↓
                    </div>
                    <div className="relative">
                      {/* After */}
                      <img src={it.afterImageUrl} alt={`After ${it.style}`} className="w-full aspect-square object-cover" />
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-green-600 text-white border-0">After</Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-purple-600 text-white border-0">{it.style.toUpperCase()}</Badge>
                      </div>

                      {/* Actions overlay */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toggleLike(it.id)}>
                            <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                            {count}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => remix(it.id, it.style)}>
                            <Repeat2 className="h-4 w-4 mr-1" /> Remix
                          </Button>
                        </div>
                        <Button size="sm" asChild variant="secondary">
                          <a href={`/share/${it.id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" /> View
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Footer meta */}
                    <div className="px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                      <span>{new Date(it.timestamp).toLocaleString()}</span>
                      {it.session?.name && <span className="truncate max-w-[50%]" title={it.session.name}>{it.session.name}</span>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
