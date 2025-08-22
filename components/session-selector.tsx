"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings2, ChevronDown } from "lucide-react"

interface Session {
  id: string
  name: string
  generator: string
  _count: { images: number }
}

interface SessionSelectorProps {
  generator: string
  selectedSessionId?: string | null
  onSessionChange: (sessionId: string | null) => void
  className?: string
}

export function SessionSelector({ 
  generator, 
  selectedSessionId, 
  onSessionChange,
  className = ""
}: SessionSelectorProps) {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSessionName, setNewSessionName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadSessions()
    }
  }, [session, generator])

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?generator=${generator}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async () => {
    if (!newSessionName.trim()) return

    setCreating(true)
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSessionName,
          generator,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(prev => [data.session, ...prev])
        onSessionChange(data.session.id)
        setNewSessionName("")
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error("Error creating session:", error)
    } finally {
      setCreating(false)
    }
  }

  // Don't show the selector if user is not authenticated
  if (!session?.user) {
    return null
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Session</CardTitle>
        <CardDescription className="text-xs">
          Group your generations into organized sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Session Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Active Session</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-8 justify-between text-xs">
                <span>
                  {selectedSessionId ? 
                    sessions.find(s => s.id === selectedSessionId)?.name || "Unknown Session" :
                    "No session (ungrouped)"
                  }
                </span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem onClick={() => onSessionChange(null)}>
                <span className="text-muted-foreground">No session (ungrouped)</span>
              </DropdownMenuItem>
              {sessions.map(session => (
                <DropdownMenuItem 
                  key={session.id} 
                  onClick={() => onSessionChange(session.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1">{session.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {session._count.images}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Create Session */}
        {!showCreateForm ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="w-full h-8 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Session
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Session name..."
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") createSession()
                if (e.key === "Escape") setShowCreateForm(false)
              }}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={createSession}
                disabled={creating || !newSessionName.trim()}
                className="h-7 text-xs flex-1"
              >
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewSessionName("")
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
