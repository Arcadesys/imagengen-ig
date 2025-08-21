"use client"

import { useState, useCallback, useRef } from "react"

export type GenerationStatus = "idle" | "uploading" | "processing" | "generating" | "downloading" | "complete" | "error"

interface UseGenerationProgressReturn {
  isOpen: boolean
  status: GenerationStatus
  progress: number
  message: string
  error?: string
  generatedCount: number
  totalCount: number
  generatedImages: any[]
  startGeneration: (totalImages: number) => void
  updateProgress: (status: GenerationStatus, progress: number, message: string, generatedCount?: number) => void
  setError: (error: string) => void
  complete: (images?: any[]) => void
  cancel: () => void
  close: () => void
  generateWithProgress: (requestData: any) => Promise<any>
}

export function useGenerationProgress(): UseGenerationProgressReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<GenerationStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [error, setErrorState] = useState<string>()
  const [generatedCount, setGeneratedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(1)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const startGeneration = useCallback((totalImages = 1) => {
    setIsOpen(true)
    setStatus("idle")
    setProgress(0)
    setMessage("Preparing generation...")
    setErrorState(undefined)
    setGeneratedCount(0)
    setTotalCount(totalImages)
    setGeneratedImages([])
  }, [])

  const updateProgress = useCallback(
    (newStatus: GenerationStatus, newProgress: number, newMessage: string, newGeneratedCount?: number) => {
      setStatus(newStatus)
      setProgress(newProgress)
      setMessage(newMessage)
      if (newGeneratedCount !== undefined) {
        setGeneratedCount(newGeneratedCount)
      }
    },
    [],
  )

  const setError = useCallback((errorMessage: string) => {
    setStatus("error")
    setProgress(100)
    setMessage("Generation failed")
    setErrorState(errorMessage)
  }, [])

  const complete = useCallback((images?: any[]) => {
    setStatus("complete")
    setProgress(100)
    setMessage("Generation complete!")
    setErrorState(undefined)
    if (images) {
      setGeneratedImages(images)
    }
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsOpen(false)
    setStatus("idle")
    setProgress(0)
    setMessage("")
    setErrorState(undefined)
    setGeneratedCount(0)
    setGeneratedImages([])
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const generateWithProgress = useCallback(
    async (requestData: any) => {
      startGeneration(requestData.n || 1)

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch("/api/images/generate/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No response body reader available")
        }

        const decoder = new TextDecoder()
        let result: any = null

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const eventData = JSON.parse(line.slice(6))

                if (eventData.type === "progress") {
                  updateProgress(eventData.status, eventData.progress, eventData.message, eventData.generatedCount)
                } else if (eventData.type === "complete") {
                  complete(eventData.images)
                  result = { images: eventData.images }
                } else if (eventData.type === "error") {
                  setError(eventData.error || eventData.message)
                  throw new Error(eventData.error || eventData.message)
                }
              } catch (parseError) {
                console.warn("Failed to parse SSE data:", parseError)
              }
            }
          }
        }

        return result
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled
          return null
        }

        console.error("Generation error:", error)
        setError(error instanceof Error ? error.message : "Generation failed")
        throw error
      } finally {
        abortControllerRef.current = null
      }
    },
    [startGeneration, updateProgress, complete, setError],
  )

  return {
    isOpen,
    status,
    progress,
    message,
    error,
    generatedCount,
    totalCount,
    generatedImages,
    startGeneration,
    updateProgress,
    setError,
    complete,
    cancel,
    close,
    generateWithProgress,
  }
}
