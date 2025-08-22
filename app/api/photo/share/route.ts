import { type NextRequest, NextResponse } from "next/server"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

interface ShareRecord {
  id: string
  imageUrl: string
  style: string
  timestamp: string
  email?: string
  prompt?: string
  public: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, style, email, prompt } = await request.json()

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
    }

    const id = (globalThis as any).crypto?.randomUUID?.() || `photo_${Date.now()}`

    const dataDir = path.join(process.cwd(), "data")
    const sharesFile = path.join(dataDir, "shares.json")

    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true })
    }

    let shares: ShareRecord[] = []
    if (existsSync(sharesFile)) {
      try {
        const raw = await readFile(sharesFile, "utf-8")
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) shares = parsed
      } catch (e) {
        // start fresh on parse error
        shares = []
      }
    }

    const record: ShareRecord = {
      id,
      imageUrl,
      style: typeof style === "string" && style.trim() ? style : "custom",
      timestamp: new Date().toISOString(),
      email: typeof email === "string" ? email : undefined,
      prompt: typeof prompt === "string" ? prompt : undefined,
      public: true,
    }

    shares.push(record)
    await writeFile(sharesFile, JSON.stringify(shares, null, 2))

    return NextResponse.json({ success: true, photoId: id })
  } catch (error) {
    console.error("[share] Failed to create share:", error)
    return NextResponse.json({ error: "Failed to create share" }, { status: 500 })
  }
}
