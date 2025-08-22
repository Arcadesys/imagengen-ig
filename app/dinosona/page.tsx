'use client'

// Next.js dynamic config – ensure this page is always dynamic (no caching)
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DinosonaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight mb-3">Dinosona Photobooth</h1>
      <p className="text-muted-foreground mb-6">We’ve moved dinosona into the new multi-step photobooth.</p>
      <Link href="/photobooth?generator=dinosona">
        <Button>Open Photobooth</Button>
      </Link>
    </main>
  )
}
