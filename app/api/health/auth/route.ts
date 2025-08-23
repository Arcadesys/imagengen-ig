import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const session = await auth()
    return NextResponse.json({ ok: true, authenticated: !!session, sessionUserId: session?.user?.id ?? null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Auth error" }, { status: 500 })
  }
}
