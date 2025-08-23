#!/usr/bin/env node

/**
 * Seed a credentials user for testing NextAuth login
 *
 * Usage:
 *   node scripts/seed-user.mjs --email you@example.com --password yourpassword [--name "Your Name"]
 */

import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { email: null, password: null, name: null }
  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    const val = args[i + 1]
    if (key === '--email') out.email = val
    if (key === '--password') out.password = val
    if (key === '--name') out.name = val
  }
  return out
}

async function main() {
  const { email, password, name } = parseArgs()
  if (!email || !password) {
    console.error('Usage: node scripts/seed-user.mjs --email you@example.com --password yourpassword [--name "Your Name"]')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: name ?? undefined },
    create: { email, passwordHash, name: name ?? null },
  })

  console.log('✅ Seeded/updated user:')
  console.log(`   id: ${user.id}`)
  console.log(`   email: ${user.email}`)
  console.log('   password: (as provided)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
