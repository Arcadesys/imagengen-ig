"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block">AI Image Generator</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            {session && (
              <>
                <Link 
                  href="/generate" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Generate
                </Link>
                <Link 
                  href="/gallery" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Gallery
                </Link>
                <Link 
                  href="/admin" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Admin
                </Link>
              </>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-300" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {session.user?.name || session.user?.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => signIn()}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
