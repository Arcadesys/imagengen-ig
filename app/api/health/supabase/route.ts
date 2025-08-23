import { NextResponse } from "next/server"
import { supabaseAdmin, getSupabaseConfigStatus } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const status = getSupabaseConfigStatus()
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, configured: status }, { status: 500 })
    }

    // Try a privileged call to verify service role key works
    // listBuckets requires service role privileges
    const { data: buckets, error } = await (supabaseAdmin as any).storage.listBuckets()
    if (error) {
      return NextResponse.json({ ok: false, configured: status, error: error.message }, { status: 500 })
    }

    const names = (buckets || []).map((b: any) => b.name)
    const hasImages = names.includes("images")

    return NextResponse.json({ ok: true, configured: status, buckets: names, hasImages })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
