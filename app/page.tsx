"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Sparkles, Wand2, Camera, Palette, ArrowRight } from "lucide-react"
import Link from "next/link"

interface Generator {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  href: string
  status: "active" | "beta" | "coming-soon"
  features: string[]
  universe?: string
}

const generators: Generator[] = [
  {
    id: "turn-toon",
    name: "Turn Toon",
    description: "Advanced cartoon transformation with precise control over style, species, and environment. Perfect for creating cartoon versions with detailed customization.",
    icon: <Palette className="w-6 h-6" />,
    href: "/turn-toon",
    status: "active",
    features: ["Multiple cartoon styles", "Species transformation", "Environment control", "Blend ratios", "Motion effects"],
    universe: "Cartoon Universe"
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventResponse = await fetch("/api/events")
        if (eventResponse.ok) {
          const eventData = await eventResponse.json()
          setCurrentEvent(eventData)
        }

        const stylesResponse = await fetch("/api/questions")
        if (stylesResponse.ok) {
          const stylesData = await stylesResponse.json()
          setStyles(stylesData.styles || [])
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
  }, [])

  const handleStartBooth = () => {
    setCurrentStep("styles")
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedPhoto(result)
        setCurrentStep("styles")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleStyleSelect = (style: StyleOption) => {
    setSelectedStyle(style)
    setLoading(true)

    if (uploadedPhoto) {
      sessionStorage.setItem("photoBoothImage", uploadedPhoto)
    }

    const params = new URLSearchParams({ style: style.id })
    setTimeout(() => {
      window.location.href = `/generate?${params.toString()}`
    }, 500)
  }

  if (currentStep === "entry") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
        <Header />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          {currentEvent && (
            <div className="mb-8 text-center">
              <Badge variant="secondary" className="mb-2 text-lg px-4 py-2">
                {currentEvent.name}
              </Badge>
            </div>
          )}

          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
                <div className="relative bg-white dark:bg-gray-900 rounded-full p-8 shadow-2xl">
                  <Camera className="w-24 h-24 text-purple-600 mx-auto" />
                </div>
              </div>
            </div>

            <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4 font-fredoka">
              Make Memories
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
              Step into our AI Photo Booth and create magical memories with stunning artistic styles!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                onClick={handleStartBooth}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Camera className="w-6 h-6 mr-3" />
                Take Photo
                <Sparkles className="w-6 h-6 ml-3" />
              </Button>

              <Button
                onClick={handleUploadClick}
                size="lg"
                variant="outline"
                className="border-2 border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 bg-white/80 dark:bg-gray-900/80"
              >
                <Upload className="w-6 h-6 mr-3" />
                Upload Photo
                <ImageIcon className="w-6 h-6 ml-3" />
              </Button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </div>

          {/* Admin Section for Logged-in Users */}
          {session && (
            <div className="mt-12 w-full max-w-md">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-center">
                  <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2 text-blue-900 dark:text-blue-100">Admin Panel</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    Manage session codes and moderate content
                  </p>
                  <Link href="/admin">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Settings className="w-4 h-4 mr-2" />
                      Open Admin Panel
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-cyan-100 dark:from-pink-950 dark:via-purple-950 dark:to-cyan-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {uploadedPhoto && (
          <div className="mb-6">
            <div className="relative inline-block">
              <img
                src={uploadedPhoto || "/placeholder.svg"}
                alt="Uploaded photo"
                className="w-32 h-32 object-cover rounded-full border-4 border-purple-300 shadow-lg"
              />
              <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                Photo Ready!
              </Badge>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 font-fredoka">
            Choose Your Style
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Select an artistic style to transform your photo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {styles.map((style) => (
            <Card
              key={style.id}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 cursor-pointer"
              onClick={() => handleStyleSelect(style)}
            >
              <CardContent className="p-6">
                {style.preview && (
                  <div className="w-full h-48 bg-gradient-to-br from-pink-200 to-purple-200 dark:from-pink-800 dark:to-purple-800 rounded-lg mb-4 flex items-center justify-center">
                    <Palette className="w-12 h-12 text-purple-600 dark:text-purple-300" />
                  </div>
                )}

                <h3 className="font-semibold text-xl mb-2 text-center">{style.name}</h3>

                <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-4">{style.description}</p>

                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  disabled={loading && selectedStyle?.id === style.id}
                >
                  {loading && selectedStyle?.id === style.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Select Style
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => setCurrentStep("entry")} className="px-8">
            Back to Start
          </Button>
        </div>
      </div>
    </div>
  )
}
