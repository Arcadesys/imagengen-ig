#!/usr/bin/env node

/**
 * Seed Database with Required Generators
 * Adds missing generators like puppetray to the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GENERATORS = [
  {
    slug: 'puppetray',
    name: 'PuppetRay',
    description: 'Create animated puppet-style characters',
    style: 'puppet-style',
    isActive: true,
    config: {
      questions: [
        {
          id: 'character',
          text: 'What type of character do you want to create?',
          type: 'text',
          placeholder: 'e.g., friendly dog, wise owl, brave knight'
        },
        {
          id: 'style',
          text: 'What style should the puppet have?',
          type: 'select',
          options: ['Classic Muppet', 'Hand Puppet', 'Marionette', 'Sock Puppet']
        }
      ],
      promptTemplate: 'Create a {style} style puppet character of a {character}',
      references: []
    }
  },
  {
    slug: 'dinosona',
    name: 'DinoSona',
    description: 'Create dinosaur persona characters',
    style: 'dinosaur-persona',
    isActive: true,
    config: {
      questions: [
        {
          id: 'dinosaur',
          text: 'What type of dinosaur?',
          type: 'text',
          placeholder: 'e.g., T-Rex, Triceratops, Velociraptor'
        },
        {
          id: 'personality',
          text: 'What personality traits?',
          type: 'text',
          placeholder: 'e.g., friendly, fierce, playful'
        }
      ],
      promptTemplate: 'Create a {personality} {dinosaur} character as a persona',
      references: []
    }
  },
  {
    slug: 'turn-toon',
    name: 'Turn Toon',
    description: 'Transform photos into cartoon style',
    style: 'cartoon-transformation',
    isActive: true,
    config: {
      questions: [
        {
          id: 'style',
          text: 'What cartoon style?',
          type: 'select',
          options: ['Disney Style', 'Anime Style', 'Comic Book', 'Pixar Style']
        }
      ],
      promptTemplate: 'Transform into {style} cartoon character',
      references: []
    }
  }
]

async function seedGenerators() {
  console.log('🌱 Seeding Database with Generators')
  console.log('=' .repeat(40))

  try {
    await prisma.$connect()
    console.log('✅ Connected to database')

    let seededCount = 0
    let skippedCount = 0

    for (const generator of GENERATORS) {
      // Check if generator already exists
      const existing = await prisma.imageGenerator.findUnique({
        where: { slug: generator.slug }
      })

      if (existing) {
        console.log(`⏭️  Generator '${generator.name}' already exists - skipping`)
        skippedCount++
        continue
      }

      // Create the generator
      const created = await prisma.imageGenerator.create({
        data: generator
      })

      console.log(`✅ Created generator: ${created.name} (${created.slug})`)
      seededCount++
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Created: ${seededCount} generators`)
    console.log(`⏭️  Skipped: ${skippedCount} generators (already exist)`)

    if (seededCount > 0) {
      console.log('\n🎉 Database seeding complete!')
      console.log('The following API endpoints should now work:')
      GENERATORS.forEach(gen => {
        console.log(`   • /api/generators/${gen.slug}`)
      })
    }

    // Verify the puppetray generator specifically
    const puppetray = await prisma.imageGenerator.findUnique({
      where: { slug: 'puppetray' }
    })

    if (puppetray) {
      console.log('\n✅ Puppetray generator verified in database')
      console.log('   404 errors on /api/generators/puppetray should be fixed')
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    console.log('\n🔧 Possible causes:')
    console.log('• Database connection issues')
    console.log('• Missing ImageGenerator table')
    console.log('• Prisma schema out of sync')
    console.log('\n💡 Solutions:')
    console.log('• Run: npx prisma db push')
    console.log('• Check DATABASE_URL is correct')
    console.log('• Verify Supabase connection')
  } finally {
    await prisma.$disconnect()
  }
}

seedGenerators().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
