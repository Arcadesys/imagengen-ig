"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Upload } from "lucide-react"

export default function SimplePuppetrayPage() {
  const [step, setStep] = useState<"upload" | "configure" | "generate" | "results">("upload")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [puppetStyle, setPuppetStyle] = useState<string>("muppet")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
        setStep("configure")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!imageFile) return

    setStep("generate")
    setIsGenerating(true)

    try {
      // Simulate upload and generation
      const formData = new FormData()
      formData.append("file", imageFile)

      // Mock API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 2000))

      setStep("results")
    } catch (error) {
      console.error("Generation failed:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartOver = () => {
    setStep("upload")
    setImageFile(null)
    setImagePreview(null)
    setPuppetStyle("muppet")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 dark:bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Puppet Photobooth
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Turn yourself into any puppet you can imagine
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {step === "upload" && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Let's Make You a Puppet!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Start by uploading a photo of yourself. Then we'll guide you through creating the perfect puppet transformation.
              </p>
            </div>

            <Card className="max-w-2xl mx-auto p-8">
              <div className="text-center space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <div className="space-y-4">
                    <p className="text-lg font-medium">Upload Your Photo</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a clear photo of yourself for the best results
                    </p>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button className="cursor-pointer">
                        Choose File
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "configure" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Choose Your Puppet Style</h2>
            </div>

            {imagePreview && (
              <Card className="max-w-md mx-auto mb-8">
                <img 
                  src={imagePreview} 
                  alt="Your photo" 
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </Card>
            )}

            <Card className="max-w-2xl mx-auto p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Puppet Style</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "muppet", name: "Muppet", desc: "Classic Sesame Street style" },
                      { id: "sock", name: "Sock Puppet", desc: "Simple knitted sock" },
                      { id: "marionette", name: "Marionette", desc: "String puppet with wooden joints" },
                      { id: "felt", name: "Felt Puppet", desc: "Hand-stitched wool felt" }
                    ].map((style) => (
                      <Button
                        key={style.id}
                        variant={puppetStyle === style.id ? "default" : "outline"}
                        className="h-auto p-4 flex-col"
                        onClick={() => setPuppetStyle(style.id)}
                      >
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs text-muted-foreground">{style.desc}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Back
                  </Button>
                  <Button onClick={handleGenerate} className="flex-1">
                    Generate Puppet
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "generate" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Creating Your Puppet...</h2>
            </div>

            <Card className="max-w-md mx-auto p-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="font-medium">Transforming your photo</p>
                  <p className="text-sm text-muted-foreground">This may take a few moments...</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Your Puppet is Ready!</h2>
            </div>

            <Card className="max-w-md mx-auto p-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Generated puppet would appear here</p>
              </div>
            </Card>

            <div className="text-center space-x-4">
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
              <Button onClick={() => console.log("Download")}>
                Download
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
