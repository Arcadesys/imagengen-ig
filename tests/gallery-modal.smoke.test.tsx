import React from "react"
import { describe, it, expect, beforeAll, vi } from "vitest"
import "@testing-library/jest-dom"
import { render, screen, fireEvent } from "@testing-library/react"

// Mock Next.js app router hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}))

import GalleryPage from "../app/gallery/page"

// Mock fetch for gallery images
beforeAll(() => {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === "/api/gallery") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: "img1",
            url: "/generated/test1.png",
            prompt: "A test image",
            expandedPrompt: "A test image expanded",
            size: "1024x1024",
            seed: 42,
            baseImageId: null,
            createdAt: new Date().toISOString(),
          },
        ]),
      })
    }
    // fallback
    return Promise.resolve({ ok: false, json: () => Promise.resolve([]) })
  })
})

describe("Gallery modal smoke test", () => {
  it("opens modal on image click and renders full size", async () => {
    render(<GalleryPage />)
  // Wait for gallery grid to load
  await screen.findByRole("grid")
  // Find the first image card
  const imgCard = await screen.findByRole("gridcell")
    expect(imgCard).toBeInTheDocument()
    // Click the image
    fireEvent.click(imgCard.querySelector(".aspect-square")!)
    // Modal should open
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  // Should show full size image (one or more img elements)
  const imgs = screen.getAllByAltText(/A test image/)
  expect(imgs.length).toBeGreaterThan(0)
    // Should show prompt (may appear in title and description)
    const prompts = screen.getAllByText(/A test image expanded/)
    expect(prompts.length).toBeGreaterThan(0)
    // Should show size badge
    expect(screen.getByText(/1024x1024/)).toBeInTheDocument()
  })
})
