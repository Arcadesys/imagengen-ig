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
          <h2 className="text-2xl font-bold">Session Codes</h2>
          <p className="text-muted-foreground">
            Create and manage session codes for users to access image generation
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
