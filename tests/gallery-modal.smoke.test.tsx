import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import GalleryPage from "../app/gallery/page"

// Mock fetch for gallery images
beforeAll(() => {
  global.fetch = vi.fn().mockImplementation((url) => {
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
    // Wait for gallery to load
    expect(await screen.findByText(/Gallery/)).toBeInTheDocument()
    // Find the image card
    const imgCard = await screen.findByRole("gridcell")
    expect(imgCard).toBeInTheDocument()
    // Click the image
    fireEvent.click(imgCard.querySelector(".aspect-square")!)
    // Modal should open
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    // Should show full size image
    expect(screen.getByAltText(/A test image/)).toBeInTheDocument()
    // Should show prompt
    expect(screen.getByText(/A test image expanded/)).toBeInTheDocument()
    // Should show size badge
    expect(screen.getByText(/1024x1024/)).toBeInTheDocument()
  })
})
