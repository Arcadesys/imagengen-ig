"use client"
import { useEffect, useState } from "react"
import { ImageUpload } from "./image-upload"
import { MaskPainter } from "./mask-painter"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface EnhancedImageUploadProps {
  onUpload: (baseImageId: string, url: string) => void
  onRemove: () => void
  onMaskChange: (maskDataUrl: string | null) => void
  uploadedImage?: { id: string; url: string } | null
  disabled?: boolean
}

export function EnhancedImageUpload({
  onUpload,
  onRemove,
  onMaskChange,
  uploadedImage,
  disabled,
}: EnhancedImageUploadProps) {
  const [activeTab, setActiveTab] = useState("upload")
  const [maskData, setMaskData] = useState<string | null>(null)
  const [previousUploads, setPreviousUploads] = useState<Array<{ id: string; url: string; filename: string; createdAt: string }>>([])
  const [loadingUploads, setLoadingUploads] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingUploads(true)
        const res = await fetch("/api/images/upload", { method: "GET" })
        if (!res.ok) return
        const data = (await res.json()) as Array<{ id: string; url: string; filename: string; createdAt: string }>
        setPreviousUploads(data)
      } catch {
        // ignore
      } finally {
        setLoadingUploads(false)
      }
    }
    run()
  }, [])

  const handleUpload = (baseImageId: string, url: string) => {
    onUpload(baseImageId, url)
    setActiveTab("mask")
  }

  const handleRemove = () => {
    onRemove()
    setMaskData(null)
    onMaskChange(null)
    setActiveTab("upload")
  }

  const handleMaskChange = (maskDataUrl: string) => {
    setMaskData(maskDataUrl)
    onMaskChange(maskDataUrl)
  }

  if (!uploadedImage) {
    return (
      <div className="space-y-4">
        <ImageUpload onUpload={handleUpload} onRemove={handleRemove} uploadedImage={uploadedImage} disabled={disabled} />
        <div>
          <div className="text-sm font-medium mb-2">Previous uploads</div>
          {loadingUploads ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : previousUploads.length === 0 ? (
            <div className="text-sm text-muted-foreground">No previous uploads yet.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {previousUploads.map((u) => (
                <button
                  key={u.id}
                  className="relative rounded border overflow-hidden focus:outline-none focus:ring"
                  title={`${u.filename}`}
                  onClick={() => handleUpload(u.id, u.url)}
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.url} alt={u.filename} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upload">Base Image</TabsTrigger>
            <TabsTrigger value="mask">
              Paint Mask
              {maskData && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upload" className="mt-0">
          <ImageUpload
            onUpload={handleUpload}
            onRemove={handleRemove}
            uploadedImage={uploadedImage}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="mask" className="mt-0">
          <MaskPainter baseImage={uploadedImage.url} onMaskChange={handleMaskChange} disabled={disabled} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
