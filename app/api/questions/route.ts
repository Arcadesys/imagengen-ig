import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const p = path.join(process.cwd(), "data", "questions.json")
    const s = await readFile(p, "utf8")
    const json = JSON.parse(s)
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({ error: "Questions not available" }, { status: 500 })
  }
}
