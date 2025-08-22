import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { email, imageIds, toonConfig } = await request.json()

    if (!email || !imageIds || imageIds.length === 0) {
      return NextResponse.json(
        { error: "Email and image IDs are required" },
        { status: 400 }
      )
    }

    const SMTP_HOST = process.env.SMTP_HOST
    const SMTP_PORT = process.env.SMTP_PORT
    const SMTP_USER = process.env.SMTP_USER
    const SMTP_PASS = process.env.SMTP_PASS
    const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SMTP_FROM

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
      console.warn("[send-toon-email] Missing SMTP configuration env vars")
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 501 }
      )
    }

    // Fetch image metadata + blobs for attachments
    const images = await prisma.image.findMany({
      where: { id: { in: imageIds as string[] } },
      include: { blob: true },
    })

    if (!images.length) {
      return NextResponse.json(
        { error: "No images found for the provided IDs" },
        { status: 404 }
      )
    }

    // Cap attachments to avoid overly large emails (e.g., 5 max)
    const maxAttachments = 5
    const selected = images.slice(0, maxAttachments)

    const origin = new URL(request.url).origin

    const attachments = selected
      .filter((img) => img.blob?.data)
      .map((img) => ({
        filename: `toon-${img.id}${getExtFromMimeType(img.mimeType)}`,
        content: Buffer.from(img.blob!.data as unknown as ArrayBuffer),
        contentType: img.mimeType,
      }))

    const imageLinks = images.map((img) => `${origin}${img.url}`)

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    const subject = `Your Toon images${toonConfig?.style ? ` – ${formatStyle(toonConfig.style)}` : ""}`

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
        <h2>Here are your Toon images!</h2>
        ${toonConfig ? `<p><strong>Details:</strong> ${formatStyle(toonConfig.style)}${
          toonConfig.species ? `, ${toonConfig.species}` : ""
        }${toonConfig.gender ? `, ${toonConfig.gender}` : ""}${
          toonConfig.personality ? `, ${toonConfig.personality}` : ""
        }</p>` : ""}
        <p>We've attached your images to this email when possible. You can also view/download them here:</p>
        <ul>
          ${imageLinks.map((u) => `<li><a href="${u}">${u}</a></li>`).join("")}
        </ul>
        <p style="color:#64748b;font-size:12px;">If attachments are missing, use the links above to download the originals.</p>
      </div>
    `

    const text = `Here are your Toon images!\n\n${
      toonConfig
        ? `Details: ${formatStyle(toonConfig.style)}${
            toonConfig.species ? `, ${toonConfig.species}` : ""
          }${toonConfig.gender ? `, ${toonConfig.gender}` : ""}${
            toonConfig.personality ? `, ${toonConfig.personality}` : ""
          }\n\n`
        : ""
    }Links:\n${imageLinks.map((u) => `- ${u}`).join("\n")}\n\nIf attachments are missing, use the links above to download the originals.`

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject,
      text,
      html,
      attachments,
    })

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("[send-toon-email] Email sending error:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}

function getExtFromMimeType(mimeType: string): string {
  if (!mimeType) return ".png"
  if (mimeType.includes("png")) return ".png"
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return ".jpg"
  if (mimeType.includes("webp")) return ".webp"
  if (mimeType.includes("avif")) return ".avif"
  return ".png"
}

function formatStyle(style?: string) {
  if (!style) return "Toon"
  return String(style).replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}
