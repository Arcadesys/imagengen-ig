"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { renderTemplate } from "@/lib/template"
import { PROMPT_PRESETS, DEFAULT_TOON_PRESET_ID } from "@/lib/prompt-presets"
import { EnhancedImageUpload } from "@/components/enhanced-image-upload"
import { GenerationProgressModal } from "@/components/generation-progress-modal"
import { useGenerationProgress } from "@/hooks/use-generation-progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GalleryThumbnailsIcon as Gallery, Sparkles } from "lucide-react"
import Link from "next/link"

// Turn Toon — Ink & Paint Prompt Builder (Prototype)
// High-contrast, accessible controls with a simple template engine and copy/export helpers

const ALL_VARS = [
  "species",
  "world_type",
  "body_style",
  "blend_ratio",
  "effects",
  "props_list",
  "motion_lines",
  "custom_note",
  "companion_summary",
  "lighting",
  "base_image",
  "mask_data",
  // Advanced stylization
  "line_weight",
  "cel_shade_intensity",
  "rim_light",
  "halftone_density",
  "palette_vibrancy",
  "texture_amount",
  "outline_smoothness",
  "background_toonization",
  "identity_preservation",
  "mask_feather_px",
]

const DEFAULT_TEMPLATE = PROMPT_PRESETS.find((p) => p.id === DEFAULT_TOON_PRESET_ID)?.template ||
  "Live-action HDR photo plate in 4K with sharp detail; insert 2D/2.5D cartoon characters into the real-world environment without altering the background set [[mask_data|if:, edit only the masked regions]]. Preserve the original camera, lens, composition, and plate continuity with realistic depth of field (f/4–f/8). Style mix across characters: vintage rubber-limb animation::2, anime::2, Flash::2, Saturday-morning cel::2 — each retains its native style. Characters have bold black outlines, flat saturated colors (primary palette), expressive squash-and-stretch poses, and optional rim lighting or toon-glow for emphasis; no reflections on characters. Rendering: flat cel shading with two-tone shadows. Integration: cast clean contact shadows on real ground/props with correct perspective and softness; contrast the realistic scene lighting ([[lighting]]) with the inked cartoon look. Subject: [[species|title]][[companion_summary|prefix:, with ,true]]. Primary toon style: [[body_style]]. Target blend [[blend_ratio]]% toon vs real for characters only; do not toonize the background. [[effects|prefix:Effects: ,true|join:, ]]. [[props_list|prefix:Props: ,true|join:, ]]. [[motion_lines|if:Include motion-line smears.]] Slight digital grain overlay for cohesion. [[custom_note]] Safe-for-work, family-friendly, non-violent."

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ")
}

function Section({
  title,
  children,
  right,
}: {
  title: string
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {right}
      </div>
      <div className="rounded-2xl border-2 border-black/60 dark:border-white/70 bg-white dark:bg-black p-4 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff]">
        {children}
      </div>
    </div>
  )
}

function Labeled({
  label,
  children,
  hint,
  id,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  id?: string
}) {
  return (
    <label htmlFor={id} className="grid gap-1">
      <span className="text-sm font-bold text-black dark:text-white">{label}</span>
      {children}
      {hint && <span className="text-xs text-black/70 dark:text-white/70">{hint}</span>}
    </label>
  )
}

