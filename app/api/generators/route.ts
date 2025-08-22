import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const isAdmin = isAdminRequest(request)
    if (!session?.user?.id && !isAdmin) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { slug, name, description, style, config, theme, isActive } = await request.json()

    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 })
    }

    const normalizedSlug = String(slug).toLowerCase().trim()
    if (!/^[a-z0-9-]{2,64}$/.test(normalizedSlug)) {
      return NextResponse.json({ error: "Invalid slug format" }, { status: 400 })
    }

    // Check duplicate
    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug: normalizedSlug } })
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    const generator = await (prisma as any).imageGenerator.create({
      data: {
        slug: normalizedSlug,
        name: String(name),
        description: description ? String(description) : null,
        style: style ? String(style) : null,
        config: config ?? null,
        theme: theme ?? null,
        isActive: isActive ?? true,
        createdById: session?.user?.id || null,
      },
    })

    return NextResponse.json({ generator })
  } catch (error) {
    console.error("[generators POST]", error)
    return NextResponse.json({ error: "Failed to create generator" }, { status: 500 })
  }
}

// List generators (public)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const activeOnly = url.searchParams.get("active") === "true"

    const generators = await (prisma as any).imageGenerator.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ generators })
  } catch (error) {
    console.error("[generators GET]", error)
    return NextResponse.json({ error: "Failed to fetch generators" }, { status: 500 })
  }
}
