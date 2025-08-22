"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { AnimationStyle, AnimationConfiguration } from "@/lib/animation-prompts"
import { generateAnimationPrompt } from "@/lib/animation-prompts"

interface AnimationConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: AnimationConfiguration, finalPrompt?: string) => void
  initialConfig?: Partial<AnimationConfiguration>
}

const ANIMATION_STYLES = [
  { id: "anime", name: "Anime", description: "2D anime with clean line art and cel shading" },
  { id: "manga", name: "Manga (B/W)", description: "Black-and-white screentones and dynamic ink" },
  { id: "rubber-hose", name: "Rubber Hose (1920s)", description: "Noodle limbs, pie-cut eyes, vintage ink" },
  { id: "western-cel", name: "Western TV Cel", description: "Saturday-morning flat colors and bold outlines" },
  { id: "vector-flat", name: "Vector/Flash", description: "Flat fills, bezier curves, minimal shading" },
  { id: "paper-cutout", name: "Paper Cutout", description: "Layered paper texture and hard edges" },
  { id: "stop-motion", name: "Stop-motion Look", description: "Handmade textures, slight frame stutter" },
  { id: "cg-toon", name: "CG Toon", description: "3D with stylized non-photoreal shaders" },
  { id: "toon-shaded-3d", name: "3D Toon Shaded", description: "Quantized lighting bands with ink outlines" },
  { id: "watercolor", name: "Watercolor", description: "Soft washes, pigment blooms, paper grain" },
  { id: "comic-book", name: "Comic Book", description: "Inked outlines with halftone shading" },
  { id: "pixel-art", name: "Pixel Art", description: "Low-res mosaic with limited palette" },
  { id: "noir-ink", name: "Noir Ink", description: "High-contrast black ink and chiaroscuro" },
  { id: "chalk-crayon", name: "Chalk/Crayon", description: "Waxy strokes and visible grain" },
  { id: "graffiti", name: "Graffiti", description: "Bold spray textures and vibrant colors" },
  { id: "sketch", name: "Pencil Sketch", description: "Graphite lines and crosshatching" },
  { id: "retro-80s", name: "Retro 80s", description: "Saturated primaries and airbrush highlights" },
  { id: "saturday-morning", name: "Saturday Morning", description: "Bright colors and playful shapes" },
] as const

const GENDER_OPTIONS = [
  "Male", "Female", "Non-binary", "Agender", "Genderfluid", "Demiboy", "Demigirl", 
  "Two-spirit", "Neutrois", "Bigender", "Pangender", "Genderqueer", "Androgyne",
  "Third gender", "Gender non-conforming", "Prefer not to say", "Other"
]

const PERSONALITY_OPTIONS = [
  { id: "cute", name: "Cute", description: "Sweet, adorable, and loveable" },
  { id: "goofy", name: "Goofy", description: "Silly, clumsy, and fun-loving" },
  { id: "funny", name: "Funny", description: "Witty, comedic, and entertaining" },
  { id: "creepy", name: "Creepy", description: "Mysterious, spooky, and unsettling" },
  { id: "mischievous", name: "Mischievous", description: "Playful troublemaker with a twinkle in their eye" },
  { id: "wise", name: "Wise", description: "Thoughtful, intelligent, and knowing" },
  { id: "grumpy", name: "Grumpy", description: "Cranky, serious, and no-nonsense" },
  { id: "cheerful", name: "Cheerful", description: "Happy, optimistic, and upbeat" },
  { id: "dramatic", name: "Dramatic", description: "Theatrical, expressive, and over-the-top" },
  { id: "shy", name: "Shy", description: "Bashful, timid, and endearing" },
  { id: "confident", name: "Confident", description: "Bold, self-assured, and charismatic" },
  { id: "quirky", name: "Quirky", description: "Unique, eccentric, and wonderfully weird" }
]

const SPECIES_OPTIONS = [
  "human", "cat", "dog", "fox", "wolf", "bear", "dragon", "rabbit", "mouse", "bird",
  "monster", "alien", "robot"
]

