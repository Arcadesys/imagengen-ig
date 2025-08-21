"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { PuppetStyle } from "@/lib/puppet-prompts"

interface PuppetConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: PuppetConfiguration) => void
  initialConfig?: Partial<PuppetConfiguration>
}

export interface PuppetConfiguration {
  style: PuppetStyle
  gender: string
  species: string
  personality: string
}

const PUPPET_STYLES = [
  // Classic Styles
  { id: "muppet" as const, name: "Muppet", description: "Classic Sesame Street style with foam and felt" },
  { id: "sock" as const, name: "Sock Puppet", description: "Simple knitted sock with button eyes" },
  { id: "felt" as const, name: "Felt Puppet", description: "Hand-stitched wool felt with embroidered features" },
  { id: "plush" as const, name: "Plush Toy", description: "Soft stuffed animal style" },
  { id: "paper" as const, name: "Paper Craft", description: "Flat paper construction with drawn features" },
  
  // Performance Styles
  { id: "marionette" as const, name: "Marionette", description: "String puppet with wooden joints and controls" },
  { id: "hand-puppet" as const, name: "Hand Puppet", description: "Traditional glove puppet for hand manipulation" },
  { id: "rod-puppet" as const, name: "Rod Puppet", description: "Controlled by rods and sticks from below" },
  { id: "ventriloquist" as const, name: "Ventriloquist Dummy", description: "Wooden dummy with moving mouth and eyes" },
  { id: "bunraku" as const, name: "Bunraku", description: "Japanese traditional puppet with visible operators" },
  
  // Character Styles
  { id: "mascot" as const, name: "Sports Mascot", description: "Oversized foam head with team colors" },
  { id: "costume" as const, name: "Full Body Costume", description: "Complete character suit with mask" },
  { id: "fursuit" as const, name: "Fursuit", description: "Anthropomorphic animal costume" },
  { id: "anime-mascot" as const, name: "Anime Mascot", description: "Japanese kawaii character style" },
  
  // Material-Based
  { id: "wooden" as const, name: "Wooden Puppet", description: "Carved wood with articulated joints" },
  { id: "plastic" as const, name: "Plastic Figure", description: "Molded plastic action figure style" },
  { id: "clay" as const, name: "Clay/Plasticine", description: "Stop-motion clay animation style" },
  { id: "foam" as const, name: "Foam Puppet", description: "Dense foam construction with fabric skin" },
  { id: "latex" as const, name: "Latex Mask", description: "Realistic latex prosthetic style" },
  
  // Craft Styles
  { id: "finger-puppet" as const, name: "Finger Puppet", description: "Tiny puppet for finger manipulation" },
  { id: "shadow-puppet" as const, name: "Shadow Puppet", description: "Flat silhouette for shadow play" },
  { id: "origami" as const, name: "Origami", description: "Folded paper puppet style" },
  { id: "balloon" as const, name: "Balloon Animal", description: "Twisted balloon sculpture style" },
  { id: "cardboard" as const, name: "Cardboard", description: "Corrugated cardboard construction" },
  
  // Modern/Digital
  { id: "vtuber" as const, name: "VTuber Avatar", description: "Digital anime-style virtual avatar" },
  { id: "cgi" as const, name: "CGI Character", description: "3D computer animated character" },
  { id: "pixel-art" as const, name: "Pixel Art", description: "Retro 8-bit video game style" },
  
  // Cultural/Traditional
  { id: "punch-judy" as const, name: "Punch & Judy", description: "Traditional English puppet show style" },
  { id: "wayang" as const, name: "Wayang", description: "Indonesian shadow puppet with intricate details" },
  { id: "kasperle" as const, name: "Kasperle", description: "German hand puppet with pointed cap" },
  { id: "guignol" as const, name: "Guignol", description: "French puppet theater character" },
  
  // Specialty/Artistic
  { id: "steampunk" as const, name: "Steampunk", description: "Victorian mechanical with gears and brass" },
  { id: "gothic" as const, name: "Gothic", description: "Dark romantic with lace and velvet" },
  { id: "cyberpunk" as const, name: "Cyberpunk", description: "Futuristic with neon and chrome" },
  { id: "tribal" as const, name: "Tribal Mask", description: "Traditional ceremonial mask style" },
  { id: "dia-de-muertos" as const, name: "Día de Muertos", description: "Mexican Day of the Dead skull decoration" },
  
  // Fun/Quirky
  { id: "food" as const, name: "Food Puppet", description: "Made to look like food items" },
  { id: "object" as const, name: "Object Puppet", description: "Everyday objects given puppet life" },
  { id: "abstract" as const, name: "Abstract Art", description: "Non-representational artistic form" },
  { id: "glitch" as const, name: "Glitch Art", description: "Digital corruption aesthetic" },
  { id: "neon" as const, name: "Neon", description: "Bright fluorescent colors that glow" }
]

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
  // Animals
  "Cat", "Dog", "Wolf", "Fox", "Bear", "Lion", "Tiger", "Elephant", "Giraffe", 
  "Monkey", "Rabbit", "Mouse", "Hamster", "Pig", "Cow", "Horse", "Sheep", 
  "Goat", "Chicken", "Duck", "Owl", "Eagle", "Penguin", "Dolphin", "Whale",
  "Shark", "Octopus", "Butterfly", "Bee", "Spider", "Frog", "Turtle", "Snake",
  
  // Monsters & Fantasy
  "Monster", "Dragon", "Dinosaur", "Alien", "Robot", "Ghost", "Zombie", "Vampire",
  "Werewolf", "Demon", "Angel", "Fairy", "Elf", "Goblin", "Troll", "Orc",
  "Unicorn", "Pegasus", "Phoenix", "Griffin", "Chimera", "Kraken", "Yeti",
  
  // Mythical/Cultural
  "Kappa", "Tengu", "Yokai", "Wendigo", "Chupacabra", "Bigfoot", "Mothman",
  "Jersey Devil", "Banshee", "Kelpie", "Selkie", "Djinn", "Sphinx"
]

