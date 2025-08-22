"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Mail, Share2, Sparkles, X, Camera, RefreshCw, Palette, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { GeneratedImage } from "@/lib/types"

interface ToonResultsModalProps {
  isOpen: boolean
  onClose: () => void
  onStartOver: () => void
  onRetakePhoto?: () => void
  onRemixPrompt?: () => void
  onSubmitToWall?: (image: GeneratedImage) => void
  results: GeneratedImage[]
  toonConfig?: {
    style: string
    gender?: string
    species?: string
    personality?: string
  }
}

export function ToonResultsModal({
  isOpen,
  onClose,
  onStartOver,
  onRetakePhoto,
  onRemixPrompt,
  onSubmitToWall,
  results,
  toonConfig,
}: ToonResultsModalProps) {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/send-toon-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          imageIds: results.map((r) => r.id),
          toonConfig,
        }),
      })

      if (!response.ok) throw new Error("Failed to send email")

      toast({ title: "Email sent!", description: "Check your inbox for your high-resolution toon!" })
      setShowEmailForm(false)
      setEmail("")
    } catch (error) {
      toast({ title: "Failed to send email", description: "Please try again.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my toon!",
          text: `I just turned into a ${toonConfig?.style} ${toonConfig?.species || "human"} toon!`,
          url: window.location.href,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: "Link copied!", description: "Share the link to show off your toon!" })
    }
  }

  const handleSubmitToWall = async (image: GeneratedImage) => {
    try {
      onSubmitToWall?.(image)
      toast({ title: "Submitted to Wall!", description: "Your toon will appear on the live wall." })
    } catch {
      toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" })
    }
  }

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `toon-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: "Downloaded!", description: "Saved to your device." })
    } catch {
      toast({ title: "Download failed", description: "Try again or right-click to save.", variant: "destructive" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">You're a Toon! 🎨</h2>
                <p className="text-yellow-700 dark:text-yellow-400">Your animation-style transformation is complete.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {toonConfig && (
            <Card className="p-4 mb-6 bg-muted/20">
              <h3 className="font-semibold mb-3">Your Toon Details</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{toonConfig.style}</Badge>
                {toonConfig.gender && <Badge variant="secondary">{toonConfig.gender}</Badge>}
                <Badge variant="secondary">{toonConfig.species || "human"}</Badge>
                {toonConfig.personality && <Badge variant="secondary">{toonConfig.personality}</Badge>}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {results.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img src={image.url} alt={`Toon ${index + 1}`} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(image)} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare(image)} className="flex-1">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSubmitToWall(image)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit to Wall
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {!showEmailForm ? (
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <Mail className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">Want a copy?</h3>
              <p className="text-blue-600 dark:text-blue-400 mb-4">We'll email you the original high-res file.</p>
              <Button onClick={() => setShowEmailForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Get My High-Res Toon
              </Button>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">Enter your email</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">We'll send the file and occasional updates.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-800 dark:text-blue-200">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" required className="border-blue-200 dark:border-blue-700 focus:border-blue-400" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? "Sending..." : "Send Me My Toon"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEmailForm(false)} className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400">
                    Maybe Later
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div className="p-6 border-t bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <div className="flex gap-3">
              {onRetakePhoto && (
                <Button onClick={onRetakePhoto} variant="outline" size="lg">
                  <Camera className="w-4 h-4 mr-2" />
                  Retake Photo
                </Button>
              )}
              {onRemixPrompt && (
                <Button onClick={onRemixPrompt} variant="outline" size="lg">
                  <Palette className="w-4 h-4 mr-2" />
                  Remix Prompt
                </Button>
              )}
              <Button onClick={onStartOver} variant="outline" size="lg">
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
