import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

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
        await (prisma as any).imageLike.delete({
          where: { id: existingLike.id }
        })
        
        return NextResponse.json({ 
          success: true, 
          liked: false,
          message: "Like removed"
        })
      } else {
        // Like - add the like
        await (prisma as any).imageLike.create({
          data: {
            imageId: imageId,
            userId: session.user.id,
            ipAddress: clientIP
          }
        })
        
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
        await (prisma as any).imageLike.delete({
          where: { id: existingLike.id }
        })
        
        return NextResponse.json({ 
          success: true, 
          liked: false,
          message: "Like removed"
        })
      } else {
        // Like
        await (prisma as any).imageLike.create({
          data: {
            imageId: imageId,
            sessionId: sessionId,
            ipAddress: clientIP
          }
        })
        
        return NextResponse.json({ 
          success: true, 
          liked: true,
          message: "Like added"
        })
      }
    } else {
      return NextResponse.json({ 
        error: "Authentication or session required" 
      }, { status: 401 })
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

    // Get total like count
    const likesCount = await (prisma as any).imageLike.count({
      where: { imageId: imageId }
    })

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
