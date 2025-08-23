import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/db"
import { deleteImage } from "../../../../lib/images"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const image = await prisma.image.findUnique({ 
    where: { id },
    select: { id: true, url: true, mimeType: true }
  })
  
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Since we're using Supabase Storage, redirect to the public URL
  return NextResponse.redirect(image.url, 302)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  
  try {
    await deleteImage(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
