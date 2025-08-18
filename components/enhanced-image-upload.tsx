"use client"
import { useState } from "react"
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
      <ImageUpload onUpload={handleUpload} onRemove={handleRemove} uploadedImage={uploadedImage} disabled={disabled} />
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
