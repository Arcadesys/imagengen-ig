#!/usr/bin/env node

/**
 * Update All Generators with Skin Color Support
 * Adds skin color selector to every generator to counteract white-first biases
 */

import { PrismaClient } from '@prisma/client'
import { SKIN_COLOR_OPTIONS } from '../lib/shared-skin-color.js'

const prisma = new PrismaClient()

async function updateGeneratorsWithSkinColor() {
  console.log('🎨 Adding Skin Color Support to All Generators')
  console.log('=' .repeat(50))

  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    // Get all active generators
    const generators = await prisma.imageGenerator.findMany({
      where: { isActive: true }
    })

    console.log(`📋 Found ${generators.length} active generator(s)`)

    let updatedCount = 0

    for (const generator of generators) {
      console.log(`\n🔧 Processing: ${generator.name} (${generator.slug})`)
      
      let config = generator.config as any
      if (!config || !config.schema) {
        console.log(`   ⚠️  No schema found, skipping...`)
        continue
      }

      let questions = config.schema.questions || []
      
      // Check if skin color question already exists
      const existingSkinColorQuestion = questions.find((q: any) => q.id === 'skinColor')
      
      if (existingSkinColorQuestion) {
        console.log(`   ✅ Skin color question already exists`)
        continue
      }

      // Add skin color question - customize text based on generator type
      let skinColorText = 'What skin color should the character have?'
      
      if (generator.slug === 'puppetray') {
        skinColorText = 'What color should the puppet\'s skin/fur/felt be?'
      } else if (generator.slug === 'turn-toon') {
        skinColorText = 'What skin color should the animated character have?'
      } else if (generator.slug === 'dinosona') {
        skinColorText = 'What color should the dinosaur\'s skin/scales be?'
      }

      const skinColorQuestion = {
        id: 'skinColor',
        text: skinColorText,
        type: 'select',
        options: SKIN_COLOR_OPTIONS
      }

      // Add the skin color question after the first question (style/species)
      // but before personality if it exists
      let insertIndex = 1
      if (questions.length === 0) {
        insertIndex = 0
      } else if (questions.length === 1) {
        insertIndex = 1
      } else {
        // Find a good position - after style/species but before personality
        const personalityIndex = questions.findIndex((q: any) => 
          q.id === 'personality' || q.text.toLowerCase().includes('personality')
        )
        if (personalityIndex > 0) {
          insertIndex = personalityIndex
        } else {
          insertIndex = questions.length - 1
        }
      }

      questions.splice(insertIndex, 0, skinColorQuestion)

      // Update the config
      const updatedConfig = {
        ...config,
        schema: {
          ...config.schema,
          questions: questions
        }
      }

      // Update the generator in database
      await prisma.imageGenerator.update({
        where: { id: generator.id },
        data: { config: updatedConfig }
      })

      console.log(`   ✅ Added skin color question at position ${insertIndex}`)
      updatedCount++
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Updated: ${updatedCount} generator(s)`)
    console.log(`⏭️  Skipped: ${generators.length - updatedCount} generator(s) (already had skin color)`)
    
    if (updatedCount > 0) {
      console.log('\n🎉 All generators now support skin color selection!')
      console.log('This helps counteract white-first biases by giving users diverse skin tone options.')
    }

    // Verify the updates
    console.log('\n🔍 Verification:')
    for (const generator of generators) {
      const updated = await prisma.imageGenerator.findUnique({
        where: { id: generator.id }
      })
      
      if (updated?.config) {
        const config = updated.config as any
        const questions = config.schema?.questions || []
        const hasSkinColor = questions.some((q: any) => q.id === 'skinColor')
        console.log(`   ${hasSkinColor ? '✅' : '❌'} ${generator.name}: ${hasSkinColor ? 'Has' : 'Missing'} skin color`)
      }
    }

  } catch (error) {
    console.error('❌ Error updating generators:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateGeneratorsWithSkinColor().catch(error => {
  console.error('Update failed:', error)
  process.exit(1)
})