import { describe, it, expect } from "vitest"
import { POST } from "../app/api/images/upload/route"

// Helper to create a mock NextRequest with formData support
function createFormDataRequest(formData: FormData): any {
  return {
    async formData() {
      return formData
    },
  } as any
}

describe("Upload API (unit)", () => {
  it("returns 400 when file missing", async () => {
    const fd = new FormData()
    const res = await POST(createFormDataRequest(fd))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/No file provided/i)
  })

  it("rejects invalid mime", async () => {
    const fd = new FormData()
    const bad = new File(["hello"], "a.txt", { type: "text/plain" })
    fd.append("file", bad)
    const res = await POST(createFormDataRequest(fd))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Invalid file type/i)
  })

  it("rejects >10MB", async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 2)], "big.png", { type: "image/png" })
    const fd = new FormData()
    fd.append("file", big)
    const res = await POST(createFormDataRequest(fd))
  // Random bytes aren't a valid image; compression will fail
  expect(res.status).toBe(400)
  const json = await res.json()
  expect(json.error).toMatch(/Failed to process image/i)
  })
})
