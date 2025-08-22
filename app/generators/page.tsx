"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Generator {
  id: string
  slug: string
  name: string
  description?: string
  isActive: boolean
}

export default function GeneratorsDirectory() {
  const [generators, setGenerators] = useState<Generator[]>([])

  useEffect(() => {
    fetch("/api/generators?active=true").then(async (r) => {
      if (!r.ok) return
      const data = await r.json()
      setGenerators(data.generators || [])
    })
  }, [])

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Photo Generators</h1>
          <p className="text-muted-foreground">Pick a generator to start a themed session.</p>
        </div>
        <Button asChild>
          <Link href="/generators/new">Create</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generators.map((g) => (
          <Card key={g.id} className="p-4 flex items-start justify-between">
            <div>
              <h2 className="font-semibold">{g.name}</h2>
              <p className="text-sm text-muted-foreground">{g.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {!g.isActive && <span className="text-xs px-2 py-1 rounded bg-muted">Inactive</span>}
              <Button asChild>
                <Link href={`/generators/${g.slug}`}>Open</Link>
              </Button>
            </div>
          </Card>
        ))}
        {generators.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">No generators yet.</Card>
        )}
      </div>
    </main>
  )
}
