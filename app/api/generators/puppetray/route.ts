import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Check if this is a puppetray-specific request
    const generator = await (prisma as any).imageGenerator.findUnique({ 
      where: { slug: "puppetray" } 
    })
    
    if (!generator) {
      return NextResponse.json(
        { error: "Puppetray generator not found" }, 
        { status: 404 }
      )
    }
    
    const config = (generator as any).config || null
    const schema = config?.schema || (
      config?.questions && config?.promptTemplate 
        ? { 
            title: generator.name, 
            intro: generator.description, 
            questions: config.questions, 
            promptTemplate: config.promptTemplate, 
            references: config.references 
          } 
        : null
    )
    
    return NextResponse.json({ generator, schema })
  } catch (error) {
    console.error("[puppetray GET]", error)
    return NextResponse.json(
      { error: "Failed to fetch puppetray generator" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      )
    }
    
    // Handle puppetray-specific generation logic here
    const body = await request.json()
    
    // For now, return a success response
    return NextResponse.json({ 
      success: true, 
      message: "Puppetray generation initiated",
      userId: session.user.id 
    })
    
  } catch (error) {
    console.error("[puppetray POST]", error)
    return NextResponse.json(
      { error: "Failed to process puppetray request" }, 
      { status: 500 }
    )
  }
}
