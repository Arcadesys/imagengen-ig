"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { uploadImageViaApi } from "@/lib/client-upload"

interface WebcamCaptureProps {
  onUpload: (baseImageId: string, url: string) => void
  onCancel?: () => void
  disabled?: boolean
  sessionId?: string | null
}

export function WebcamCapture({ onUpload, onCancel, disabled, sessionId }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 1024, height: 1024 }, audio: false })
        if (!mounted) return
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s as any
          await videoRef.current.play().catch(() => {})
        }
      } catch (e) {
        toast({ title: "Camera access denied", description: "Please allow webcam access to take a photo.", variant: "destructive" })
      }
    }
    init()
    return () => {
      mounted = false
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const captureAndUpload = useCallback(async () => {
    if (disabled || isBusy) return
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current || document.createElement("canvas")
    canvasRef.current = canvas

    const w = video.videoWidth || 1024
    const h = video.videoHeight || 1024
    const size = Math.min(w, h)
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!
    const sx = (w - size) / 2
    const sy = (h - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size)

    setIsBusy(true)
    try {
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.92))
      const file = new File([blob], "webcam.png", { type: "image/png" })

  const data = await uploadImageViaApi(file, file.name, sessionId || undefined)
  onUpload(data.baseImageId, data.url)
      toast({ title: "Photo captured", description: "Webcam photo uploaded." })
    } catch (e) {
      console.error(e)
      toast({ title: "Capture failed", description: e instanceof Error ? e.message : "Could not capture photo.", variant: "destructive" })
    } finally {
      setIsBusy(false)
    }
  }, [disabled, isBusy, onUpload, toast, sessionId])

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="aspect-square bg-black/10 dark:bg-white/10 rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        </div>
        <div className="flex gap-2">
          <Button onClick={captureAndUpload} disabled={disabled || isBusy || !stream}>
            {isBusy ? "Uploading…" : "Take Photo"}
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={disabled || isBusy}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