export function AnimationConfigurationModal({
  isOpen,
  onClose,
  onComplete,
  initialConfig
}: AnimationConfigurationModalProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<AnimationConfiguration>({
    style: (initialConfig?.style as AnimationStyle) || "anime",
    gender: initialConfig?.gender || "",
    species: initialConfig?.species || "",
    personality: initialConfig?.personality || "",
  })

  const [genderSearch, setGenderSearch] = useState("")
  const [speciesSearch, setSpeciesSearch] = useState("")
  const [styleSearch, setStyleSearch] = useState("")

  const [finalPrompt, setFinalPrompt] = useState<string>("")

  const filteredGenders = GENDER_OPTIONS.filter(g =>
    g.toLowerCase().includes(genderSearch.toLowerCase())
  )

  const filteredSpecies = SPECIES_OPTIONS.filter(s =>
    s.toLowerCase().includes(speciesSearch.toLowerCase())
  )

  const filteredStyles = ANIMATION_STYLES.filter(s =>
    s.name.toLowerCase().includes(styleSearch.toLowerCase()) ||
    s.description.toLowerCase().includes(styleSearch.toLowerCase())
  )

  const handleNext = useCallback(() => {
    if (step < 5) {
      const next = step + 1
      setStep(next)
      if (next === 5) {
        const composed = generateAnimationPrompt({
          style: config.style,
          gender: config.gender,
          species: config.species || "human",
          personality: config.personality,
        }, false)
        setFinalPrompt(composed)
      }
    } else {
      onComplete(config, finalPrompt || undefined)
    }
  }, [step, config, finalPrompt, onComplete])

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1)
    else onClose()
  }, [step, onClose])

  const isStepComplete = useCallback(() => {
    switch (step) {
      case 1: return !!config.style
      case 2: return true
      case 3: return true
      case 4: return true
      case 5: return true
      default: return true
    }
  }, [step, config])

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFinalPrompt("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {step === 1 && "Choose Your Animation Style"}
              {step === 2 && "What's Your Gender? (Optional)"}
              {step === 3 && "Animal or Robot? (Optional)"}
              {step === 4 && "What's Your Vibe? (Optional)"}
              {step === 5 && "Review & Edit Prompt"}
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i === step ? 'bg-primary' : i < step ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Pick an animation style.</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search animation styles..."
                  value={styleSearch}
                  onChange={(e) => setStyleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {filteredStyles.map(style => (
                  <Card 
                    key={style.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      config.style === style.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, style: style.id as AnimationStyle }))}
                  >
                    <h3 className="font-semibold text-lg">{style.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {style.description}
                    </p>
                  </Card>
                ))}
              </div>
              {styleSearch && filteredStyles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No animation styles found. Try a different search term.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Select your gender identity (optional).</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search gender options..."
                  value={genderSearch}
                  onChange={(e) => setGenderSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredGenders.map(gender => (
                  <Button
                    key={gender}
                    variant={config.gender === gender ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setConfig(prev => ({ ...prev, gender }))}
                  >
                    {gender}
                  </Button>
                ))}
              </div>
              {genderSearch && filteredGenders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No matches found. Try a different search term.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      setConfig(prev => ({ ...prev, gender: genderSearch }))
                      setGenderSearch("")
                    }}
                  >
                    Use "{genderSearch}"
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Pick an animal, creature, or robot (optional).</p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search species..."
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={config.species === "human" ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setConfig(prev => ({ ...prev, species: "human" }))}
                >
                  No thanks, just human
                </Button>
                <span className="text-sm text-muted-foreground">Or choose one below</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {filteredSpecies.map(sp => (
                  <Button
                    key={sp}
                    variant={config.species === sp ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setConfig(prev => ({ ...prev, species: sp }))}
                  >
                    {sp}
                  </Button>
                ))}
              </div>
              {speciesSearch && filteredSpecies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No matches found. Try a different search term.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => {
                      setConfig(prev => ({ ...prev, species: speciesSearch }))
                      setSpeciesSearch("")
                    }}
                  >
                    Use "{speciesSearch}"
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <p className="text-muted-foreground">Choose a personality vibe (optional).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {PERSONALITY_OPTIONS.map(p => (
                  <Card 
                    key={p.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      config.personality === p.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, personality: p.id }))}
                  >
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  </Card>
                ))}
              </div>
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Your Toon Preview</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Style:</strong> {ANIMATION_STYLES.find(s => s.id === config.style)?.name}</p>
                  <p><strong>Gender:</strong> {config.gender || "Not specified"}</p>
                  <p><strong>Species:</strong> {config.species || "human"}</p>
                  <p><strong>Personality:</strong> {PERSONALITY_OPTIONS.find(p => p.id === config.personality)?.name || "Not selected"}</p>
                </div>
              </Card>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">Final checkpoint: Edit the prompt before generating.</p>
              <Label htmlFor="finalPrompt">Prompt</Label>
              <Textarea
                id="finalPrompt"
                value={finalPrompt}
                onChange={(e) => setFinalPrompt(e.target.value)}
                className="min-h-[160px]"
              />
              <p className="text-xs text-muted-foreground">This exact text will be sent to the model.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step >= 2 && step <= 4 && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (step === 4) {
                    const composed = generateAnimationPrompt({
                      style: config.style,
                      gender: config.gender,
                      species: config.species || "human",
                      personality: config.personality,
                    }, false)
                    setFinalPrompt(composed)
                  }
                  setStep(step + 1)
                }}
              >
                Skip
              </Button>
            )}
          </div>
          <Button onClick={handleNext} disabled={!isStepComplete()}>
            {step === 5 ? "Generate My Toon!" : "Next"}
            {step < 5 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
