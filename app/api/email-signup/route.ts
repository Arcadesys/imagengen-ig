import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, preferences } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingSignup = await prisma.emailSignup.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingSignup) {
      // Update preferences if email already exists
      const updatedSignup = await prisma.emailSignup.update({
        where: { email: email.toLowerCase() },
        data: {
          preferences: preferences || {},
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: "Email preferences updated",
        signup: {
          id: updatedSignup.id,
          email: updatedSignup.email,
          preferences: updatedSignup.preferences
        }
      })
    }

    // Create new email signup
    const emailSignup = await prisma.emailSignup.create({
      data: {
        email: email.toLowerCase(),
        preferences: preferences || {
          productUpdates: true,
          newFeatures: true,
          tips: false,
          promotions: false
        },
        source: 'generation_modal', // Track where the signup came from
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    console.log("[Email Signup] New signup:", emailSignup.email)

    return NextResponse.json({
      success: true,
      message: "Successfully signed up for updates",
      signup: {
        id: emailSignup.id,
        email: emailSignup.email,
        preferences: emailSignup.preferences
      }
    })

  } catch (error) {
    console.error("[Email Signup] Error:", error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to process email signup" },
      { status: 500 }
    )
  }
}

// GET endpoint to check if an email is already signed up
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    const signup = await prisma.emailSignup.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        preferences: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      exists: !!signup,
      signup: signup || null
    })

  } catch (error) {
    console.error("[Email Signup Check] Error:", error)
    return NextResponse.json(
      { error: "Failed to check email signup status" },
      { status: 500 }
    )
  }
}
