#!/usr/bin/env node

/**
 * Database Check Script
 * Verifies critical database records exist
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Database Records Check')
  console.log('=' .repeat(30))

  try {
    // Check if we can connect to database
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check for puppetray generator
    const puppetrayGenerator = await prisma.imageGenerator.findUnique({
      where: { slug: 'puppetray' }
    })

    if (puppetrayGenerator) {
      console.log('✅ Puppetray generator found in database')
      console.log(`   Name: ${puppetrayGenerator.name}`)
      console.log(`   Active: ${puppetrayGenerator.isActive}`)
    } else {
      console.log('❌ Puppetray generator NOT found in database')
      console.log('   This will cause 404 errors on /api/generators/puppetray')
    }

    // Check total generators
    const totalGenerators = await prisma.imageGenerator.count()
    console.log(`📊 Total generators in database: ${totalGenerators}`)

    if (totalGenerators === 0) {
      console.log('⚠️  No generators found - you may need to seed the database')
    }

    // Check for recent images (to verify image storage is working)
    const recentImages = await prisma.image.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, createdAt: true }
    })

    console.log(`📸 Recent images in database: ${recentImages.length}`)
    if (recentImages.length > 0) {
      console.log('   Latest image URLs:')
      recentImages.forEach((img, i) => {
        const url = img.url.length > 60 ? img.url.substring(0, 60) + '...' : img.url
        console.log(`   ${i + 1}. ${url}`)
      })
    }

    // Check for users (to verify auth is working)
    const userCount = await prisma.user.count()
    console.log(`👥 Users in database: ${userCount}`)

    console.log('\n📋 Summary:')
    if (!puppetrayGenerator) {
      console.log('❌ CRITICAL: Puppetray generator missing - this causes 404 errors')
      console.log('   Solution: Add puppetray generator to database or check slug')
    }

    if (totalGenerators === 0) {
      console.log('⚠️  WARNING: No generators found - seed database if needed')
    }

    if (recentImages.length === 0) {
      console.log('ℹ️  INFO: No images in database - normal for fresh install')
    }

    console.log('\n🚀 Next Actions:')
    if (!puppetrayGenerator) {
      console.log('1. Check if generator slug should be different')
      console.log('2. Add puppetray generator to database')
      console.log('3. Or update API route to handle missing generator gracefully')
    }
    console.log('4. Deploy updated code with temp directory fixes')
    console.log('5. Set production environment variables')
    console.log('6. Test APIs in production')

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('\n🔧 Possible causes:')
    console.log('• DATABASE_URL environment variable not set')
    console.log('• Supabase database not accessible')
    console.log('• Network connectivity issues')
    console.log('• Database credentials incorrect')
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
