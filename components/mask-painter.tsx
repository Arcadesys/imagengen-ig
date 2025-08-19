"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Paintbrush, Eraser, RotateCcw, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface MaskPainterProps {
  baseImage: string
  onMaskChange: (maskDataUrl: string) => void
  disabled?: boolean
}

export function MaskPainter({ baseImage, onMaskChange, disabled }: MaskPainterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState([20])
  const [tool, setTool] = useState<"brush" | "eraser">("brush")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1) // height / width
  const [canvasDims, setCanvasDims] = useState<{ w: number; h: number }>({ w: 512, h: 512 })

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const maskCanvas = maskCanvasRef.current
    if (!canvas || !maskCanvas || !baseImage) return

    const ctx = canvas.getContext("2d")
    const maskCtx = maskCanvas.getContext("2d")
    if (!ctx || !maskCtx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Set canvas dimensions to match image
      const imgAspect = img.width / img.height
      const maxWidth = 512
      const maxHeight = 512

      let canvasWidth = maxWidth
      let canvasHeight = maxWidth / imgAspect

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight
        canvasWidth = maxHeight * imgAspect
      }

      canvas.width = canvasWidth
      canvas.height = canvasHeight
      maskCanvas.width = canvasWidth
      maskCanvas.height = canvasHeight

      // Draw base image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

      // Initialize mask canvas with transparent background
      maskCtx.fillStyle = "rgba(0, 0, 0, 0)"
      maskCtx.fillRect(0, 0, canvasWidth, canvasHeight)

  setAspectRatio(canvasHeight / canvasWidth)
  setCanvasDims({ w: canvasWidth, h: canvasHeight })
  setImageLoaded(true)
    }
    img.src = baseImage
  }, [baseImage])

  useEffect(() => {
    initializeCanvas()
  }, [initializeCanvas])

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (disabled || !imageLoaded) return

      setIsDrawing(true)
      const canvas = maskCanvasRef.current
      if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.globalCompositeOperation = tool === "brush" ? "source-over" : "destination-out"
      ctx.beginPath()
      ctx.arc(x, y, brushSize[0] / 2, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.fill()

      updateMask()
    },
    [disabled, imageLoaded, tool, brushSize],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled || !imageLoaded) return

      const canvas = maskCanvasRef.current
      if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.globalCompositeOperation = tool === "brush" ? "source-over" : "destination-out"
      ctx.beginPath()
      ctx.arc(x, y, brushSize[0] / 2, 0, 2 * Math.PI)
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
      ctx.fill()

      updateMask()
    },
    [isDrawing, disabled, imageLoaded, tool, brushSize],
  )

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const updateMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const maskDataUrl = maskCanvas.toDataURL("image/png")
    onMaskChange(maskDataUrl)
  }, [onMaskChange])

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const ctx = maskCanvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    updateMask()
  }, [updateMask])

  const downloadMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current
    if (!maskCanvas) return

    const link = document.createElement("a")
    link.download = "mask.png"
    link.href = maskCanvas.toDataURL("image/png")
    link.click()
  }, [])

  if (!baseImage) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Upload a base image to start painting masks</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={tool === "brush" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("brush")}
              disabled={disabled}
            >
              <Paintbrush className="h-4 w-4 mr-2" />
              Paint
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("eraser")}
              disabled={disabled}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Erase
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm font-medium">Brush Size:</span>
            <Slider
              value={brushSize}
              onValueChange={setBrushSize}
              max={50}
              min={5}
              step={1}
              className="flex-1 max-w-32"
              disabled={disabled}
            />
            <span className="text-sm text-muted-foreground w-8">{brushSize[0]}</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearMask} disabled={disabled}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={downloadMask} disabled={disabled}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div
          className="relative border rounded-lg overflow-hidden bg-checkered"
          style={{ width: "100%", paddingTop: `${aspectRatio * 100}%` }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
          />
          <canvas
            ref={maskCanvasRef}
            className={cn("absolute inset-0 cursor-crosshair", disabled && "cursor-not-allowed")}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Paint over areas you want to change. White areas will be modified during generation.</p>
        </div>
      </div>
    </Card>
  )
}
