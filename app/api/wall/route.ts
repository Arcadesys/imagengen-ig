import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    console.log("[Wall API] Fetching before/after transformations")

    // Get all generated images that have base images (before/after pairs)
    const generatedImages = await prisma.image.findMany({
      where: {
        kind: "GENERATED",
        baseImageId: {
          not: null
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Limit to most recent 50 transformations
    })

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
        }
      })

    console.log("[Wall API] Found", transformations.length, "transformations")

    return NextResponse.json({
      success: true,
      transformations: transformations,
      totalCount: transformations.length,
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
