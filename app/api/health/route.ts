import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isSupabaseConfigured, getSupabaseConfigStatus, supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const startedAt = Date.now()

  // Auth health (env-only to avoid leaking details)
  const authEnv = {
    hasUrl: !!process.env.NEXTAUTH_URL,
    hasSecret: !!process.env.NEXTAUTH_SECRET || !!process.env.AUTH_SECRET,
    hasTrustHost: process.env.AUTH_TRUST_HOST === "true" || process.env.NEXTAUTH_TRUST_HOST === "true" || false,
  }

  // Supabase health
  const supabaseEnv = getSupabaseConfigStatus()
  let supabaseOk = isSupabaseConfigured()
  let supabaseError: string | null = null
  try {
    if (supabaseOk && supabaseAdmin) {
      // Try listing the root of the public images bucket to validate service role and storage availability
      const { data, error } = await supabaseAdmin.storage.from("images").list("", { limit: 1 })
      if (error) {
        supabaseOk = false
        supabaseError = error.message
      } else {
        // data can be [] when empty; that's fine
        supabaseOk = true
      }
    }
  } catch (e: any) {
    supabaseOk = false
    supabaseError = e?.message || "Unknown Supabase error"
  }

  // DB health
  let dbOk = true
  let dbError: string | null = null
  try {
    // Lightweight ping
    await prisma.$queryRaw`SELECT 1` as any
  } catch (e: any) {
    dbOk = false
    dbError = e?.message || "Unknown DB error"
  }

  const durationMs = Date.now() - startedAt

  const payload = {
    ok: authEnv.hasUrl && authEnv.hasSecret && dbOk && supabaseOk,
    durationMs,
    auth: authEnv,
    supabase: { ...supabaseEnv, ok: supabaseOk, error: supabaseError },
    db: { ok: dbOk, error: dbError },
    env: {
      nodeEnv: process.env.NODE_ENV,
      appDebug: process.env.APP_DEBUG === "true",
      nextAuthDebug: process.env.NEXTAUTH_DEBUG === "true",
    },
    timestamp: new Date().toISOString(),
  }

  const status = payload.ok ? 200 : 503
  return NextResponse.json(payload, { status })
}
