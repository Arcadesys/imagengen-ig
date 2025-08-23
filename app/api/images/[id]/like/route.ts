import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const imageId = params.id
    const { sessionId } = await request.json().catch(() => ({}))
    
    // Get client IP for anonymous users
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Check if image exists
    const image = await (prisma as any).image.findUnique({
      where: { id: imageId }
    })
    
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Helper to increment/decrement likesCount safely
    const applyDelta = async (delta: number) => {
      try {
        await (prisma as any).image.update({
          where: { id: imageId },
          data: { likesCount: { increment: delta } }
        })
      } catch {}
    }

    // For authenticated users
    if (session?.user?.id) {
      // Check if user already liked this image
      const existingLike = await (prisma as any).imageLike.findUnique({
        where: {
          imageId_userId: {
            imageId: imageId,
            userId: session.user.id
          }
        }
      })

      if (existingLike) {
        // Unlike - remove the like
        await (prisma as any).$transaction([
          (prisma as any).imageLike.delete({ where: { id: existingLike.id } }),
          (prisma as any).image.update({ where: { id: imageId }, data: { likesCount: { decrement: 1 } } })
        ])
        
        return NextResponse.json({ 
          success: true, 
          liked: false,
          message: "Like removed"
        })
      } else {
        // Like - add the like
        await (prisma as any).$transaction([
          (prisma as any).imageLike.create({
            data: {
              imageId: imageId,
              userId: session.user.id,
              ipAddress: clientIP
            }
          }),
          (prisma as any).image.update({ where: { id: imageId }, data: { likesCount: { increment: 1 } } })
        ])
        
        return NextResponse.json({ 
          success: true, 
          liked: true,
          message: "Like added"
        })
      }
    } 
    // For anonymous users with session
    else if (sessionId) {
      // Check if session already liked this image
      const existingLike = await (prisma as any).imageLike.findUnique({
        where: {
          imageId_sessionId: {
            imageId: imageId,
            sessionId: sessionId
          }
        }
      })

      if (existingLike) {
        // Unlike
        await (prisma as any).$transaction([
          (prisma as any).imageLike.delete({ where: { id: existingLike.id } }),
          (prisma as any).image.update({ where: { id: imageId }, data: { likesCount: { decrement: 1 } } })
        ])
        
        return NextResponse.json({ 
          success: true, 
          liked: false,
          message: "Like removed"
        })
      } else {
        // Like
        await (prisma as any).$transaction([
          (prisma as any).imageLike.create({
            data: {
              imageId: imageId,
              sessionId: sessionId,
              ipAddress: clientIP
            }
          }),
          (prisma as any).image.update({ where: { id: imageId }, data: { likesCount: { increment: 1 } } })
        ])
        
        return NextResponse.json({ 
          success: true, 
          liked: true,
          message: "Like added"
        })
      }
    } else {
      // Anonymous fallback by IP address (no session created)
      if (!clientIP || clientIP === 'unknown') {
        return NextResponse.json({ 
          error: "Authentication, session, or a valid IP required" 
        }, { status: 401 })
      }

      const existingLike = await (prisma as any).imageLike.findFirst({
        where: {
          imageId: imageId,
          userId: null,
          sessionId: null,
          ipAddress: clientIP
        }
      })

      if (existingLike) {
        await (prisma as any).$transaction([
          (prisma as any).imageLike.delete({ where: { id: existingLike.id } }),
          (prisma as any).image.update({ where: { id: imageId }, data: { likesCount: { decrement: 1 } } })
        ])
        return NextResponse.json({ success: true, liked: false, message: "Like removed" })
      } else {
        await (prisma as any).$transaction([
          (prisma as any).imageLike.create({
            data: {
              imageId: imageId,
              ipAddress: clientIP,
              userId: null,
              sessionId: null
            }
          }),
          (prisma as any).image.update({ where: { id: imageId }, data: { likesCount: { increment: 1 } } })
        ])
        return NextResponse.json({ success: true, liked: true, message: "Like added" })
      }
    }
  } catch (error) {
    console.error("[Like API] Error:", error)
    return NextResponse.json({ 
      error: "Failed to process like" 
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const imageId = params.id
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("sessionId")

    // Get total like count, prefer persistent field if present
    const image = await (prisma as any).image.findUnique({
      where: { id: imageId },
      select: { likesCount: true }
    })
    const likesCount = typeof image?.likesCount === 'number'
      ? image.likesCount
      : await (prisma as any).imageLike.count({ where: { imageId } })

    // Check if current user/session has liked this image
    let userLiked = false
    
    if (session?.user?.id) {
      const userLike = await (prisma as any).imageLike.findUnique({
        where: {
          imageId_userId: {
            imageId: imageId,
            userId: session.user.id
          }
        }
      })
      userLiked = !!userLike
    } else if (sessionId) {
      const sessionLike = await (prisma as any).imageLike.findUnique({
        where: {
          imageId_sessionId: {
            imageId: imageId,
            sessionId: sessionId
          }
        }
      })
      userLiked = !!sessionLike
    } else {
      const clientIP = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      if (clientIP !== 'unknown') {
        const ipLike = await (prisma as any).imageLike.findFirst({
          where: {
            imageId: imageId,
            userId: null,
            sessionId: null,
            ipAddress: clientIP
          }
        })
        userLiked = !!ipLike
      }
    }

    return NextResponse.json({
      success: true,
      likesCount: likesCount,
      userLiked: userLiked
    })
  } catch (error) {
    console.error("[Like API GET] Error:", error)
    return NextResponse.json({ 
      error: "Failed to get like status" 
    }, { status: 500 })
  }
}
