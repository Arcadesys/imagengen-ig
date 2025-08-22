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
    "renders form and generates an image via intercepted API",
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

      // Wait for the form to be ready
      await page.waitForSelector('form[aria-label="dinosona-form"]', { timeout: 30000 })

      // Add a sample photo to satisfy base image requirement
      await page.click('[data-testid="use-sample-photo"]')

      // Wait until UI shows photo ready and the Generate button becomes enabled
      await page.waitForFunction(() => {
        return Array.from(document.querySelectorAll('span')).some(el => /photo ready/i.test((el.textContent || ''))) 
      }, { timeout: 30000 })
      await page.waitForFunction(() => {
        const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
        return !!btn && !btn.disabled
      }, { timeout: 30000 })

      // Type a custom species to verify inputs are interactive
      await page.type('#species', 'stegosaurus')

      // Submit the form
      await page.click('button[type="submit"]')

      // The page should render the generated image using the data URL we fulfilled
      await page.waitForSelector('img[alt="Generated dinosona"]', { timeout: 30000 })

      const imgSrc = await page.$eval('img[alt="Generated dinosona"]', (img: any) => (img as HTMLImageElement).src)
      expect(imgSrc.startsWith('data:image/png;base64,')).toBe(true)
    },
    120000,
  )
})
