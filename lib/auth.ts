import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { authConfig } from "@/auth.config"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email ? String(credentials.email) : ""
          const password = credentials?.password ? String(credentials.password) : ""
          
          if (!email || !password) {
            console.log("[auth] Missing credentials")
            return null
          }
          
          const user = await (prisma as any).user.findUnique({ where: { email } })
          
          if (!user?.passwordHash) {
            console.log("[auth] User not found or no password hash")
            return null
          }
          
          const ok = await bcrypt.compare(password, user.passwordHash)
          
          if (!ok) {
            console.log("[auth] Invalid password")
            return null
          }
          
          console.log("[auth] User authenticated successfully")
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            image: user.image 
          }
        } catch (error) {
          console.error("[auth] Authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development",
})
