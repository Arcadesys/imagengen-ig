import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/db"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const image = await prisma.image.findUnique({ where: { id }, include: { blob: true } })
  if (!image || !image.blob?.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(image.blob.data as any, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await prisma.image.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
