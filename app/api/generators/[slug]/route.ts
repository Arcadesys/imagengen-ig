import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"

// GET one generator by slug (public)
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const generator = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
    if (!generator) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ generator })
  } catch (error) {
    console.error("[generator GET]", error)
    return NextResponse.json({ error: "Failed to fetch generator" }, { status: 500 })
  }
}

// PATCH update (owner or admin)
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()

    // Fetch to verify ownership
    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isOwner = existing.createdById === session.user.id
    const isAdmin = isAdminRequest(request)
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await (prisma as any).imageGenerator.update({
      where: { slug: params.slug },
      data: {
        name: body.name ?? undefined,
        description: body.description ?? undefined,
        style: body.style ?? undefined,
        config: body.config ?? undefined,
        theme: body.theme ?? undefined,
        isActive: body.isActive ?? undefined,
        slug: body.slug ?? undefined,
      }
    })

    return NextResponse.json({ generator: updated })
  } catch (error) {
    console.error("[generator PATCH]", error)
    return NextResponse.json({ error: "Failed to update generator" }, { status: 500 })
  }
}

// DELETE generator (owner or admin)
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const existing = await (prisma as any).imageGenerator.findUnique({ where: { slug: params.slug } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const isOwner = existing.createdById === session.user.id
    const isAdmin = isAdminRequest(request)
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await (prisma as any).imageGenerator.delete({ where: { slug: params.slug } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[generator DELETE]", error)
    return NextResponse.json({ error: "Failed to delete generator" }, { status: 500 })
  }
}

// GET generator theme by slug (public)
export async function GET_THEME(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const generator = await (prisma as any).imageGenerator.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        theme: true,
      },
    })

    if (!generator || !generator.isActive) {
      return NextResponse.json({ error: "Generator not found or inactive" }, { status: 404 })
    }

    return NextResponse.json({ generator })
  } catch (error) {
    console.error("[generator GET_THEME]", error)
    return NextResponse.json({ error: "Failed to fetch generator" }, { status: 500 })
  }
}
