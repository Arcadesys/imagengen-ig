import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { isAdminRequest } from "@/lib/admin"

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, password, name } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 })
    }

    const existing = await (prisma as any).user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(String(password), 10)

    const user = await (prisma as any).user.create({
      data: {
        email: String(email),
        name: name ? String(name) : null,
        passwordHash,
      },
    })

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error("[admin seed-user]", error)
    return NextResponse.json({ error: "Failed to seed user" }, { status: 500 })
  }
}
