import { NextResponse } from "next/server"
import { searchTraits } from "@/data/traits"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? undefined
  const categoriesParam = searchParams.get("categories") ?? undefined
  const limitParam = searchParams.get("limit") ?? undefined
  const categories = categoriesParam ? categoriesParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined
  const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam) || 20)) : 20

  const items = searchTraits({ q, categories, limit })
  return NextResponse.json({ items })
}
