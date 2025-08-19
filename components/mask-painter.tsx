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
  const canvasRef = useRef<HTMLCanvasElement>(null) // base image canvas (visible)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null) // actual mask data (hidden)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null) // visual overlay (visible)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState([20])
  const [tool, setTool] = useState<"brush" | "eraser">("brush")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1) // height / width
  const [canvasDims, setCanvasDims] = useState<{ w: number; h: number }>({ w: 512, h: 512 })

  const initializeCanvas = useCallback(() => {
  const canvas = canvasRef.current
  const maskCanvas = maskCanvasRef.current
  const overlayCanvas = overlayCanvasRef.current
  if (!canvas || !maskCanvas || !overlayCanvas || !baseImage) return

  const ctx = canvas.getContext("2d")
  const maskCtx = maskCanvas.getContext("2d")
  const overlayCtx = overlayCanvas.getContext("2d")
  if (!ctx || !maskCtx || !overlayCtx) return

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
  overlayCanvas.width = canvasWidth
  overlayCanvas.height = canvasHeight

      // Draw base image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

  // Initialize hidden mask canvas as fully opaque (preserve everywhere by default)
  // OpenAI edits: transparent areas are replaced/modified; non-transparent are preserved
  maskCtx.fillStyle = "rgba(255, 255, 255, 1)"
  maskCtx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Initialize visible overlay as fully transparent (just shows painted regions)
  overlayCtx.clearRect(0, 0, canvasWidth, canvasHeight)

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
      const maskCanvas = maskCanvasRef.current
      const overlayCanvas = overlayCanvasRef.current
      if (!maskCanvas || !overlayCanvas) return

      const rect = overlayCanvas.getBoundingClientRect()
      const scaleX = overlayCanvas.width / rect.width
      const scaleY = overlayCanvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      const maskCtx = maskCanvas.getContext("2d")
      const overlayCtx = overlayCanvas.getContext("2d")
      if (!maskCtx || !overlayCtx) return

      const r = brushSize[0] / 2
      // Update actual mask data
      if (tool === "brush") {
        maskCtx.globalCompositeOperation = "destination-out" // transparent = editable
        maskCtx.beginPath()
        maskCtx.arc(x, y, r, 0, 2 * Math.PI)
        maskCtx.fill()
      } else {
        maskCtx.globalCompositeOperation = "source-over" // opaque = preserve
        maskCtx.beginPath()
        maskCtx.arc(x, y, r, 0, 2 * Math.PI)
        maskCtx.fillStyle = "rgba(255, 255, 255, 1)"
        maskCtx.fill()
      }

      // Update visible overlay (tinted highlight for edited regions)
      if (tool === "brush") {
        overlayCtx.globalCompositeOperation = "source-over"
        overlayCtx.beginPath()
        overlayCtx.arc(x, y, r, 0, 2 * Math.PI)
        overlayCtx.fillStyle = "rgba(0, 200, 255, 0.35)"
        overlayCtx.fill()
      } else {
        overlayCtx.globalCompositeOperation = "destination-out" // erase highlight
        overlayCtx.beginPath()
        overlayCtx.arc(x, y, r, 0, 2 * Math.PI)
        overlayCtx.fill()
      }

      updateMask()
    },
    [disabled, imageLoaded, tool, brushSize],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled || !imageLoaded) return

      const maskCanvas = maskCanvasRef.current
      const overlayCanvas = overlayCanvasRef.current
      if (!maskCanvas || !overlayCanvas) return

      const rect = overlayCanvas.getBoundingClientRect()
      const scaleX = overlayCanvas.width / rect.width
      const scaleY = overlayCanvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      const maskCtx = maskCanvas.getContext("2d")
      const overlayCtx = overlayCanvas.getContext("2d")
      if (!maskCtx || !overlayCtx) return

      const r = brushSize[0] / 2
      if (tool === "brush") {
        maskCtx.globalCompositeOperation = "destination-out"
        maskCtx.beginPath()
        maskCtx.arc(x, y, r, 0, 2 * Math.PI)
        maskCtx.fill()

        overlayCtx.globalCompositeOperation = "source-over"
        overlayCtx.beginPath()
        overlayCtx.arc(x, y, r, 0, 2 * Math.PI)
        overlayCtx.fillStyle = "rgba(0, 200, 255, 0.35)"
        overlayCtx.fill()
      } else {
        maskCtx.globalCompositeOperation = "source-over"
        maskCtx.beginPath()
        maskCtx.arc(x, y, r, 0, 2 * Math.PI)
        maskCtx.fillStyle = "rgba(255, 255, 255, 1)"
        maskCtx.fill()

        overlayCtx.globalCompositeOperation = "destination-out"
        overlayCtx.beginPath()
        overlayCtx.arc(x, y, r, 0, 2 * Math.PI)
        overlayCtx.fill()
      }

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
  const overlayCanvas = overlayCanvasRef.current
  if (!maskCanvas || !overlayCanvas) return

  const mctx = maskCanvas.getContext("2d")
  const octx = overlayCanvas.getContext("2d")
  if (!mctx || !octx) return

  // Reset mask to fully opaque (preserve everywhere)
  mctx.globalCompositeOperation = "source-over"
  mctx.fillStyle = "rgba(255, 255, 255, 1)"
  mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)
  // Clear overlay highlight
  octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
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
          {/* Visible overlay where user paints (tinted). The actual mask canvas is hidden. */}
          <canvas
            ref={overlayCanvasRef}
            className={cn("absolute inset-0 cursor-crosshair", disabled && "cursor-not-allowed")}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ width: "100%", height: "100%", imageRendering: "pixelated" }}
          />
          <canvas ref={maskCanvasRef} className="hidden" />
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Paint over areas you want to change. Highlighted regions will be modified; unpainted regions are preserved.</p>
        </div>
      </div>
    </Card>
  )
}
