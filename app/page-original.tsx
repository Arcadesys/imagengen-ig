"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Upload } from "lucide-react"

export default function PuppetrayPage() {
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
  },
  {
    id: "puppetray",
    name: "Puppet Photobooth", 
    description: "Transform yourself into any puppet style you can imagine. From Muppets to marionettes, create your perfect puppet transformation.",
    icon: <Wand2 className="w-6 h-6" />,
    href: "/puppetray",
    status: "active", 
    features: ["20+ puppet styles", "Species selection", "Personality traits", "Traditional to modern", "High-quality results"],
    universe: "Puppet Universe"
  },
  {
    id: "photobooth",
    name: "Session Photobooth",
    description: "Event-based photo generation with session codes. Perfect for parties, events, and organized group activities with customizable prompts.",
    icon: <Camera className="w-6 h-6" />,
    href: "/photobooth",
    status: "active",
    features: ["Session codes", "Event management", "Group activities", "Custom prompts", "Organized sessions"],
    universe: "Event Universe"
  },
  {
    id: "generate",
    name: "Style Transform",
    description: "Transform your photos into various artistic styles including cartoon, anime, Pixar-style 3D, watercolor, comic book, and vintage photography.",
    icon: <Sparkles className="w-6 h-6" />,
    href: "/generate",
    status: "active",
    features: ["6 art styles", "Cartoon & anime", "3D animation style", "Watercolor & comic", "Vintage photography", "Real-time preview"],
    universe: "Style Universe"
  }
]

const getStatusBadge = (status: Generator["status"]) => {
  switch (status) {
    case "active":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Active</Badge>
    case "beta":
      return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">Beta</Badge>
    case "coming-soon":
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Coming Soon</Badge>
  }
}

export default function GeneratorIndexPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      <Header />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              AI Image Generators
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our collection of specialized AI image generators. Each universe offers unique transformations and creative possibilities.
          </p>
        </div>

        {/* Generators Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {generators.map((generator) => (
            <Card key={generator.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                      {generator.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{generator.name}</CardTitle>
                      {generator.universe && (
                        <p className="text-sm text-muted-foreground">{generator.universe}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(generator.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {generator.description}
                </p>
                
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-2">
                    {generator.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-2">
                  {generator.status === "coming-soon" ? (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  ) : (
                    <Button asChild className="w-full group">
                      <Link href={generator.href}>
                        <Camera className="w-4 h-4 mr-2" />
                        Start Creating
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Looking for Something Specific?</h3>
              <p className="text-muted-foreground mb-6">
                Can't find the perfect generator? Our collection is constantly growing with new universes and transformation styles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/gallery">
                    <Sparkles className="w-4 h-4 mr-2" />
                    View Gallery
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/wall">
                    <Camera className="w-4 h-4 mr-2" />
                    Live Wall
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
