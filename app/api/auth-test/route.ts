import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: "No session found" 
      })
    }
    
    return NextResponse.json({ 
      authenticated: true, 
      user: session.user,
      message: "Authentication working" 
    })
  } catch (error) {
    console.error("[auth-test] Error:", error)
    return NextResponse.json({ 
      error: "Authentication test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
