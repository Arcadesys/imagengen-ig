#!/usr/bin/env node

/**
 * Seed Puppetray Generator
 * Creates the puppetray generator in the database with proper configuration
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPuppetrayGenerator() {
  console.log('🎭 Seeding Puppetray Generator')
  console.log('=' .repeat(30))

  try {
    await prisma.$connect()
    console.log('✅ Database connected')

    // Create the puppetray generator with enhanced configuration
    const puppetrayGenerator = await prisma.imageGenerator.upsert({
      where: { slug: 'puppetray' },
      create: {
        slug: 'puppetray',
        name: 'Puppet Transform',
        description: 'Transform the subject into a puppet while preserving the real scene and outfit details.',
        style: 'puppet-transform',
        isActive: true,
        config: {
          schema: {
            title: 'Puppet Transform',
            intro: 'Transform yourself or others into a puppet character! Choose your puppet style, species, personality, and colors.',
            questions: [
              {
                id: 'species',
                text: 'What species should the puppet be?',
                placeholder: 'e.g., human, cat, dog, dragon, robot',
                type: 'text'
              },
              {
                id: 'puppetStyle',
                text: 'What puppet style do you want?',
                type: 'select',
                options: [
                  { value: 'muppet', label: 'Muppet Style (classic foam and felt)' },
                  { value: 'felt', label: 'Felt Puppet (wool felt with stitching)' },
                  { value: 'sock', label: 'Sock Puppet (knitted with button eyes)' },
                  { value: 'plush', label: 'Plush Toy (soft fleece fabric)' },
                  { value: 'fursuit', label: 'Fursuit (anthropomorphic costume)' },
                  { value: 'marionette', label: 'Marionette (wooden with strings)' },
                  { value: 'ventriloquist', label: 'Ventriloquist Dummy (wooden with moving jaw)' },
                  { value: 'hand-puppet', label: 'Hand Puppet (fabric glove design)' },
                  { value: 'mascot', label: 'Mascot Costume (oversized foam head)' },
                  { value: 'anime-mascot', label: 'Anime Mascot (kawaii style)' }
                ],
                defaultValue: 'muppet'
              },
              {
                id: 'skinColor',
                text: 'What color should the puppet\'s skin/fur/felt be?',
                type: 'select',
                options: [
                  { value: '', label: 'Default (original skin tone)' },
                  { value: 'light', label: 'Light' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'tan', label: 'Tan' },
                  { value: 'pale', label: 'Pale' },
                  { value: 'peachy', label: 'Peachy' },
                  { value: 'white', label: 'White' },
                  { value: 'black', label: 'Black' },
                  { value: 'gray', label: 'Gray' },
                  { value: 'brown', label: 'Brown' },
                  { value: 'red', label: 'Red' },
                  { value: 'blue', label: 'Blue' },
                  { value: 'green', label: 'Green' },
                  { value: 'yellow', label: 'Yellow' },
                  { value: 'orange', label: 'Orange' },
                  { value: 'purple', label: 'Purple' },
                  { value: 'pink', label: 'Pink' },
                  { value: 'pastel pink', label: 'Pastel Pink' },
                  { value: 'pastel blue', label: 'Pastel Blue' },
                  { value: 'lavender', label: 'Lavender' },
                  { value: 'mint', label: 'Mint Green' },
                  { value: 'cream', label: 'Cream' },
                  { value: 'golden', label: 'Golden' },
                  { value: 'silver', label: 'Silver' },
                  { value: 'rainbow', label: 'Rainbow' }
                ]
              },
              {
                id: 'personality',
                text: 'What personality should the puppet have?',
                type: 'select',
                options: [
                  { value: 'cute', label: 'Cute & Sweet' },
                  { value: 'goofy', label: 'Goofy & Silly' },
                  { value: 'funny', label: 'Funny & Comedic' },
                  { value: 'mischievous', label: 'Mischievous & Playful' },
                  { value: 'wise', label: 'Wise & Thoughtful' },
                  { value: 'cheerful', label: 'Cheerful & Happy' },
                  { value: 'dramatic', label: 'Dramatic & Theatrical' },
                  { value: 'shy', label: 'Shy & Bashful' },
                  { value: 'confident', label: 'Confident & Bold' },
                  { value: 'quirky', label: 'Quirky & Eccentric' },
                  { value: 'grumpy', label: 'Grumpy & Serious' }
                ],
                defaultValue: 'cute'
              }
            ],
            promptTemplate: `Transform the subject into a {{puppetStyle}} puppet. Species: {{species}}. {{#if skinColor}}Skin/fur color: {{skinColor}}.{{/if}} Personality: {{personality}}. CRITICAL: Preserve all clothing and outfit details exactly. Convert clothing materials to puppet-appropriate fabrics while maintaining all design elements (colors, patterns, logos, accessories). Replace skin with fabric textures, eyes with buttons/felt, hair with yarn. Maintain caricature proportions with exaggerated features. Keep exact pose, camera angle, and background unchanged. Show realistic puppet construction with seams and stitching. Family-friendly content only.`
          }
        }
      },
      update: {
        name: 'Puppet Transform',
        description: 'Transform the subject into a puppet while preserving the real scene and outfit details.',
        style: 'puppet-transform',
        isActive: true,
        config: {
          schema: {
            title: 'Puppet Transform',
            intro: 'Transform yourself or others into a puppet character! Choose your puppet style, species, personality, and colors.',
            questions: [
              {
                id: 'species',
                text: 'What species should the puppet be?',
                placeholder: 'e.g., human, cat, dog, dragon, robot',
                type: 'text'
              },
              {
                id: 'puppetStyle',
                text: 'What puppet style do you want?',
                type: 'select',
                options: [
                  { value: 'muppet', label: 'Muppet Style (classic foam and felt)' },
                  { value: 'felt', label: 'Felt Puppet (wool felt with stitching)' },
                  { value: 'sock', label: 'Sock Puppet (knitted with button eyes)' },
                  { value: 'plush', label: 'Plush Toy (soft fleece fabric)' },
                  { value: 'fursuit', label: 'Fursuit (anthropomorphic costume)' },
                  { value: 'marionette', label: 'Marionette (wooden with strings)' },
                  { value: 'ventriloquist', label: 'Ventriloquist Dummy (wooden with moving jaw)' },
                  { value: 'hand-puppet', label: 'Hand Puppet (fabric glove design)' },
                  { value: 'mascot', label: 'Mascot Costume (oversized foam head)' },
                  { value: 'anime-mascot', label: 'Anime Mascot (kawaii style)' }
                ],
                defaultValue: 'muppet'
              },
              {
                id: 'skinColor',
                text: 'What color should the puppet\'s skin/fur/felt be?',
                type: 'select',
                options: [
                  { value: '', label: 'Default (original skin tone)' },
                  { value: 'light', label: 'Light' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'tan', label: 'Tan' },
                  { value: 'pale', label: 'Pale' },
                  { value: 'peachy', label: 'Peachy' },
                  { value: 'white', label: 'White' },
                  { value: 'black', label: 'Black' },
                  { value: 'gray', label: 'Gray' },
                  { value: 'brown', label: 'Brown' },
                  { value: 'red', label: 'Red' },
                  { value: 'blue', label: 'Blue' },
                  { value: 'green', label: 'Green' },
                  { value: 'yellow', label: 'Yellow' },
                  { value: 'orange', label: 'Orange' },
                  { value: 'purple', label: 'Purple' },
                  { value: 'pink', label: 'Pink' },
                  { value: 'pastel pink', label: 'Pastel Pink' },
                  { value: 'pastel blue', label: 'Pastel Blue' },
                  { value: 'lavender', label: 'Lavender' },
                  { value: 'mint', label: 'Mint Green' },
                  { value: 'cream', label: 'Cream' },
                  { value: 'golden', label: 'Golden' },
                  { value: 'silver', label: 'Silver' },
                  { value: 'rainbow', label: 'Rainbow' }
                ]
              },
              {
                id: 'personality',
                text: 'What personality should the puppet have?',
                type: 'select',
                options: [
                  { value: 'cute', label: 'Cute & Sweet' },
                  { value: 'goofy', label: 'Goofy & Silly' },
                  { value: 'funny', label: 'Funny & Comedic' },
                  { value: 'mischievous', label: 'Mischievous & Playful' },
                  { value: 'wise', label: 'Wise & Thoughtful' },
                  { value: 'cheerful', label: 'Cheerful & Happy' },
                  { value: 'dramatic', label: 'Dramatic & Theatrical' },
                  { value: 'shy', label: 'Shy & Bashful' },
                  { value: 'confident', label: 'Confident & Bold' },
                  { value: 'quirky', label: 'Quirky & Eccentric' },
                  { value: 'grumpy', label: 'Grumpy & Serious' }
                ],
                defaultValue: 'cute'
              }
            ],
            promptTemplate: `Transform the subject into a {{puppetStyle}} puppet. Species: {{species}}. {{#if skinColor}}Skin/fur color: {{skinColor}}.{{/if}} Personality: {{personality}}. CRITICAL: Preserve all clothing and outfit details exactly. Convert clothing materials to puppet-appropriate fabrics while maintaining all design elements (colors, patterns, logos, accessories). Replace skin with fabric textures, eyes with buttons/felt, hair with yarn. Maintain caricature proportions with exaggerated features. Keep exact pose, camera angle, and background unchanged. Show realistic puppet construction with seams and stitching. Family-friendly content only.`
          }
        }
      }
    })

    console.log('✅ Puppetray generator created/updated successfully!')
    console.log(`   ID: ${puppetrayGenerator.id}`)
    console.log(`   Slug: ${puppetrayGenerator.slug}`)
    console.log(`   Name: ${puppetrayGenerator.name}`)
    console.log(`   Active: ${puppetrayGenerator.isActive}`)
    console.log(`   Questions: ${JSON.parse(JSON.stringify(puppetrayGenerator.config)).schema.questions.length}`)

    // Verify the generator was created
    const verification = await prisma.imageGenerator.findUnique({
      where: { slug: 'puppetray' }
    })

    if (verification) {
      console.log('✅ Verification: Generator exists in database')
    } else {
      console.log('❌ Verification: Generator not found after creation')
    }

    console.log('\n🎉 Puppetray generator is ready!')
    console.log('New features added:')
    console.log('• Enhanced safety filtering for DALL-E 3 compliance')
    console.log('• Skin/fur/felt color selection (26 color options)')
    console.log('• Multiple puppet style options (10 styles)')
    console.log('• Personality customization (11 personalities)')
    console.log('• Species customization (unlimited text input)')

  } catch (error) {
    console.error('❌ Error seeding puppetray generator:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedPuppetrayGenerator().catch(error => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
