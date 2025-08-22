import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const list = await (prisma as any).imageGenerator.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ generators: list })
}
