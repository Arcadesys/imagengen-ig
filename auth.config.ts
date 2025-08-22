import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnProtectedPage = nextUrl.pathname.startsWith('/admin') || 
        nextUrl.pathname.startsWith('/generate') ||
        nextUrl.pathname.startsWith('/gallery') ||
        nextUrl.pathname.startsWith('/sessions')
      
      if (isOnProtectedPage && !isLoggedIn) {
        return false
      }
      
      return true
    },
  },
} satisfies NextAuthConfig