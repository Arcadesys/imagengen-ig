import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[Wall API] Fetching before/after transformations")

    const url = new URL(request.url)
    const sessionId = url.searchParams.get("session")
    const search = url.searchParams.get("search")?.toLowerCase()
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    let whereClause: any = {
      kind: "GENERATED",
      baseImageId: {
        not: null
      }
    }

    // Filter by session if provided
    if (sessionId) {
      whereClause.sessionId = sessionId
    }

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        {
          prompt: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          session: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Get all generated images that have base images (before/after pairs)
    const generatedImages = await (prisma as any).image.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            id: true,
            name: true,
            generator: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.image.count({ where: whereClause })

    // Get all the base image IDs we need to fetch
    const baseImageIds = generatedImages
      .map(img => img.baseImageId)
      .filter(Boolean) as string[]

    // Fetch the corresponding base images
    const baseImages = await prisma.image.findMany({
      where: {
        id: { in: baseImageIds },
        kind: "UPLOAD_BASE"
      }
    })

    // Create a map for quick lookup
    const baseImageMap = new Map(baseImages.map(img => [img.id, img]))

    // Format transformations for the wall
    const transformations = generatedImages
      .filter(generated => generated.baseImageId && baseImageMap.has(generated.baseImageId))
      .map(generated => {
        const baseImage = baseImageMap.get(generated.baseImageId!)!
        
        // Extract style from prompt or use provider as fallback
        const style = generated.prompt 
          ? extractStyleFromPrompt(generated.prompt) 
          : generated.provider || "unknown"

        return {
          id: generated.id,
          beforeImageUrl: baseImage.url,
          afterImageUrl: generated.url,
          style: style,
          prompt: generated.prompt,
          timestamp: generated.createdAt.toISOString(),
          likesCount: generated._count?.likes || 0,
          session: generated.session ? {
            id: generated.session.id,
            name: generated.session.name,
            generator: generated.session.generator,
            createdAt: generated.session.createdAt.toISOString()
          } : null
        }
      })

    console.log("[Wall API] Found", transformations.length, "transformations")

    return NextResponse.json({
      success: true,
      transformations: transformations,
      totalCount: totalCount,
      currentCount: transformations.length,
      hasMore: offset + transformations.length < totalCount,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Wall API] Error fetching transformations:", error)
    return NextResponse.json({ error: "Failed to load wall transformations" }, { status: 500 })
  }
}

// Helper function to extract style from prompt
function extractStyleFromPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase()
  
  // Common style keywords to look for, prioritizing more specific ones first
  const styleMap: { [key: string]: string } = {
    'puppet': 'puppet',
    'muppet': 'muppet',
    'sock puppet': 'sock puppet',
    'felt puppet': 'felt puppet',
    'mascot puppet': 'mascot',
    'cartoon': 'cartoon',
    'anime': 'anime', 
    'pixar': 'pixar',
    'comic': 'comic',
    'watercolor': 'watercolor',
    'vintage': 'vintage',
    'oil painting': 'oil painting',
    'sketch': 'sketch',
    'portrait': 'portrait',
    'fantasy': 'fantasy',
    'cyberpunk': 'cyberpunk',
    'steampunk': 'steampunk'
  }
  
  // Check for puppet-specific patterns first
  if (lowerPrompt.includes('puppet')) {
    if (lowerPrompt.includes('sock puppet')) return 'sock puppet'
    if (lowerPrompt.includes('felt puppet')) return 'felt puppet'
    if (lowerPrompt.includes('muppet')) return 'muppet'
    if (lowerPrompt.includes('mascot')) return 'mascot'
    return 'puppet'
  }
  
  // Then check other styles
  for (const [keyword, style] of Object.entries(styleMap)) {
    if (lowerPrompt.includes(keyword)) {
      return style
    }
  }
  
  return 'artistic' // default fallback
}

// Helper function to get file extension from mime type
function getExtFromMimeType(mimeType: string): string {
  if (!mimeType) return '.png'
  if (mimeType.includes('png')) return '.png'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg'
  if (mimeType.includes('webp')) return '.webp'
  if (mimeType.includes('avif')) return '.avif'
  return '.png'
}
