"use client"

import { SessionProvider } from "next-auth/react"
import { GeneratorThemeProvider } from "./theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GeneratorThemeProvider>
        {children}
      </GeneratorThemeProvider>
    </SessionProvider>
  )
}
