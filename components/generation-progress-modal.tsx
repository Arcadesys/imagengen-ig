"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Sparkles, Palette, Wand2, X } from "lucide-react"
import { EmailSignupModal } from "@/components/email-signup-modal"
import { useEmailSignup } from "@/hooks/use-email-signup"

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
  const config = statusConfig[status]
  const Icon = config.icon
  const isComplete = status === "complete"
  const isError = status === "error"
  const isGenerating = status === "generating"

  // Email signup hook
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

  // Show email signup during generation if they haven't seen it this session
  useEffect(() => {
    if (isGenerating && !emailSignup.hasShownForSession) {
      // Check if they've already signed up in a previous session
      const hasSignedUp = sessionStorage.getItem('email_signup_completed')
      if (!hasSignedUp) {
        // Wait a moment before showing the email signup to let generation start
        const timer = setTimeout(() => {
          if (status === "generating") { // Double check we're still generating
            emailSignup.open()
          }
        }, 2000) // Show after 2 seconds of generation
        
        return () => clearTimeout(timer)
      }
    }
  }, [isGenerating, emailSignup, status])

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
        className="max-w-md"
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
            {isGenerating && (
              <>
                {" "}
                • Want the result link? Leave your email to receive it when ready.
              </>
            )}
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

      {/* Email Signup Modal */}
      <EmailSignupModal
        isOpen={emailSignup.isOpen}
        onClose={emailSignup.close}
        onSubmit={emailSignup.submit}
        source="generation_modal"
        title="Stay updated while we generate your image!"
        description="Get notified about new features, tips, and when your images are ready. Your email will never be shared."
      />
    </Dialog>
  )
}
