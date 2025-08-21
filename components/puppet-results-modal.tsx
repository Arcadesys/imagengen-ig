"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Mail, Share2, Sparkles, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { GeneratedImage } from "@/lib/types"

interface PuppetResultsModalProps {
  isOpen: boolean
  onClose: () => void
  onStartOver: () => void
  results: GeneratedImage[]
  puppetConfig?: {
    style: string
    gender: string
    species: string
    personality: string
  }
}

export function PuppetResultsModal({
  isOpen,
  onClose,
  onStartOver,
  results,
  puppetConfig
}: PuppetResultsModalProps) {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      // Send email with the original file
      const response = await fetch("/api/send-puppet-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          imageIds: results.map(r => r.id),
          puppetConfig
        })
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      toast({
        title: "Email sent!",
        description: "Check your inbox for your high-resolution puppet image!",
      })
      
      setShowEmailForm(false)
      setEmail("")
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "Please try again or contact support.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my puppet transformation!",
          text: `I just turned into a ${puppetConfig?.style} ${puppetConfig?.species} puppet!`,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy URL to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Share this link to show off your puppet transformation!",
      })
    }
  }

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `puppet-${image.id}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Downloaded!",
        description: "Your puppet image has been saved to your device.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again or right-click to save the image.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200">
                  Congratulations, you're a puppet! 🎭
                </h2>
                <p className="text-green-600 dark:text-green-400">
                  Your transformation is complete!
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Puppet Config Summary */}
          {puppetConfig && (
            <Card className="p-4 mb-6 bg-muted/20">
              <h3 className="font-semibold mb-3">Your Puppet Details</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {puppetConfig.style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} style
                </Badge>
                {puppetConfig.gender && (
                  <Badge variant="secondary">
                    {puppetConfig.gender}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {puppetConfig.species}
                </Badge>
                <Badge variant="secondary">
                  {puppetConfig.personality}
                </Badge>
              </div>
            </Card>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {results.map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={`Puppet transformation ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(image)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(image)}
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Email Form */}
          {!showEmailForm ? (
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <Mail className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
                Want a copy?
              </h3>
              <p className="text-blue-600 dark:text-blue-400 mb-4">
                Sign up and we'll send you the original high-resolution file!
              </p>
              <Button 
                onClick={() => setShowEmailForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get My High-Res Puppet!
              </Button>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">
                    Enter your email
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                    We'll send you the original file and keep you updated on new puppet features!
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-800 dark:text-blue-200">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="border-blue-200 dark:border-blue-700 focus:border-blue-400"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Sending..." : "Send Me My Puppet!"}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailForm(false)}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                  >
                    Maybe Later
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20 flex justify-center">
          <Button onClick={onStartOver} variant="outline" size="lg">
            Create Another Puppet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
