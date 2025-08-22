import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createServer } from "http"
import next from "next"
import puppeteer from "puppeteer"
import type { Browser, Page, HTTPRequest } from "puppeteer"

// Ensure web dev server runs with Webpack for predictable dev behavior
process.env.NEXT_DISABLE_TURBOPACK = process.env.NEXT_DISABLE_TURBOPACK || "1"
// Provide a secret to avoid NextAuth warning during tests
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test_secret_for_e2e"

const app = next({ dev: true, dir: process.cwd() })
let server: any
let baseURL: string
let browser: Browser
let page: Page
let onRequest: ((req: HTTPRequest) => Promise<void>) | null = null

beforeAll(async () => {
  await app.prepare()
  server = createServer((req, res) => app.getRequestHandler()(req, res))
  await new Promise((resolve) => server.listen(0, resolve))
  const port = (server.address() as any).port
  baseURL = `http://localhost:${port}`

  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  page = await browser.newPage()

  // Intercept the image generation API to avoid hitting real services
  await page.setRequestInterception(true)
  onRequest = async (request: HTTPRequest) => {
    try {
      const url = request.url()
      if (url.endsWith("/api/images/generate") && request.method() === "POST") {
        const oneByOnePngBase64 =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAgMBgUj4mYEAAAAASUVORK5CYII="
        const body = JSON.stringify({ images: [{ url: `data:image/png;base64,${oneByOnePngBase64}` }] })
        await request.respond({ status: 200, contentType: "application/json", body })
        return
      }
      await request.continue()
    } catch {
      try { await request.continue() } catch {}
    }
  }
  page.on("request", onRequest)
}, 90000)

afterAll(async () => {
  try {
    if (onRequest) page.off("request", onRequest)
    if (page) await page.close()
    if (browser) await browser.close()
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve))
  }
})

describe("[E2E] Dinosona generator", () => {
  it(
    "shows redirect to photobooth",
    async () => {
      // Navigate with a few retries in case the dev server is still compiling the route
      let attempts = 0
      let ok = false
      while (attempts < 5 && !ok) {
        try {
          const resp = await page.goto(`${baseURL}/dinosona`, { waitUntil: "networkidle2", timeout: 30000 })
          ok = (resp?.status() || 0) < 500
        } catch {
          ok = false
        }
        if (!ok) {
          await new Promise((r) => setTimeout(r, 500))
        }
        attempts++
      }

      // Wait for the redirect page to load
      await page.waitForSelector('h1', { timeout: 30000 })

      // Check for the redirect message
      const heading = await page.$eval('h1', el => el.textContent)
      expect(heading).toContain('Dinosona Photobooth')

      // Check for the photobooth link
      const link = await page.$('a[href="/photobooth?generator=dinosona"]')
      expect(link).toBeTruthy()

      // Check button text
      const button = await page.$('button')
      expect(button).toBeTruthy()
      const buttonText = await page.evaluate(el => el!.textContent, button)
      expect(buttonText).toContain('Open Photobooth')
    },
    60000,
  )
})
