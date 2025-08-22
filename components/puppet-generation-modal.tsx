"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Wand2, X, Mail, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmailPreferences {
  productUpdates: boolean
  newFeatures: boolean
  tips: boolean
  promotions: boolean
}

interface PuppetGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel?: () => void
  progress: number // 0-100
  status: "generating" | "complete" | "error"
  message?: string
  error?: string
  canCancel?: boolean
}

export function PuppetGenerationModal({
  isOpen,
  onClose,
  onCancel,
  progress,
  status,
  message = "Creating your puppet...",
  error,
  canCancel = true
}: PuppetGenerationModalProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [email, setEmail] = useState("")
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    productUpdates: true,
    newFeatures: true,
    tips: false,
    promotions: false
  })
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const { toast } = useToast()

  const isGenerating = status === "generating"

  // Animate progress changes
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        const diff = progress - prev
        if (Math.abs(diff) < 1) return progress
        return prev + diff * 0.1
      })
    }, 50)

    return () => clearInterval(interval)
  }, [progress])

  // Show email form during generation if they haven't signed up yet
  useEffect(() => {
    if (isGenerating && !emailSubmitted) {
      const hasSignedUp = sessionStorage.getItem('email_signup_completed')
      if (!hasSignedUp) {
        setShowEmailForm(true)
      }
    }
  }, [isGenerating, emailSubmitted])

  // Handle email preference changes
  const handlePreferenceChange = (key: keyof EmailPreferences) => {
    setEmailPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Handle email form submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingEmail(true)
    try {
      toast({
        title: "Thanks for your interest!",
        description: "Email signup is coming soon. We'll notify you when it's ready!",
      })
      
      setEmailSubmitted(true)
      setShowEmailForm(false)
      sessionStorage.setItem('email_signup_completed', 'true')
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "There was an error signing you up. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingEmail(false)
    }
  }

  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center border-b bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {status === "generating" && "Creating Your Puppet"}
                {status === "complete" && "Puppet Ready!"}
                {status === "error" && "Oops! Something Went Wrong"}
              </h2>
            </div>
            {canCancel && status === "generating" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-6">
          {status === "generating" && (
            <>
              {/* Email Signup Form - Prominent during generation */}
              {showEmailForm && !emailSubmitted && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4 mb-6">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Get your puppet when ready!
                      </h3>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Leave your email and we'll send you the results plus updates about new features.
                    </p>
                    <div className="flex items-center justify-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2 py-1 rounded">
                      <AlertCircle className="h-3 w-3" />
                      Note: Email functionality is coming soon!
                    </div>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-3">
                    <div>
                      <Label htmlFor="puppet-signup-email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="puppet-signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmittingEmail}
                        className="mt-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Email preferences:</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="puppet-productUpdates"
                            checked={emailPreferences.productUpdates}
                            onCheckedChange={() => handlePreferenceChange('productUpdates')}
                            disabled={isSubmittingEmail}
                            className="h-3 w-3"
                          />
                          <Label htmlFor="puppet-productUpdates" className="text-xs">
                            Product updates & your puppet results
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="puppet-newFeatures"
                            checked={emailPreferences.newFeatures}
                            onCheckedChange={() => handlePreferenceChange('newFeatures')}
                            disabled={isSubmittingEmail}
                            className="h-3 w-3"
                          />
                          <Label htmlFor="puppet-newFeatures" className="text-xs">
                            New puppet features & models
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowEmailForm(false)}
                        disabled={isSubmittingEmail}
                        className="flex-1 text-xs h-8"
                      >
                        Skip
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmittingEmail || !email.trim()}
                        className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmittingEmail ? "Signing up..." : "Sign me up!"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Thank you message after email signup */}
              {emailSubmitted && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center mb-6">
                  <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Thanks for signing up!</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    We'll notify you when email functionality is ready.
                  </p>
                </div>
              )}

              {/* Radial Progress */}
              <div className="relative mx-auto w-32 h-32">
                <svg
                  className="w-32 h-32 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className="stop-color-purple-500" />
                      <stop offset="50%" className="stop-color-pink-500" />
                      <stop offset="100%" className="stop-color-orange-500" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(animatedProgress)}%
                    </div>
                    <Sparkles className="w-6 h-6 mx-auto mt-1 text-primary animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Progress bar backup */}
              <div className="space-y-2">
                <Progress value={animatedProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>

              {/* Fun messages based on progress */}
              <div className="text-center space-y-2">
                {animatedProgress < 25 && (
                  <p className="text-muted-foreground">
                    🧵 Gathering puppet materials...
                  </p>
                )}
                {animatedProgress >= 25 && animatedProgress < 50 && (
                  <p className="text-muted-foreground">
                    ✂️ Cutting and shaping...
                  </p>
                )}
                {animatedProgress >= 50 && animatedProgress < 75 && (
                  <p className="text-muted-foreground">
                    🪡 Stitching everything together...
                  </p>
                )}
                {animatedProgress >= 75 && animatedProgress < 95 && (
                  <p className="text-muted-foreground">
                    👁️ Adding the finishing touches...
                  </p>
                )}
                {animatedProgress >= 95 && (
                  <p className="text-muted-foreground">
                    ✨ Almost ready for showtime!
                  </p>
                )}
              </div>
            </>
          )}

          {status === "complete" && (
            <>
              <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Your puppet is ready!
                </h3>
                <p className="text-muted-foreground">
                  Time to see your transformation!
                </p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <X className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Generation failed
                </h3>
                <p className="text-sm text-muted-foreground">
                  {error || "Something went wrong during puppet creation. Please try again."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {(status === "complete" || status === "error") && (
          <div className="p-6 border-t bg-muted/20">
            <Button onClick={onClose} className="w-full">
              {status === "complete" ? "See My Puppet!" : "Try Again"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