export function PuppetConfigurationModal({ 
  isOpen, 
  onClose, 
  onComplete,
  initialConfig 
}: PuppetConfigurationModalProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<PuppetConfiguration>({
    style: "muppet",
    gender: "",
    species: "",
    personality: "",
    ...initialConfig
  })

  const [genderSearch, setGenderSearch] = useState("")
  const [speciesSearch, setSpeciesSearch] = useState("")
  const [styleSearch, setStyleSearch] = useState("")

  const filteredGenders = GENDER_OPTIONS.filter(g => 
    g.toLowerCase().includes(genderSearch.toLowerCase())
  )

  const filteredSpecies = SPECIES_OPTIONS.filter(s => 
    s.toLowerCase().includes(speciesSearch.toLowerCase())
  )

  const filteredStyles = PUPPET_STYLES.filter(s => 
    s.name.toLowerCase().includes(styleSearch.toLowerCase()) ||
    s.description.toLowerCase().includes(styleSearch.toLowerCase())
  )

  const handleNext = useCallback(() => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      onComplete(config)
    }
  }, [step, config, onComplete])

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      onClose()
    }
  }, [step, onClose])

  const isStepComplete = useCallback(() => {
    switch (step) {
      case 1: return !!config.style
      case 2: return !!config.gender
      case 3: return !!config.species
      case 4: return !!config.personality
      default: return false
    }
  }, [step, config])

  // Reset to step 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {step === 1 && "Choose Your Puppet Style"}
              {step === 2 && "What's Your Gender?"}
              {step === 3 && "Animal or Monster?"}
              {step === 4 && "What Kind of Puppet Are You?"}
            </h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
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
              <p className="text-muted-foreground">
                Pick the style of puppet you want to become!
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search puppet styles..."
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
                    onClick={() => setConfig(prev => ({ ...prev, style: style.id }))}
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
                  <p>No puppet styles found. Try a different search term.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select your gender identity (optional but helps with personalization):
              </p>
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
              <p className="text-muted-foreground">
                Do you wanna be an animal or monster puppet?
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for animals, monsters, mythical creatures..."
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {filteredSpecies.map(species => (
                  <Button
                    key={species}
                    variant={config.species === species ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setConfig(prev => ({ ...prev, species }))}
                  >
                    {species}
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
              <p className="text-muted-foreground">
                What's your puppet personality? This will influence how your puppet looks and feels!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {PERSONALITY_OPTIONS.map(personality => (
                  <Card 
                    key={personality.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      config.personality === personality.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setConfig(prev => ({ ...prev, personality: personality.id }))}
                  >
                    <h3 className="font-semibold text-lg">{personality.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {personality.description}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Preview */}
              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Your Puppet Preview</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Style:</strong> {PUPPET_STYLES.find(s => s.id === config.style)?.name}</p>
                  <p><strong>Gender:</strong> {config.gender || "Not specified"}</p>
                  <p><strong>Species:</strong> {config.species}</p>
                  <p><strong>Personality:</strong> {PERSONALITY_OPTIONS.find(p => p.id === config.personality)?.name || "Not selected"}</p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/20 flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!isStepComplete()}
          >
            {step === 4 ? "Generate My Puppet!" : "Next"}
            {step < 4 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
