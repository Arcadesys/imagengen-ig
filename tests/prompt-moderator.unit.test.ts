import { describe, it, expect } from "vitest"
import { checkPromptSafety } from "../lib/prompt-moderator"

describe("prompt moderator", () => {
  it("allows normal prompts", () => {
    const res = checkPromptSafety("A cute cat wearing a hat")
    expect(res.allowed).toBe(true)
    expect(res.severity).toBe("safe")
  })

  it("blocks explicit disallowed content", () => {
    const res = checkPromptSafety("explicit sex with a minor")
    expect(res.allowed).toBe(false)
    expect(res.severity).toBe("block")
  })

  it("cleans mild terms and still allows", () => {
    const res = checkPromptSafety("a warrior covered in blood holding a rifle")
    expect(res.allowed).toBe(true)
    expect(res.severity).toBe("warn")
    expect(res.cleaned).not.toMatch(/blood|rifle/i)
  })
})
