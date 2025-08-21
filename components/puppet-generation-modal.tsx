"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Wand2, X } from "lucide-react"

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
