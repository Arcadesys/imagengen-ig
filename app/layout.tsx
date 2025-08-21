import type React from "react"
import type { Metadata } from "next"
// Removed Geist font imports for accessibility
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { SkipNav } from "@/components/accessibility/skip-nav"

export const metadata: Metadata = {
  title: "AI Image Generator",
  description:
    "Generate stunning images with AI using text prompts and base images. Accessible and user-friendly interface.",
  generator: "v0.app",
  keywords: ["AI", "image generation", "artificial intelligence", "creative tools", "accessibility"],
  authors: [{ name: "AI Image Generator" }],
}

export const viewport = "width=device-width, initial-scale=1"

export const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "white" },
  { media: "(prefers-color-scheme: dark)", color: "black" },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-sans: system-ui, sans-serif;
  --font-mono: monospace;
}
        `}</style>
      </head>
// ...existing code...
      <body>
        <SkipNav />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
