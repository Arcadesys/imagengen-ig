"use client"

import React, { useMemo, useRef, useState } from "react"
import { renderTemplate } from "@/lib/template"

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
]

const DEFAULT_TEMPLATE =
  "[[species]] with a [[body_style]] body, in the [[world_type]], blend [[blend_ratio]]% real. [[effects|prefix:Effects: ,true|join:, ]]. [[props_list|prefix:Props: ,true|join:, ]]. [[motion_lines|if:with motion-line smears.]] [[custom_note]] [[companion_summary|omit:none|prefix:Companion: ,true]]. Lighting: [[lighting]]. Safe-for-work, family-friendly, suitable for all ages, non-violent."

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
  const [copyStatus, setCopyStatus] = useState<{ ok: boolean; method: string; message: string } | null>(null)

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
    }),
    [species, worldType, bodyStyle, blendRatio, effects, propsList, motionLines, customNote, companionSummary, lighting],
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

  return (
    <div className="min-h-dvh bg-white dark:bg-black text-black dark:text-white p-6">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <header className="lg:col-span-2">
          <h1 className="text-2xl font-extrabold tracking-tight">Turn Toon — Ink & Paint Prompt Builder</h1>
          <p className="text-sm mt-1">Bright, high-contrast lists. Build your prompt, then copy, select, or download.</p>
        </header>

        {/* LEFT: Controls */}
        <div>
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
                <select id="worldType" className="input" value={worldType} onChange={(e) => setWorldType(e.target.value)}>
                  {["real world", "toon world", "hybrid world"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Labeled>
      <Labeled label="Body Style" id="bodyStyle">
                <select id="bodyStyle" className="input" value={bodyStyle} onChange={(e) => setBodyStyle(e.target.value)}>
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
              options={["ink splatter", "paint drip", "toon pop impact stars", "speed lines", "halftone dots", "glitter/sparkles", "paper texture"]}
              value={effects}
              onChange={setEffects}
              allowReorder
            />
          </Section>

          <Section title="Props">
            <A11yChecklist
              id="props"
              label="Toggle props (order = output order)"
              options={["magic paintbrush", "giant pencil", "microphone", "oversized toy mallet", "film clapboard", "umbrella", "balloon bunch"]}
              value={propsList}
              onChange={setPropsList}
              allowReorder
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Labeled label="Motion Lines">
                <div className="flex items-center gap-3">
                  <input id="motion" type="checkbox" checked={motionLines} onChange={(e) => setMotionLines(e.target.checked)} className="h-6 w-6 accent-black dark:accent-white" />
                  <label htmlFor="motion" className="text-base font-bold">
                    {motionLines ? "Enabled" : "Disabled"}
                  </label>
                </div>
              </Labeled>
              <Labeled label="Custom Note" id="custom">
                <input id="custom" className="input" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="e.g., blue cape with gold trim" />
              </Labeled>
            </div>
          </Section>

          <Section title="Companion & Lighting">
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Companion Species" id="companionSpecies">
                <select id="companionSpecies" className="input" value={companionSpecies} onChange={(e) => setCompanionSpecies(e.target.value)}>
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
                  {["bright technicolor", "noir high-contrast", "cel-shaded glow", "neon rimlight", "watercolor wash", "pastel morning", "golden-hour warm", "moonlit cool"].map((o) => (
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
            <Labeled
              label="Prompt Template (supports [[placeholders]])"
              hint="Use [[var]] and filters: |join:,  |if:text |omit:none |prefix:Text ,true |upper |lower |title"
              id="tpl"
            >
              <textarea id="tpl" className="input h-40" value={templateText} onChange={(e) => setTemplateText(e.target.value)} />
            </Labeled>
            <div className="mt-2 text-xs">Available vars: <strong>{ALL_VARS.join(", ")}</strong></div>
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
            title="Preview & Export"
            right={
              <div className="flex items-center gap-2">
                <CopyExportBar onCopy={handleCopy} onSelect={handleSelect} onDownload={handleDownload} status={copyStatus} />
                <SendToGeneratorButton prompt={output} />
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
        <span className="text-sm font-bold ml-2">Selected: {value.length}/{options.length}</span>
      </div>

      <ul aria-describedby={`${id}-hint`} className="grid gap-2" role="listbox" aria-multiselectable="true">
        {options.map((opt) => {
          const selected = isSelected(opt)
          return (
            <li
              key={opt}
              role="option"
              aria-selected={selected}
              className={
                classNames(
                  "rounded-xl border-2 px-3 py-2 flex items-center justify-between gap-3 min-h-[44px]",
                  selected ? "bg-black text-white border-black" : "bg-white text-black border-black",
                  "focus-within:outline-none focus-within:ring-4 focus-within:ring-[#FFD400] dark:focus-within:ring-[#00E6FF]",
                )
              }
            >
              <div className="flex items-center gap-3">
                <input id={`${id}-${opt}`} type="checkbox" checked={selected} onChange={() => toggle(opt)} className="h-6 w-6 accent-black dark:accent-white" />
                <label htmlFor={`${id}-${opt}`} className="font-extrabold text-base">
                  {opt}
                </label>
              </div>

              {allowReorder && selected && (
                <div className="flex items-center gap-2">
                  <button type="button" className="btn-ghost" onClick={() => move(opt, -1)} aria-label={`Move ${opt} up`}>
                    ↑
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => move(opt, +1)} aria-label={`Move ${opt} down`}>
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
      <button onClick={onCopy} className="btn-ghost">⧉ Copy</button>
      <button onClick={onSelect} className="btn-ghost">⌘/Ctrl+C</button>
      <button onClick={onDownload} className="btn-ghost">↓ .txt</button>
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

// Send prompt to the main generator page
function SendToGeneratorButton({ prompt }: { prompt: string }) {
  const handleSend = () => {
    try {
      sessionStorage.setItem("reusePrompt", JSON.stringify({ prompt }))
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
      right={<span className={classNames("text-xs px-2 py-1 rounded-md", allPass ? "bg-[#D1FFD6] text-[#004D0A]" : "bg-[#FFE1E1] text-[#6B0000]")}>{allPass ? "All tests passed" : "Some tests failed"}</span>}
    >
      <ul className="text-sm space-y-1">
        {tests.map((t, i) => (
          <li key={i} className={classNames(t.pass ? "text-[#004D0A]" : "text-[#6B0000]")}>• {t.name}: {t.pass ? "ok" : t.message}</li>
        ))}
      </ul>
    </Section>
  )
}

function runCase(c: any) {
  const { output, errors } = renderTemplate(c.tpl, c.vars)
  if (c.expectErrors) {
    const missing = c.expectErrors.filter((e: string) => !errors.includes(e))
    return missing.length === 0 ? { ...c, pass: true } : { ...c, pass: false, message: `missing error(s): ${missing.join("; ")}` }
  }
  const pass = output === c.expect
  return pass ? { ...c, pass: true } : { ...c, pass: false, message: `got "${output}" expected "${c.expect}"` }
}