export default function TurnToonPage() {
  // Core state (stateless export — nothing persists after refresh)
  const [species, setSpecies] = useState("cat")
  const [worldType, setWorldType] = useState("hybrid world")
  const [bodyStyle, setBodyStyle] = useState("modern cartoon")
  const [blendRatio, setBlendRatio] = useState(40)
  const [effects, setEffects] = useState<string[]>(["ink splatter", "toon pop impact stars"])
  const [propsList, setPropsList] = useState<string[]>(["magic paintbrush"])
  const [motionLines, setMotionLines] = useState(true)
  const [customNote, setCustomNote] = useState("")
  const [companionSpecies, setCompanionSpecies] = useState("floating paintbrush")
  const [companionCount, setCompanionCount] = useState(1)
  const [lighting, setLighting] = useState("cel-shaded glow")
  const [templateText, setTemplateText] = useState(DEFAULT_TEMPLATE)
  const [presetId, setPresetId] = useState(DEFAULT_TOON_PRESET_ID)
  const [copyStatus, setCopyStatus] = useState<{ ok: boolean; method: string; message: string } | null>(null)
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [baseImageId, setBaseImageId] = useState<string | null>(null)
  const [maskData, setMaskData] = useState<string | null>(null)
  // Advanced output dials
  const [outputSize, setOutputSize] = useState<"512x512" | "768x768" | "1024x1024">("512x512")
  const [imageCount, setImageCount] = useState<number>(1)
  const [seed, setSeed] = useState<string>("")
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  // Stylization dials (0..100 except where noted)
  const [lineWeight, setLineWeight] = useState<number>(6) // 1..10
  const [celShadeIntensity, setCelShadeIntensity] = useState<number>(60)
  const [rimLight, setRimLight] = useState<number>(40)
  const [halftoneDensity, setHalftoneDensity] = useState<number>(30)
  const [paletteVibrancy, setPaletteVibrancy] = useState<number>(60)
  const [textureAmount, setTextureAmount] = useState<number>(30)
  const [outlineSmoothness, setOutlineSmoothness] = useState<number>(60)
  const [backgroundToonization, setBackgroundToonization] = useState<number>(40)
  const [identityPreservation, setIdentityPreservation] = useState<number>(80)
  const [maskFeatherPx, setMaskFeatherPx] = useState<number>(8) // 0..50

  const previewRef = useRef<HTMLPreElement | null>(null) // For select-text fallback

  // Derived values
  const companionSummary = useMemo(() => {
    if (companionSpecies === "none" || companionCount === 0) return "none"
    return `${companionCount} ${companionSpecies}${companionCount > 1 ? "s" : ""}`
  }, [companionSpecies, companionCount])

  // Value map for template rendering
  const varMap = useMemo(
    () => ({
      species,
      world_type: worldType,
      body_style: bodyStyle,
      blend_ratio: blendRatio,
      effects,
      props_list: propsList,
      motion_lines: motionLines,
      custom_note: customNote,
      companion_summary: companionSummary,
      lighting,
      base_image: baseImage,
      mask_data: maskData,
  // Advanced stylization
  line_weight: lineWeight,
  cel_shade_intensity: celShadeIntensity,
  rim_light: rimLight,
  halftone_density: halftoneDensity,
  palette_vibrancy: paletteVibrancy,
  texture_amount: textureAmount,
  outline_smoothness: outlineSmoothness,
  background_toonization: backgroundToonization,
  identity_preservation: identityPreservation,
  mask_feather_px: maskFeatherPx,
    }),
    [
      species,
      worldType,
      bodyStyle,
      blendRatio,
      effects,
      propsList,
      motionLines,
      customNote,
      companionSummary,
      lighting,
      baseImage,
      maskData,
    ],
  )

  // Render template
  const { output, errors } = useMemo(() => renderTemplate(templateText, varMap), [templateText, varMap])

  async function handleCopy() {
    const res = await copyToClipboardSafe(output, previewRef)
    setCopyStatus(res)
  }
  function handleSelect() {
    selectNodeContents(previewRef.current)
    setCopyStatus({ ok: false, method: "select", message: "Selected. Press ⌘/Ctrl+C to copy." })
  }
  function handleDownload() {
    downloadText("ink-paint-prompt.txt", output)
    setCopyStatus({ ok: true, method: "download", message: "Downloaded .txt" })
  }

  const progressModal = useGenerationProgress()

  return (
    <div className="min-h-dvh bg-white dark:bg-black text-black dark:text-white p-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <header className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Turn Toon — Ink & Paint Prompt Builder</h1>
              <p className="text-sm mt-1">
                Upload an image, paint a mask, build your prompt, then copy or send to generator.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/gallery">
                <Button variant="outline" className="btn-ghost flex items-center gap-2 bg-transparent">
                  <Gallery className="h-4 w-4" />
                  View Gallery
                </Button>
              </Link>
              <GenerateWithProgressButton
                prompt={output}
                baseImage={baseImage}
                baseImageId={baseImageId || undefined}
                maskData={maskData}
                progressModal={progressModal}
                size={outputSize}
                n={imageCount}
                seed={seed.trim() ? seed.trim() : undefined}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {baseImage && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                ✓ Base Image Ready
              </Badge>
            )}
            {maskData && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                ✓ Mask Painted
              </Badge>
            )}
            {output.trim() && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                ✓ Prompt Ready ({output.length} chars)
              </Badge>
            )}
          </div>
        </header>

        {/* LEFT: Controls */}
        <div>
          {/* Image Upload & Mask Painting Section */}
          <Section title="Image Upload & Mask">
            <EnhancedImageUpload
              onUpload={(id, url) => {
                setBaseImageId(id)
                setBaseImage(url)
              }}
              onRemove={() => {
                setBaseImage(null)
                setBaseImageId(null)
                setMaskData(null)
              }}
              onMaskChange={setMaskData}
              uploadedImage={baseImage ? { id: baseImageId ?? "", url: baseImage } : null}
            />
            {baseImage && (
              <div className="mt-3 text-sm">
                <div className="font-bold">✓ Base image uploaded</div>
                {maskData && (
                  <div className="font-bold text-green-600 dark:text-green-400">
                    ✓ Mask painted - ready for selective editing
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section title="Basics">
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Species" id="species">
                <select id="species" className="input" value={species} onChange={(e) => setSpecies(e.target.value)}>
                  {[
                    "cat",
                    "fox",
                    "rabbit",
                    "dog",
                    "mouse",
                    "wolf",
                    "bear",
                    "dragon",
                    "bird",
                    "deer",
                    "horse",
                    "shark",
                    "lizard",
                    "bat",
                    "raccoon",
                    "tanuki",
                    "human",
                  ].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="World Type" id="worldType">
                <select
                  id="worldType"
                  className="input"
                  value={worldType}
                  onChange={(e) => setWorldType(e.target.value)}
                >
                  {["real world", "toon world", "hybrid world"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Body Style" id="bodyStyle">
                <select
                  id="bodyStyle"
                  className="input"
                  value={bodyStyle}
                  onChange={(e) => setBodyStyle(e.target.value)}
                >
                  {[
                    "noodle-limb (1920s cartoon)",
                    "mid-century cartoon",
                    "modern cartoon",
                    "semi-realistic",
                    "realistic",
                    "stop-motion look",
                    "super-deformed (SD)",
                  ].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Toon↔Real Blend" id="blend">
                <div className="flex items-center gap-3">
                  <input
                    id="blend"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={blendRatio}
                    onChange={(e) => setBlendRatio(Number(e.target.value))}
                    className="w-full accent-black dark:accent-white"
                    aria-label="Toon to real blend percentage"
                  />
                  <span className="w-16 text-right tabular-nums font-bold">{blendRatio}%</span>
                </div>
              </Labeled>
            </div>
          </Section>

          <Section title="Effects">
            <A11yChecklist
              id="effects"
              label="Toggle effects (order = output order)"
              options={[
                "ink splatter",
                "paint drip",
                "toon pop impact stars",
                "speed lines",
                "halftone dots",
                "glitter/sparkles",
                "paper texture",
              ]}
              value={effects}
              onChange={setEffects}
              allowReorder
            />
          </Section>

          <Section title="Props">
            <A11yChecklist
              id="props"
              label="Toggle props (order = output order)"
              options={[
                "magic paintbrush",
                "giant pencil",
                "microphone",
                "oversized toy mallet",
                "film clapboard",
                "umbrella",
                "balloon bunch",
              ]}
              value={propsList}
              onChange={setPropsList}
              allowReorder
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Labeled label="Motion Lines">
                <div className="flex items-center gap-3">
                  <input
                    id="motion"
                    type="checkbox"
                    checked={motionLines}
                    onChange={(e) => setMotionLines(e.target.checked)}
                    className="h-6 w-6 accent-black dark:accent-white"
                  />
                  <label htmlFor="motion" className="text-base font-bold">
                    {motionLines ? "Enabled" : "Disabled"}
                  </label>
                </div>
              </Labeled>
              <Labeled label="Custom Note" id="custom">
                <input
                  id="custom"
                  className="input"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g., blue cape with gold trim"
                />
              </Labeled>
            </div>
          </Section>

          <Section title="Companion & Lighting">
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Companion Species" id="companionSpecies">
                <select
                  id="companionSpecies"
                  className="input"
                  value={companionSpecies}
                  onChange={(e) => setCompanionSpecies(e.target.value)}
                >
                  {["mouse", "bird", "floating paintbrush", "mini-robot", "cat", "dog", "none"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Companion Count" id="companionCount">
                <div className="flex items-center gap-3">
                  <input
                    id="companionCount"
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={companionCount}
                    onChange={(e) => setCompanionCount(Number(e.target.value))}
                    className="w-full accent-black dark:accent-white"
                  />
                  <span className="w-8 text-right tabular-nums font-bold">{companionCount}</span>
                </div>
              </Labeled>
              <Labeled label="Lighting" id="lighting">
                <select id="lighting" className="input" value={lighting} onChange={(e) => setLighting(e.target.value)}>
                  {[
                    "bright technicolor",
                    "noir high-contrast",
                    "cel-shaded glow",
                    "neon rimlight",
                    "watercolor wash",
                    "pastel morning",
                    "golden-hour warm",
                    "moonlit cool",
                  ].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Labeled>
              <div className="grid content-end">
                <div className="text-sm">
                  Companion summary: <span className="font-extrabold">{companionSummary}</span>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* RIGHT: Template + Preview */}
        <div>
          <Section
            title="Template"
            right={
              <button onClick={() => setTemplateText(DEFAULT_TEMPLATE)} className="text-sm underline font-bold">
                Reset
              </button>
            }
          >
            <div className="mb-3 flex items-center gap-2">
              <label htmlFor="preset" className="text-sm font-bold">Preset</label>
              <select
                id="preset"
                className="input"
                value={presetId}
                onChange={(e) => {
                  const id = e.target.value
                  setPresetId(id)
                  const p = PROMPT_PRESETS.find((x) => x.id === id)
                  if (p) setTemplateText(p.template)
                }}
              >
                {PROMPT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Labeled
              label="Prompt Template (supports [[placeholders]])"
              hint="Use [[var]] and filters: |join:,  |if:text |omit:none |prefix:Text ,true |upper |lower |title"
              id="tpl"
            >
              <textarea
                id="tpl"
                className="input h-40"
                value={templateText}
                onChange={(e) => setTemplateText(e.target.value)}
              />
            </Labeled>
            <div className="mt-2 text-xs">
              Available vars: <strong>{ALL_VARS.join(", ")}</strong>
            </div>
            {errors.length > 0 && (
              <div className="mt-3 rounded-xl border-2 border-[#9c1c1c] bg-[#ffeaea] text-[#2a0000] p-3 text-sm">
                <div className="font-extrabold mb-1">Validator</div>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section
            title="Advanced (Output Dials)"
            right={
              <button
                className="text-sm underline font-bold"
                onClick={() => setShowAdvanced((v) => !v)}
                aria-expanded={showAdvanced}
                aria-controls="advanced-content"
              >
                {showAdvanced ? "Collapse" : "Expand"}
              </button>
            }
          >
            {showAdvanced && (
              <div id="advanced-content" className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Labeled label="Output Size" id="out-size">
                    <select
                      id="out-size"
                      className="input"
                      value={outputSize}
                      onChange={(e) => setOutputSize(e.target.value as any)}
                    >
                      <option value="512x512">512 × 512</option>
                      <option value="768x768">768 × 768</option>
                      <option value="1024x1024">1024 × 1024</option>
                    </select>
                  </Labeled>
                  <Labeled label="Number of Images" id="out-count">
                    <div className="flex items-center gap-3">
                      <input
                        id="out-count"
                        type="range"
                        min={1}
                        max={4}
                        step={1}
                        value={imageCount}
                        onChange={(e) => setImageCount(Number(e.target.value))}
                        className="w-full accent-black dark:accent-white"
                        aria-label="Number of images to generate"
                      />
                      <span className="w-8 text-right tabular-nums font-bold">{imageCount}</span>
                    </div>
                    {maskData && imageCount > 1 && (
                      <div className="text-xs mt-2 text-red-600 dark:text-red-400">
                        Mask editing supports only 1 image at a time.
                      </div>
                    )}
                  </Labeled>
                  <Labeled label="Seed (optional)" id="out-seed">
                    <input
                      id="out-seed"
                      className="input"
                      placeholder="e.g., 12345"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                    />
                  </Labeled>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Labeled label={`Line Weight (${lineWeight}/10)`} id="lw">
                    <input id="lw" type="range" min={1} max={10} step={1} value={lineWeight} onChange={(e) => setLineWeight(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Cel Shade Intensity (${celShadeIntensity}%)`} id="csi">
                    <input id="csi" type="range" min={0} max={100} step={5} value={celShadeIntensity} onChange={(e) => setCelShadeIntensity(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Rim Light (${rimLight}%)`} id="rl">
                    <input id="rl" type="range" min={0} max={100} step={5} value={rimLight} onChange={(e) => setRimLight(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Halftone Density (${halftoneDensity}%)`} id="hd">
                    <input id="hd" type="range" min={0} max={100} step={5} value={halftoneDensity} onChange={(e) => setHalftoneDensity(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Palette Vibrancy (${paletteVibrancy}%)`} id="pv">
                    <input id="pv" type="range" min={0} max={100} step={5} value={paletteVibrancy} onChange={(e) => setPaletteVibrancy(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Texture Amount (${textureAmount}%)`} id="ta">
                    <input id="ta" type="range" min={0} max={100} step={5} value={textureAmount} onChange={(e) => setTextureAmount(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Outline Smoothness (${outlineSmoothness}%)`} id="os">
                    <input id="os" type="range" min={0} max={100} step={5} value={outlineSmoothness} onChange={(e) => setOutlineSmoothness(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Background Toonization (${backgroundToonization}%)`} id="bt">
                    <input id="bt" type="range" min={0} max={100} step={5} value={backgroundToonization} onChange={(e) => setBackgroundToonization(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Identity Preservation (${identityPreservation}%)`} id="ip">
                    <input id="ip" type="range" min={0} max={100} step={5} value={identityPreservation} onChange={(e) => setIdentityPreservation(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                  <Labeled label={`Mask Feather (${maskFeatherPx}px)`} id="mf">
                    <input id="mf" type="range" min={0} max={50} step={1} value={maskFeatherPx} onChange={(e) => setMaskFeatherPx(Number(e.target.value))} className="w-full accent-black dark:accent-white" />
                  </Labeled>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tip: With a mask, generation will force n=1. Larger sizes take longer.
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Preview & Export"
            right={
              <div className="flex items-center gap-2">
                <CopyExportBar
                  onCopy={handleCopy}
                  onSelect={handleSelect}
                  onDownload={handleDownload}
                  status={copyStatus}
                />
                <SendToGeneratorButton prompt={output} baseImage={baseImage} maskData={maskData} />
              </div>
            }
          >
            <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-xl p-3">
              <pre ref={previewRef} className="whitespace-pre-wrap text-base leading-7">
                {output}
              </pre>
            </div>
            <div className="mt-3 text-sm">Copy and paste this prompt into your image generator.</div>
          </Section>

          <SelfTests />
        </div>
      </div>

      <GenerationProgressModal
        isOpen={progressModal.isOpen}
        onClose={progressModal.close}
        onCancel={progressModal.cancel}
        status={progressModal.status}
        progress={progressModal.progress}
        message={progressModal.message}
        error={progressModal.error}
        generatedCount={progressModal.generatedCount}
        totalCount={progressModal.totalCount}
      />

      {/* Local utility styles */}
      <style>{`
        .input {
          border-width: 2px;
          border-color: #000;
          background: #fff;
          color: #000;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 16px;
          outline: none;
        }
        .input:focus-visible {
          box-shadow: 0 0 0 3px #000, 0 0 0 6px #FFD400; /* bold black + yellow ring */
        }
        @media (prefers-color-scheme: dark) {
          .input {
            border-color: #fff;
            background: #000;
            color: #fff;
          }
          .input:focus-visible {
            box-shadow: 0 0 0 3px #fff, 0 0 0 6px #00E6FF;
          }
        }
        .btn-ghost {
          border: 2px solid #000;
          background: #fff;
          color: #000;
          border-radius: 12px;
          padding: 8px 10px;
          font-weight: 800;
        }
        .btn-ghost:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px #000, 0 0 0 6px #FFD400;
        }
        @media (prefers-color-scheme: dark) {
          .btn-ghost {
            border-color: #fff;
            background: #000;
            color: #fff;
          }
          .btn-ghost:focus-visible {
            box-shadow: 0 0 0 3px #fff, 0 0 0 6px #00E6FF;
          }
        }
      `}</style>
    </div>
  )
}

/** High-contrast, accessible checklist with reorder */
function A11yChecklist({
  id,
  label,
  options,
  value,
  onChange,
  allowReorder,
}: {
  id: string
  label: string
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  allowReorder?: boolean
}) {
  // selection helpers
  const isSelected = (opt: string) => value.includes(opt)
  const toggle = (opt: string) => {
    if (isSelected(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else {
      onChange([...value, opt]) // add to end to preserve order
    }
  }
  const move = (opt: string, dir: -1 | 1) => {
    const idx = value.indexOf(opt)
    if (idx < 0) return
    const next = [...value]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }
  const addAll = () => onChange([...options])
  const clearAll = () => onChange([])

  return (
    <div aria-labelledby={`${id}-label`} role="group">
      <div id={`${id}-label`} className="sr-only">
        {label}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button type="button" className="btn-ghost" onClick={addAll}>
          Select all
        </button>
        <button type="button" className="btn-ghost" onClick={clearAll}>
          Clear all
        </button>
        <span className="text-sm font-bold ml-2">
          Selected: {value.length}/{options.length}
        </span>
      </div>

      <ul aria-describedby={`${id}-hint`} className="grid gap-2" role="listbox" aria-multiselectable="true">
        {options.map((opt) => {
          const selected = isSelected(opt)
          return (
            <li
              key={opt}
              role="option"
              aria-selected={selected}
              className={classNames(
                "rounded-xl border-2 px-3 py-2 flex items-center justify-between gap-3 min-h-[44px]",
                selected ? "bg-black text-white border-black" : "bg-white text-black border-black",
                "focus-within:outline-none focus-within:ring-4 focus-within:ring-[#FFD400] dark:focus-within:ring-[#00E6FF]",
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  id={`${id}-${opt}`}
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(opt)}
                  className="h-6 w-6 accent-black dark:accent-white"
                />
                <label htmlFor={`${id}-${opt}`} className="font-extrabold text-base">
                  {opt}
                </label>
              </div>

              {allowReorder && selected && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => move(opt, -1)}
                    aria-label={`Move ${opt} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => move(opt, +1)}
                    aria-label={`Move ${opt} down`}
                  >
                    ↓
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div id={`${id}-hint`} className="mt-2 text-sm">
        Space toggles. Use the Up/Down buttons to reorder selected items.
      </div>
    </div>
  )
}

function CopyExportBar({
  onCopy,
  onSelect,
  onDownload,
  status,
}: {
  onCopy: () => void
  onSelect: () => void
  onDownload: () => void
  status: { ok: boolean; method: string; message: string } | null
}) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onCopy} className="btn-ghost">
        ⧉ Copy
      </button>
      <button onClick={onSelect} className="btn-ghost">
        ⌘/Ctrl+C
      </button>
      <button onClick={onDownload} className="btn-ghost">
        ↓ .txt
      </button>
      {status && (
        <span
          className={classNames(
            "ml-2 text-xs px-2 py-1 rounded-md",
            status.ok ? "bg-[#D1FFD6] text-[#004D0A]" : "bg-[#FFF1C4] text-[#4D3B00]",
          )}
          aria-live="polite"
        >
          {status.message || (status.ok ? `Copied (${status.method})` : `Clipboard blocked — ${status.method}`)}
        </span>
      )}
    </div>
  )
}

// Send prompt to the main generator page
function SendToGeneratorButton({
  prompt,
  baseImage,
  maskData,
}: { prompt: string; baseImage?: string | null; maskData?: string | null }) {
  const handleSend = () => {
    try {
      sessionStorage.setItem(
        "reusePrompt",
        JSON.stringify({
          prompt,
          baseImage,
          maskData,
        }),
      )
    } catch {
      // ignore storage errors
    }
    window.location.href = "/"
  }
  return (
    <button className="btn-ghost" onClick={handleSend} aria-label="Send to Generator">
      → Send to Generator
    </button>
  )
}

// -------- Self Tests --------
function SelfTests() {
  const tests = useMemo(() => {
    const cases: any[] = []

    // 1) Basic substitution
    cases.push({
      name: "basic vars",
      tpl: "[[species]] [[world_type]] [[lighting]]",
      vars: { species: "cat", world_type: "hybrid world", lighting: "cel-shaded glow" },
      expect: "cat hybrid world cel-shaded glow",
    })

    // 2) join filter preserves order
    cases.push({
      name: "join filter",
      tpl: "Efx: [[effects|join: + ]]",
      vars: { effects: ["ink", "stars"] },
      expect: "Efx: ink + stars",
    })

    // 3) if filter true/false
    cases.push({
      name: "if filter true",
      tpl: "[[motion_lines|if:with smears]]",
      vars: { motion_lines: true },
      expect: "with smears",
    })
    cases.push({
      name: "if filter false",
      tpl: "[[motion_lines|if:with smears]]",
      vars: { motion_lines: false },
      expect: "",
    })

    // 4) omit none
    cases.push({
      name: "omit none",
      tpl: "[[companion_summary|omit:none|prefix:Companion: ,true]]",
      vars: { companion_summary: "none" },
      expect: "",
    })

    // 5) unknown var error
    cases.push({
      name: "unknown var",
      tpl: "[[bogus]]",
      vars: {},
      expectErrors: ["Unknown variables: bogus"],
    })

    // 6) unbalanced placeholder
    cases.push({
      name: "unbalanced",
      tpl: "[[species]",
      vars: { species: "cat" },
      expectErrors: ["Unbalanced [[ ]] placeholders."],
    })

    return cases.map(runCase)
  }, [])

  const allPass = tests.every((t) => t.pass)

  return (
    <Section
      title="Self-Tests"
      right={
        <span
          className={classNames(
            "text-xs px-2 py-1 rounded-md",
            allPass ? "bg-[#D1FFD6] text-[#004D0A]" : "bg-[#FFE1E1] text-[#6B0000]",
          )}
        >
          {allPass ? "All tests passed" : "Some tests failed"}
        </span>
      }
    >
      <ul className="text-sm space-y-1">
        {tests.map((t, i) => (
          <li key={i} className={classNames(t.pass ? "text-[#004D0A]" : "text-[#6B0000]")}>
            • {t.name}: {t.pass ? "ok" : t.message}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function runCase(c: any) {
  const { output, errors } = renderTemplate(c.tpl, c.vars)
  if (c.expectErrors) {
    const missing = c.expectErrors.filter((e: string) => !errors.includes(e))
    return missing.length === 0
      ? { ...c, pass: true }
      : { ...c, pass: false, message: `missing error(s): ${missing.join("; ")}` }
  }
  const pass = output === c.expect
  return pass ? { ...c, pass: true } : { ...c, pass: false, message: `got "${output}" expected "${c.expect}"` }
}

function GenerateWithProgressButton({
  prompt,
  baseImage,
  baseImageId: initialBaseImageId,
  maskData,
  progressModal,
  size,
  n,
  seed,
}: {
  prompt: string
  baseImage?: string | null
  baseImageId?: string
  maskData?: string | null
  progressModal: ReturnType<typeof useGenerationProgress>
  size: "512x512" | "768x768" | "1024x1024"
  n: number
  seed?: string
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please create a prompt first!")
      return
    }

  // Enforce mask editing constraint
  const count = maskData ? 1 : Math.max(1, Math.min(4, n))

  setIsGenerating(true)
  progressModal.startGeneration(count)

    try {
      // Step 1: Upload base image if provided (skip if already an uploaded base image)
      let baseImageId: string | null = null
      if (baseImage) {
        const isAlreadyUploaded = baseImage.startsWith("/uploads/base/") && !!initialBaseImageId
        if (isAlreadyUploaded) {
          baseImageId = initialBaseImageId as string
        } else {
          progressModal.updateProgress("uploading", 10, "Uploading base image...")

          const formData = new FormData()
          const response = await fetch(baseImage)
          const blob = await response.blob()
          // API expects the field name "file"
          formData.append("file", blob, "base-image.png")

          const uploadResponse = await fetch("/api/images/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload base image")
          }

          const uploadResult = await uploadResponse.json()
          baseImageId = uploadResult.baseImageId
        }
      }

  // Step 2: Generate image(s)
      progressModal.updateProgress("generating", 30, "Generating your toon image...")

      const generateResponse = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          n: count,
          size,
          baseImageId,
          maskData,
          seed: seed && seed.length ? seed : undefined,
        }),
      })

      if (!generateResponse.ok) {
        const contentType = generateResponse.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const error = await generateResponse.json()
          throw new Error(error.error || "Generation failed")
        } else {
          throw new Error("Server error. Please try again later.")
        }
      }

  progressModal.updateProgress("downloading", 80, count > 1 ? "Saving generated images..." : "Saving generated image...")

      const result = await generateResponse.json()

      // Step 3: Save to gallery
      progressModal.updateProgress("downloading", 90, "Adding to gallery...")

      const galleryResponse = await fetch("/api/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: result.images || [],
        }),
      })

      if (!galleryResponse.ok) {
        console.warn("Failed to save to gallery, but generation succeeded")
      }

      progressModal.complete()

      // Redirect to gallery after a short delay
      setTimeout(() => {
        window.location.href = "/gallery"
      }, 2000)
    } catch (error) {
      console.error("Generation error:", error)
      progressModal.setError(error instanceof Error ? error.message : "Generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating || !prompt.trim()}
      className="btn-ghost flex items-center gap-2"
    >
      <Sparkles className="h-4 w-4" />
      {isGenerating ? "Generating..." : "Generate Now"}
    </Button>
  )
}

// -------- Clipboard helpers --------
async function copyToClipboardSafe(text: string, targetRef: React.RefObject<HTMLElement | null>) {
  // Attempt 1: modern Clipboard API (often blocked in sandbox)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return { ok: true, method: "clipboard", message: "Copied to clipboard" }
    }
    throw new Error("Clipboard API unavailable")
  } catch {
    // Attempt 2: legacy execCommand('copy')
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const success = document.execCommand("copy")
      document.body.removeChild(ta)
      if (success) {
        return { ok: true, method: "execCommand", message: "Copied to clipboard" }
      }
      throw new Error("execCommand failed")
    } catch {
      // Attempt 3: select the text and instruct the user
      if (targetRef?.current) {
        selectNodeContents(targetRef.current)
      }
      return { ok: false, method: "select", message: "Clipboard blocked. Text selected. Press ⌘/Ctrl+C." }
    }
  }
}

function selectNodeContents(node: HTMLElement | null) {
  if (!node) return
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  range.selectNodeContents(node)
  sel.removeAllRanges()
  sel.addRange(range)
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
