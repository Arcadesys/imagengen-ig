import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isAdminRequest } from "@/lib/admin"

export async function GET(request: NextRequest) {
  try {
    // Admin-only endpoint
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const source = searchParams.get('source')

    const skip = (page - 1) * limit

    // Build where clause
    const where = source ? { source } : {}

    // Get signups with pagination
    const [signups, total] = await Promise.all([
      prisma.emailSignup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          preferences: true,
          source: true,
          verified: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.emailSignup.count({ where })
    ])

    // Get summary stats
    const stats = await prisma.emailSignup.groupBy({
      by: ['source'],
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } }
    })

    return NextResponse.json({
      success: true,
      signups,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats.map((stat: any) => ({
        source: stat.source,
        count: stat._count.source
      })),
      summary: {
        total,
        active: signups.filter((s: any) => s.active).length,
        verified: signups.filter((s: any) => s.verified).length
      }
    })

  } catch (error) {
    console.error("[Admin Email Signups] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch email signups" },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove a signup (unsubscribe)
export async function DELETE(request: NextRequest) {
  try {
    // Admin-only endpoint
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const id = searchParams.get('id')

    if (!email && !id) {
      return NextResponse.json(
        { error: "Email or ID is required" },
        { status: 400 }
      )
    }

    let where: { email: string } | { id: string }
    
    if (email) {
      where = { email: email.toLowerCase() }
    } else if (id) {
      where = { id }
    } else {
      return NextResponse.json(
        { error: "Valid email or ID is required" },
        { status: 400 }
      )
    }

    const deletedSignup = await prisma.emailSignup.delete({
      where
    })

    return NextResponse.json({
      success: true,
      message: "Email signup removed",
      deletedSignup: {
        id: deletedSignup.id,
        email: deletedSignup.email
      }
    })

  } catch (error) {
    console.error("[Admin Email Signups Delete] Error:", error)
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: "Email signup not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to remove email signup" },
      { status: 500 }
    )
  }
}
