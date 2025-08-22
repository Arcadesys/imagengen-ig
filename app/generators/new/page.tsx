"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NewGeneratorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    style: "",
    config: "{\n  \"prompt\": \"\"\n}",
    theme: `{
  "gradientBg": "bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-black",
  "headerBg": "bg-white/70 dark:bg-black/50 backdrop-blur",
  "accent": "text-purple-600",
  "buttonPrimary": "bg-purple-600 hover:bg-purple-700 text-white",
  "buttonSecondary": "bg-white hover:bg-gray-50"
}`,
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body: any = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        style: form.style.trim() || null,
        isActive: form.isActive,
      }
      try {
        body.config = form.config ? JSON.parse(form.config) : null
      } catch {
        throw new Error("Config must be valid JSON")
      }
      try {
        body.theme = form.theme ? JSON.parse(form.theme) : null
      } catch {
        throw new Error("Theme must be valid JSON")
      }

      const res = await fetch("/api/generators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to create generator")
      }

      const data = await res.json()
      router.push(`/generators/${data.generator.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Generator</h1>
        <Button variant="outline" onClick={() => router.push("/generators")}>Back</Button>
      </div>

      <Card className="p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="e.g., turn-toon" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Style Hint</Label>
            <Input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="e.g., turn-toon, puppetray" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Config (JSON)</Label>
              <Textarea value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} rows={10} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Theme (JSON)</Label>
              <Textarea value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} rows={10} className="font-mono text-xs" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Create Generator"}</Button>
            <Button type="button" variant="outline" onClick={() => setForm({ ...form, isActive: !form.isActive })}>
              {form.isActive ? "Active" : "Inactive"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
