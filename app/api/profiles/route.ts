import { NextResponse } from "next/server"
import { loadProfiles, type GenerationProfile } from "../../../lib/profiles"
import { isAdminRequest } from "../../../lib/admin"
import path from "path"
import { existsSync } from "fs"
import { readFile, writeFile, mkdir } from "fs/promises"

export async function GET() {
  try {
    const profiles = await loadProfiles()
    return NextResponse.json({ profiles })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Admin-only
    if (!isAdminRequest(req as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = (await req.json()) as
      | { profile: GenerationProfile }
      | { profiles: GenerationProfile[] }

    const dataPath = path.join(process.cwd(), "data")
    const filePath = path.join(dataPath, "profiles.json")

    if (!existsSync(dataPath)) await mkdir(dataPath, { recursive: true })

    let current: GenerationProfile[] = []
    if (existsSync(filePath)) {
      try {
        const s = await readFile(filePath, "utf-8")
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) current = parsed
      } catch {}
    }

    const upserts = Array.isArray((json as any).profiles)
      ? ((json as any).profiles as GenerationProfile[])
      : [(json as any).profile as GenerationProfile]

    const byId: Record<string, GenerationProfile> = {}
    for (const p of current) byId[p.id] = p
    for (const p of upserts) byId[p.id] = p

    const merged = Object.values(byId)
    await writeFile(filePath, JSON.stringify(merged, null, 2), "utf-8")

    return NextResponse.json({ profiles: merged })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save profiles" }, { status: 500 })
  }
}
