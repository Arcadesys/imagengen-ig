"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Copy, KeyRound } from "lucide-react"

export default function QuickSetupPage() {
  const [sessionCode, setSessionCode] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const createQuickSession = async () => {
    setLoading(true)
    try {
      const code = generateCode()
      
      // Create directly in database (bypassing auth for quick setup)
      const response = await fetch("/api/session-codes/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: "Quick Setup Session",
          maxGenerations: 10,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create session code")
      }

      const data = await response.json()
      setSessionCode(data.sessionCode.code)

      toast({
        title: "Session Code Created!",
        description: `Use code: ${data.sessionCode.code}`,
      })
    } catch (error: any) {
      console.error("Error creating session code:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create session code",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode)
      toast({
        title: "Copied!",
        description: "Session code copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Quick Session Setup</CardTitle>
          <CardDescription>
            Create a session code for testing the photobooth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionCode ? (
            <Button 
              onClick={createQuickSession} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Session Code"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  Session Code Created!
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded border">
                    {sessionCode}
                  </code>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This session code has 10 generations and can be used to test the photobooth.
                </p>
                <p className="text-sm font-medium">
                  Go to{" "}
                  <a 
                    href="/photobooth" 
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    /photobooth
                  </a>
                  {" "}and enter this code.
                </p>
              </div>

              <Button 
                onClick={() => setSessionCode("")} 
                variant="outline"
                className="w-full"
              >
                Create Another Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
