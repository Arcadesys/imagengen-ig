"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, XCircle, Loader2, Sparkles, Palette, Wand2, X, Mail, AlertCircle } from "lucide-react"
import { EmailSignupModal } from "@/components/email-signup-modal"
import { useEmailSignup } from "@/hooks/use-email-signup"
import { useToast } from "@/hooks/use-toast"

interface EmailPreferences {
  productUpdates: boolean
  newFeatures: boolean
  tips: boolean
  promotions: boolean
}

interface GenerationProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel?: () => void
  onComplete?: (images: any[]) => void
  status: "idle" | "uploading" | "processing" | "generating" | "downloading" | "complete" | "error"
  progress: number
  message: string
  error?: string
  generatedCount?: number
  totalCount?: number
  canCancel?: boolean
  generatedImages?: any[]
}

const statusConfig = {
  idle: {
    icon: Loader2,
    color: "bg-muted",
    label: "Preparing...",
    description: "Getting ready to generate your images",
  },
  uploading: {
    icon: Loader2,
    color: "bg-blue-500",
    label: "Uploading",
    description: "Uploading your base image and mask data",
  },
  processing: {
    icon: Wand2,
    color: "bg-purple-500",
    label: "Processing",
    description: "Preparing your prompt and settings",
  },
  generating: {
    icon: Sparkles,
    color: "bg-green-500",
    label: "Generating",
    description: "AI is creating your images",
  },
  downloading: {
    icon: Palette,
    color: "bg-orange-500",
    label: "Finalizing",
    description: "Saving your generated images",
  },
  complete: {
    icon: CheckCircle,
    color: "bg-emerald-500",
    label: "Complete",
    description: "Your images are ready!",
  },
  error: {
    icon: XCircle,
    color: "bg-red-500",
    label: "Error",
    description: "Something went wrong",
  },
}

export function GenerationProgressModal({
  isOpen,
  onClose,
  onCancel,
  onComplete,
  status,
  progress,
  message,
  error,
  generatedCount = 0,
  totalCount = 1,
  canCancel = true,
  generatedImages = [],
}: GenerationProgressModalProps) {
  const [dots, setDots] = useState("")
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
  
  const config = statusConfig[status]
  const Icon = config.icon
  const isComplete = status === "complete"
  const isError = status === "error"
  const isGenerating = status === "generating"
  const { toast } = useToast()

  // Email signup hook (keeping for compatibility, but not using the modal)
  const emailSignup = useEmailSignup()

  // Animated dots for loading states
  useEffect(() => {
    if (status === "idle" || status === "uploading" || status === "processing" || status === "generating") {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
      }, 500)
      return () => clearInterval(interval)
    } else {
      setDots("")
    }
  }, [status])

  // Show email form during generation if they haven't signed up yet
  useEffect(() => {
    if (isGenerating && !emailSubmitted) {
      // Check if they've already signed up in a previous session
      const hasSignedUp = sessionStorage.getItem('email_signup_completed')
      if (!hasSignedUp) {
        // Show email form immediately when generation starts
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

    setIsSubmittingEmail(true)
    try {
      // Since the email functionality doesn't work yet, just show success
      // In the future, this would call the actual API
      // await emailSignup.submit(email, emailPreferences, "generation_progress")
      
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

  // Auto-close on complete after delay
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onClose()
        // Call the completion callback with generated images when modal closes after completion
        if (onComplete && generatedImages.length > 0) {
          onComplete(generatedImages)
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isComplete, onClose, onComplete, generatedImages])

  const handleCancel = () => {
    if (onCancel && canCancel && !isComplete && !isError) {
      onCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={isComplete || isError ? onClose : undefined}>
      <DialogContent
        className="max-w-lg"
        aria-labelledby="progress-title"
        aria-describedby="progress-description"
        showCloseButton={isComplete || isError}
      >
        <DialogHeader>
          <DialogTitle id="progress-title" className="flex items-center gap-2">
            <Icon
              className={`h-5 w-5 ${isComplete ? "text-emerald-500" : isError ? "text-red-500" : "animate-spin text-primary"}`}
            />
            {config.label}
            {dots}
          </DialogTitle>
          <DialogDescription id="progress-description">
            {config.description}
            {message ? (
              <>
                {" "}
                – {message}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{config.description}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" aria-label={`Generation progress: ${Math.round(progress)}%`} />
          </div>

          {/* Email Signup Form - Prominent during generation */}
          {isGenerating && showEmailForm && !emailSubmitted && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Get notified when your images are ready!
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
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="signup-email"
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
                        id="productUpdates"
                        checked={emailPreferences.productUpdates}
                        onCheckedChange={() => handlePreferenceChange('productUpdates')}
                        disabled={isSubmittingEmail}
                        className="h-3 w-3"
                      />
                      <Label htmlFor="productUpdates" className="text-xs">
                        Product updates & your image results
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="newFeatures"
                        checked={emailPreferences.newFeatures}
                        onCheckedChange={() => handlePreferenceChange('newFeatures')}
                        disabled={isSubmittingEmail}
                        className="h-3 w-3"
                      />
                      <Label htmlFor="newFeatures" className="text-xs">
                        New AI features & model releases
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
          {isGenerating && emailSubmitted && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Thanks for signing up!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                We'll notify you when email functionality is ready.
              </p>
            </div>
          )}

          {/* Status Message */}
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">{message}</p>

            {/* Image Count for Multi-Generation */}
            {isGenerating && totalCount > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {generatedCount} of {totalCount} images
                </Badge>
              </div>
            )}

            {/* Error Message */}
            {isError && error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Visual Progress Indicator */}
          <div className="flex justify-center">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full ${config.color} opacity-20`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon
                  className={`h-8 w-8 ${
                    isComplete ? "text-emerald-500" : isError ? "text-red-500" : "text-white animate-pulse"
                  }`}
                />
              </div>
              {!isComplete && !isError && (
                <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isComplete && (
              <Button onClick={onClose} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}

            {isError && (
              <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
                Close
              </Button>
            )}

            {canCancel && !isComplete && !isError && (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 bg-transparent"
                disabled={status === "downloading"}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
