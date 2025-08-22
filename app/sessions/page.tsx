"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Settings, Trash2, ExternalLink, Images } from "lucide-react"
import Link from "next/link"

interface GenerationSession {
  id: string
  name: string
  description?: string
  generator: string
  createdAt: string
  images: Array<{ id: string; url: string; kind: string; createdAt: string }>
  _count: { images: number }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<GenerationSession[]>([])
  const [loading, setLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    generator: "turn-toon"
  })

  const generators = [
    { value: "turn-toon", label: "Turn Toon" },
    { value: "puppetray", label: "Puppet Photobooth" },
    { value: "photobooth", label: "Session Photobooth" },
    { value: "generate", label: "Style Transform" }
  ]

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      } else {
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
      toast({
        title: "Error",
        description: "Failed to load sessions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Error", 
        description: "Session name is required",
        variant: "destructive"
      })
      return
    }

    setCreateLoading(true)
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(prev => [data.session, ...prev])
        setFormData({ name: "", description: "", generator: "turn-toon" })
        setShowCreateForm(false)
        toast({
          title: "Success",
          description: "Session created successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create session",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive"
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? Images will be unlinked but not deleted.")) {
      return
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        toast({
          title: "Success",
          description: "Session deleted successfully"
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete session",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive"
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Generation Sessions</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage sessions to group your AI-generated images
              </p>
            </div>
            
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Session
            </Button>
          </div>

          {/* Create Session Form */}
          {showCreateForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Session</CardTitle>
                <CardDescription>
                  Create a session to group images from a specific generator or project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createSession} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Session Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Party Photos, Character Designs..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="generator">Generator</Label>
                      <Select 
                        value={formData.generator} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, generator: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generators.map(gen => (
                            <SelectItem key={gen.value} value={gen.value}>
                              {gen.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose or theme of this session..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? "Creating..." : "Create Session"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sessions List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first session to start organizing your AI-generated images
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map(session => (
                <Card key={session.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{session.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {generators.find(g => g.value === session.generator)?.label || session.generator}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Images className="w-3 h-3 mr-1" />
                            {session._count.images} images
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSession(session.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {session.description && (
                    <CardContent className="pt-0 pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.description}
                      </p>
                    </CardContent>
                  )}

                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button 
                        asChild
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        <Link href={`/wall?session=${session.id}`}>
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Wall
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Created {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
