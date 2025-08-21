"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Sparkles, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmailSignupModalProps {
  isOpen: boolean
  onClose: () => void
  // `onSubmit` returns true on success; throws on error
  onSubmit: (email: string, preferences: EmailPreferences, source: string) => Promise<boolean>
  // Identifies where the signup was initiated from (e.g., 'generation_modal')
  source: string
  title?: string
  description?: string
}

interface EmailPreferences {
  productUpdates: boolean
  newFeatures: boolean
  tips: boolean
  promotions: boolean
}

export function EmailSignupModal({
  isOpen,
  onClose,
  onSubmit,
  source,
  title = "Stay updated while we generate your image!",
  description = "Get notified about new features, tips, and product updates. Your email will never be shared."
}: EmailSignupModalProps) {
  const [email, setEmail] = useState("")
  const [preferences, setPreferences] = useState<EmailPreferences>({
    productUpdates: true,
    newFeatures: true,
    tips: false,
    promotions: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const ok = await onSubmit(email, preferences, source)
      toast({
        title: "Thanks for signing up!",
        description: "You'll receive updates about your generated images and new features.",
      })
      // The hook will close itself on success; also close here for non-hook callers
      onClose()
    } catch (error) {
      console.error("Email signup error:", error)
      toast({
        title: "Signup failed",
        description: "There was an error signing you up. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreferenceChange = (key: keyof EmailPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full"
            />
          </div>

          {/* Email Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What would you like to receive?</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="productUpdates"
                  checked={preferences.productUpdates}
                  onCheckedChange={() => handlePreferenceChange('productUpdates')}
                  disabled={isSubmitting}
                />
                <Label htmlFor="productUpdates" className="text-sm">
                  Product updates and announcements
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newFeatures"
                  checked={preferences.newFeatures}
                  onCheckedChange={() => handlePreferenceChange('newFeatures')}
                  disabled={isSubmitting}
                />
                <Label htmlFor="newFeatures" className="text-sm">
                  New features and AI model releases
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tips"
                  checked={preferences.tips}
                  onCheckedChange={() => handlePreferenceChange('tips')}
                  disabled={isSubmitting}
                />
                <Label htmlFor="tips" className="text-sm">
                  Tips and tutorials for better results
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="promotions"
                  checked={preferences.promotions}
                  onCheckedChange={() => handlePreferenceChange('promotions')}
                  disabled={isSubmitting}
                />
                <Label htmlFor="promotions" className="text-sm">
                  Special offers and promotions
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isSubmitting ? "Signing up..." : "Sign up"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
