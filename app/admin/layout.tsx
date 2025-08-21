"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user is admin (for now, all logged-in users are admins)
    // In a real app, you'd check a role or permission
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {session.user?.name}
            </p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
