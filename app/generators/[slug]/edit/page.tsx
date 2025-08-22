"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function EditGeneratorPage() {
  const router = useRouter()
  const params = useParams() as { slug: string }
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    style: "",
    config: "{}",
    theme: "{}",
    isActive: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const r = await fetch(`/api/generators/${params.slug}`)
      if (!r.ok) {
        setError("Failed to load generator")
        setLoading(false)
        return
      }
      const d = await r.json()
      setForm({
        name: d.generator.name || "",
        slug: d.generator.slug || "",
        description: d.generator.description || "",
        style: d.generator.style || "",
        config: JSON.stringify(d.generator.config || {}, null, 2),
        theme: JSON.stringify(d.generator.theme || {}, null, 2),
        isActive: !!d.generator.isActive,
      })
      setLoading(false)
    }
    load()
  }, [params.slug])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body: any = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        style: form.style.trim() || null,
        isActive: form.isActive,
      }
      try { body.config = form.config ? JSON.parse(form.config) : null } catch { throw new Error("Config must be valid JSON") }
      try { body.theme = form.theme ? JSON.parse(form.theme) : null } catch { throw new Error("Theme must be valid JSON") }
      if (form.slug && form.slug !== params.slug) body.slug = form.slug.trim().toLowerCase()

      const res = await fetch(`/api/generators/${params.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save")
      }
      const data = await res.json()
      router.push(`/generators/${data.generator.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this generator? This does not delete sessions or images.")) return
    setSaving(true)
    try {
      const r = await fetch(`/api/generators/${params.slug}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Failed to delete")
      router.push("/generators")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Generator</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/generators/${params.slug}`)}>Back</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Style Hint</Label>
            <Input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} />
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
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
