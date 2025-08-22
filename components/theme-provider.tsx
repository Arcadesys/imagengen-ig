'use client'

import * as React from 'react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Keep the existing export for next-themes
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

export type GeneratorTheme = {
  gradientBg?: string
  headerBg?: string
  accent?: string // e.g., "from-yellow-600 to-red-600"
  buttonPrimary?: string
  buttonSecondary?: string
}

type KnownSlug = 'toon' | 'puppetray' | 'photobooth'

const defaultThemes: Record<KnownSlug, GeneratorTheme> = {
  toon: {
    gradientBg:
      'bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950 dark:via-orange-950 dark:to-red-950',
    headerBg: 'bg-white/80 dark:bg-black/70',
    accent: 'from-yellow-600 to-red-600',
    buttonPrimary: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    buttonSecondary: 'bg-orange-100 hover:bg-orange-200 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100',
  },
  puppetray: {
    gradientBg:
      'bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950 dark:via-pink-950 dark:to-orange-950',
    headerBg: 'bg-white/80 dark:bg-black/70',
    accent: 'from-purple-600 to-pink-600',
    buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
    buttonSecondary: 'bg-pink-100 hover:bg-pink-200 text-pink-900 dark:bg-pink-900/30 dark:text-pink-100',
  },
  photobooth: {
    gradientBg:
      'bg-gradient-to-b from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950',
    headerBg: 'bg-white/80 dark:bg-black/70',
    accent: 'from-blue-600 to-cyan-600',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-100',
  },
}

function mapPathToSlug(pathname: string | null): KnownSlug | null {
  if (!pathname) return null
  if (pathname.startsWith('/turn-toon')) return 'toon'
  if (pathname.startsWith('/puppetray')) return 'puppetray'
  if (pathname.startsWith('/photobooth')) return 'photobooth'
  return null
}

export type GeneratorThemeContextValue = {
  slug: KnownSlug | null
  theme: GeneratorTheme
}

const GeneratorThemeContext = React.createContext<GeneratorThemeContextValue>({
  slug: null,
  theme: {},
})

export function GeneratorThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const slug = useMemo(() => mapPathToSlug(pathname), [pathname])
  const [theme, setTheme] = useState<GeneratorTheme>({})

  const mergeTheme = useCallback(
    (slugLocal: KnownSlug | null, remote?: GeneratorTheme | null) => {
      if (!slugLocal) {
        setTheme(remote || {})
        return
      }
      const base = defaultThemes[slugLocal] || {}
      setTheme({ ...base, ...(remote || {}) })
    },
    []
  )

  useEffect(() => {
    let cancelled = false
    async function loadTheme() {
      if (!slug) {
        mergeTheme(null)
        return
      }
      try {
        const res = await fetch(`/api/generators/${slug}`)
        if (!res.ok) throw new Error('Failed to fetch generator theme')
        const data = await res.json()
        const remoteTheme = data?.generator?.theme || null
        if (!cancelled) mergeTheme(slug, remoteTheme)
      } catch {
        if (!cancelled) mergeTheme(slug, null)
      }
    }
    loadTheme()
    return () => {
      cancelled = true
    }
  }, [slug, mergeTheme])

  const value = useMemo(() => ({ slug, theme }), [slug, theme])

  return (
    <GeneratorThemeContext.Provider value={value}>{children}</GeneratorThemeContext.Provider>
  )
}

export function useGeneratorTheme() {
  return React.useContext(GeneratorThemeContext)
}
