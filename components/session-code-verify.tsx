"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { KeyRound, Sparkles, Users } from "lucide-react"

interface SessionCodeVerifyProps {
  onVerified: (sessionCode: any) => void
}

export function SessionCodeVerify({ onVerified }: SessionCodeVerifyProps) {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/session-codes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invalid session code")
      }

      if (data.valid) {
        toast({
          title: "Access Granted!",
          description: `${data.remainingGenerations} generations remaining`,
        })
        onVerified(data.sessionCode)
      }
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Invalid session code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Enter Session Code</CardTitle>
          <CardDescription>
            Enter the session code provided by your administrator to access the AI photobooth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Session Code</Label>
              <Input
                id="code"
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={9}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Access Photobooth
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Don't have a session code? Contact your administrator.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
