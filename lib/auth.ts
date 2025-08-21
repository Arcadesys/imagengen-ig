import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const providers = []

// Only add Google provider if credentials are properly configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' &&
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Add development credentials provider
if (process.env.NODE_ENV === 'development') {
  providers.push(
    Credentials({
      name: "Development Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" }
      },
      async authorize(credentials) {
        // For development only - accept any email
        if (credentials?.email && typeof credentials.email === 'string') {
          return {
            id: "dev-user",
            email: credentials.email,
            name: credentials.email.split('@')[0],
          }
        }
        return null
      }
    })
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
