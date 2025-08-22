"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Copy, Edit, Trash2, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SessionCode {
  id: string
  code: string
  name?: string
  maxGenerations: number
  usedGenerations: number
  isActive: boolean
  expiresAt?: string
  createdAt: string
}

export default function AdminDashboard() {
  const [sessionCodes, setSessionCodes] = useState<SessionCode[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newSessionForm, setNewSessionForm] = useState({
    name: "",
    maxGenerations: 10,
    expiresInDays: 7,
  })
  const { toast } = useToast()

  // New: Danger Zone (wipe DB)
  const [wipeConfirm, setWipeConfirm] = useState("")
  const [wiping, setWiping] = useState(false)

  // New: Create Generation Session
  const [genSessionForm, setGenSessionForm] = useState({
    name: "",
    description: "",
    generator: "photobooth", // legacy string fallback
    generatorSlug: "", // optional dynamic generator
  })
  const [creatingGenSession, setCreatingGenSession] = useState(false)

  // New: Create Questions Flow/Prompt for a Generator
  const [questionsForm, setQuestionsForm] = useState({
    slug: "",
    title: "",
    intro: "",
    promptTemplate: "",
    questionsText: "",
  })
  const [savingQuestions, setSavingQuestions] = useState(false)

  // New: Create Generator
  const [newGenerator, setNewGenerator] = useState({
    slug: "",
    name: "",
    style: "",
    description: "",
    isActive: true as boolean,
  })
  const [creatingGenerator, setCreatingGenerator] = useState(false)

  const fetchSessionCodes = async () => {
    try {
      const response = await fetch("/api/admin/session-codes")
      if (!response.ok) throw new Error("Failed to fetch session codes")
      const data = await response.json()
      setSessionCodes(data.sessionCodes || [])
    } catch (error) {
      console.error("Error fetching session codes:", error)
      toast({
        title: "Error",
        description: "Failed to load session codes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789" // Excluding O and 0 for clarity
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const createSessionCode = async () => {
    try {
      const code = generateCode()
      const expiresAt = newSessionForm.expiresInDays 
        ? new Date(Date.now() + newSessionForm.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      const response = await fetch("/api/admin/session-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: newSessionForm.name || null,
          maxGenerations: newSessionForm.maxGenerations,
          expiresAt,
        }),
      })

      if (!response.ok) throw new Error("Failed to create session code")

      const data = await response.json()
      setSessionCodes((prev) => [data.sessionCode, ...prev])
      setCreateDialogOpen(false)
      setNewSessionForm({ name: "", maxGenerations: 10, expiresInDays: 7 })

      toast({
        title: "Session Code Created",
        description: `Code: ${code}`,
      })
    } catch (error) {
      console.error("Error creating session code:", error)
      toast({
        title: "Error",
        description: "Failed to create session code",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Copied!",
        description: `Session code ${code} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/session-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) throw new Error("Failed to update session code")

      const data = await response.json()
      setSessionCodes((prev) =>
        prev.map((sc) => (sc.id === id ? data.sessionCode : sc))
      )

      toast({
        title: "Updated",
        description: `Session code ${!isActive ? "activated" : "deactivated"}`,
      })
    } catch (error) {
      console.error("Error updating session code:", error)
      toast({
        title: "Error",
        description: "Failed to update session code",
        variant: "destructive",
      })
    }
  }

  const deleteSessionCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session code?")) return

    try {
      const response = await fetch(`/api/admin/session-codes/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete session code")

      setSessionCodes((prev) => prev.filter((sc) => sc.id !== id))

      toast({
        title: "Deleted",
        description: "Session code deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting session code:", error)
      toast({
        title: "Error",
        description: "Failed to delete session code",
        variant: "destructive",
      })
    }
  }

  // New: wipe database action
  const wipeDatabase = async () => {
    if (wipeConfirm !== "WIPE") {
      toast({ title: "Type WIPE to confirm", variant: "destructive" })
      return
    }
    setWiping(true)
    try {
      const res = await fetch("/api/admin/wipe-db?confirm=WIPE", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to wipe database")
      toast({ title: "Database wiped", description: JSON.stringify(data.deleted) })
      // Refresh session codes list after wipe (will be empty)
      setSessionCodes([])
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setWiping(false)
      setWipeConfirm("")
    }
  }

  // New: create generation session
  const createGenerationSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!genSessionForm.name.trim()) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    setCreatingGenSession(true)
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: genSessionForm.name,
          description: genSessionForm.description || undefined,
          generator: genSessionForm.generator || undefined,
          generatorSlug: genSessionForm.generatorSlug || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create session")
      toast({ title: "Session created", description: data.session?.id })
      setGenSessionForm({ name: "", description: "", generator: "photobooth", generatorSlug: "" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setCreatingGenSession(false)
    }
  }

  // New: save generator questions/prompt
  const loadSampleQuestions = () => {
    const sample = {
      title: "Photobooth Style",
      intro: "Answer a few quick questions to transform your photo.",
      questions: [
        { id: "style", text: "Choose a style", type: "multi-select", options: ["pixar", "anime", "comic", "watercolor"], allowCustom: false },
        { id: "vibe", text: "What vibe?", placeholder: "cool, energetic, vintage..." },
      ],
      promptTemplate:
        "A high-quality portrait in {{style}} style with a {{vibe}} vibe. Maintain the subject's exact clothing, pose, lighting, and background.",
      references: [
        { label: "Style guide", url: "/ai-pixar-style.png" },
      ],
    }
    setQuestionsForm((prev) => ({
      ...prev,
      title: sample.title,
      intro: sample.intro,
      promptTemplate: sample.promptTemplate,
      questionsText: JSON.stringify(sample.questions, null, 2),
    }))
  }

  const saveQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionsForm.slug.trim()) {
      toast({ title: "Slug required", variant: "destructive" })
      return
    }
    if (!questionsForm.title.trim() || !questionsForm.promptTemplate.trim()) {
      toast({ title: "Title and prompt template required", variant: "destructive" })
      return
    }
    let questions: any[]
    try {
      questions = JSON.parse(questionsForm.questionsText || "[]")
      if (!Array.isArray(questions)) throw new Error("Questions must be an array")
    } catch (err: any) {
      toast({ title: "Invalid questions JSON", description: err.message, variant: "destructive" })
      return
    }

    setSavingQuestions(true)
    try {
      const schema = {
        title: questionsForm.title,
        intro: questionsForm.intro || undefined,
        questions,
        promptTemplate: questionsForm.promptTemplate,
        references: undefined as any,
      }
      const res = await fetch(`/api/generators/${encodeURIComponent(questionsForm.slug)}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save questions")
      toast({ title: "Questions saved", description: questionsForm.slug })
      setQuestionsForm({ slug: "", title: "", intro: "", promptTemplate: "", questionsText: "" })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setSavingQuestions(false)
    }
  }

  const createGenerator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGenerator.slug.trim() || !newGenerator.name.trim()) {
      toast({ title: "Slug and name required", variant: "destructive" })
      return
    }
    setCreatingGenerator(true)
    try {
      const res = await fetch("/api/generators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newGenerator.slug,
          name: newGenerator.name,
          description: newGenerator.description || undefined,
          style: newGenerator.style || undefined,
          isActive: newGenerator.isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create generator")
      toast({ title: "Generator created", description: data.generator?.slug })
      setNewGenerator({ slug: "", name: "", style: "", description: "", isActive: true })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setCreatingGenerator(false)
    }
  }

  useEffect(() => {
    fetchSessionCodes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Tools</h2>
          <p className="text-muted-foreground">
            Quick actions for maintenance and generator setup
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSessionCodes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Session Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session Code</DialogTitle>
                <DialogDescription>
                  Create a new session code that users can use to access image generation features.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Workshop Session 1"
                    value={newSessionForm.name}
                    onChange={(e) =>
                      setNewSessionForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxGenerations">Max Generations</Label>
                  <Input
                    id="maxGenerations"
                    type="number"
                    min="1"
                    value={newSessionForm.maxGenerations}
                    onChange={(e) =>
                      setNewSessionForm((prev) => ({
                        ...prev,
                        maxGenerations: parseInt(e.target.value) || 10,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    min="1"
                    value={newSessionForm.expiresInDays}
                    onChange={(e) =>
                      setNewSessionForm((prev) => ({
                        ...prev,
                        expiresInDays: parseInt(e.target.value) || 7,
                      }))
                    }
                  />
                </div>
                <Button onClick={createSessionCode} className="w-full">
                  Create Session Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* New admin quick tools */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Type WIPE and click to erase non-auth data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="wipeConfirm">Confirm</Label>
            <Input id="wipeConfirm" placeholder="Type WIPE" value={wipeConfirm} onChange={(e) => setWipeConfirm(e.target.value)} />
            <Button variant="destructive" disabled={wiping || wipeConfirm !== "WIPE"} onClick={wipeDatabase}>
              {wiping ? "Wiping..." : "Wipe Database"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Session</CardTitle>
            <CardDescription>Quickly create a generation session</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createGenerationSession} className="space-y-3">
              <div>
                <Label htmlFor="gs-name">Name</Label>
                <Input id="gs-name" value={genSessionForm.name} onChange={(e) => setGenSessionForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="gs-desc">Description</Label>
                <Input id="gs-desc" value={genSessionForm.description} onChange={(e) => setGenSessionForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="gs-generator">Generator (legacy)</Label>
                <Input id="gs-generator" placeholder="e.g., turn-toon, puppetray, photobooth" value={genSessionForm.generator} onChange={(e) => setGenSessionForm((p) => ({ ...p, generator: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="gs-slug">Generator Slug (dynamic, optional)</Label>
                <Input id="gs-slug" placeholder="e.g., photobooth" value={genSessionForm.generatorSlug} onChange={(e) => setGenSessionForm((p) => ({ ...p, generatorSlug: e.target.value }))} />
              </div>
              <Button type="submit" disabled={creatingGenSession}>{creatingGenSession ? "Creating..." : "Create"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Generator</CardTitle>
            <CardDescription>Make a generator slug to attach questions</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createGenerator} className="space-y-3">
              <div>
                <Label htmlFor="gen-slug">Slug</Label>
                <Input id="gen-slug" value={newGenerator.slug} onChange={(e) => setNewGenerator((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g., photobooth" />
              </div>
              <div>
                <Label htmlFor="gen-name">Name</Label>
                <Input id="gen-name" value={newGenerator.name} onChange={(e) => setNewGenerator((p) => ({ ...p, name: e.target.value }))} placeholder="Display name" />
              </div>
              <div>
                <Label htmlFor="gen-style">Style (optional)</Label>
                <Input id="gen-style" value={newGenerator.style} onChange={(e) => setNewGenerator((p) => ({ ...p, style: e.target.value }))} placeholder="turn-toon, puppetray..." />
              </div>
              <div>
                <Label htmlFor="gen-desc">Description</Label>
                <Input id="gen-desc" value={newGenerator.description} onChange={(e) => setNewGenerator((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <input id="gen-active" type="checkbox" checked={newGenerator.isActive} onChange={(e) => setNewGenerator((p) => ({ ...p, isActive: e.target.checked }))} />
                <Label htmlFor="gen-active">Active</Label>
              </div>
              <Button type="submit" disabled={creatingGenerator}>{creatingGenerator ? "Creating..." : "Create"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questions & Prompt</CardTitle>
            <CardDescription>Attach a flow to a generator slug</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveQuestions} className="space-y-3">
              <div>
                <Label htmlFor="q-slug">Generator Slug</Label>
                <Input id="q-slug" value={questionsForm.slug} onChange={(e) => setQuestionsForm((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="q-title">Title</Label>
                <Input id="q-title" value={questionsForm.title} onChange={(e) => setQuestionsForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="q-intro">Intro (optional)</Label>
                <Input id="q-intro" value={questionsForm.intro} onChange={(e) => setQuestionsForm((p) => ({ ...p, intro: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="q-prompt">Prompt Template</Label>
                <Input id="q-prompt" value={questionsForm.promptTemplate} onChange={(e) => setQuestionsForm((p) => ({ ...p, promptTemplate: e.target.value }))} placeholder="Use tokens like {{style}}" />
              </div>
              <div>
                <Label htmlFor="q-questions">Questions (JSON array)</Label>
                <textarea id="q-questions" className="w-full border rounded p-2 text-sm min-h-28 bg-background" value={questionsForm.questionsText} onChange={(e) => setQuestionsForm((p) => ({ ...p, questionsText: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={loadSampleQuestions}>Load sample</Button>
                <Button type="submit" disabled={savingQuestions}>{savingQuestions ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Existing: Session Codes Management */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Codes</h2>
          <p className="text-muted-foreground">
            Create and manage session codes for users to access image generation
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {sessionCodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No session codes created yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Session Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          sessionCodes.map((sessionCode) => {
            const isExpired = sessionCode.expiresAt && new Date(sessionCode.expiresAt) < new Date()
            const usagePercentage = (sessionCode.usedGenerations / sessionCode.maxGenerations) * 100

            return (
              <Card key={sessionCode.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <code className="text-lg font-mono bg-muted px-2 py-1 rounded">
                          {sessionCode.code}
                        </code>
                        {sessionCode.name && (
                          <span className="text-base font-normal text-muted-foreground">
                            {sessionCode.name}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Created {new Date(sessionCode.createdAt).toLocaleDateString()}
                        {sessionCode.expiresAt && (
                          <span>
                            {" • "}
                            Expires {new Date(sessionCode.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sessionCode.isActive && !isExpired ? "default" : "secondary"}>
                        {isExpired ? "Expired" : sessionCode.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <div className="font-medium">Generations Used</div>
                        <div className="text-muted-foreground">
                          {sessionCode.usedGenerations} / {sessionCode.maxGenerations}
                        </div>
                      </div>
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(sessionCode.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(sessionCode.id, sessionCode.isActive)}
                        disabled={!!isExpired}
                      >
                        {sessionCode.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSessionCode(sessionCode.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
