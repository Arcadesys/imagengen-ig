import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import { createHash } from "crypto"
import type { NextAuthConfig } from "next-auth"

function hashPassword(pw: string) {
  // Simple sha256 for demo; replace with bcrypt in production
  return createHash("sha256").update(pw).digest("hex")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await (prisma as any).user.findUnique({ where: { email: credentials.email } })
        if (!user?.passwordHash) return null
        const ok = hashPassword(credentials.password) === user.passwordHash
        if (!ok) return null
        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) session.user.id = user.id
      return session
    },
  },
} satisfies NextAuthConfig)
