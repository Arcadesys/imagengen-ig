import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createErrorResponse, validateAuth, safeDatabaseOperation } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    // Check if this is a puppetray-specific request
    const generator = await safeDatabaseOperation(async () => {
      return await (prisma as any).imageGenerator.findUnique({ 
        where: { slug: "puppetray" } 
      })
    }, 'puppetray-get')
    
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
  } catch (error: any) {
    const { response, statusCode } = createErrorResponse(error, 'puppetray-get')
    return NextResponse.json(response, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await validateAuth(auth, 'puppetray-post')

    const body = await request.json()
    
    // Handle puppetray-specific generation logic here
    return NextResponse.json({ 
      success: true, 
      message: "Puppetray generation initiated",
      userId: session.user.id 
    })
    
  } catch (error: any) {
    const { response, statusCode } = createErrorResponse(error, 'puppetray-post')
    return NextResponse.json(response, { status: statusCode })
  }
}
