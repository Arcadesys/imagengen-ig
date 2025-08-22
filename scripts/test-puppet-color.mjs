#!/usr/bin/env node

/**
 * Test script to verify the puppet color feature is working
 */

import { PrismaClient } from '@prisma/client';
import { generatePuppetPrompt } from '../lib/puppet-prompts.ts';

const prisma = new PrismaClient();

async function testPuppetColor() {
  console.log('🎭 Testing Puppet Color Feature');
  console.log('==============================');
  
  try {
    // Test the buildPrompt function with color
    const testAnswers = {
      species: 'cat',
      skinColor: 'orange',
      style: 'felt',
      personality: 'playful'
    };
    
    console.log('🔧 Testing prompt generation with color:');
    console.log('  Species:', testAnswers.species);
    console.log('  Color:', testAnswers.skinColor);
    console.log('  Style:', testAnswers.style);
    console.log('  Personality:', testAnswers.personality);
    
    const prompt = generatePuppetPrompt(testAnswers);
    console.log('\n📝 Generated prompt:');
    console.log(prompt);
    
    // Check if color is included in the prompt
    const hasColor = prompt.toLowerCase().includes(testAnswers.skinColor.toLowerCase());
    console.log('\n✅ Color included in prompt:', hasColor ? 'YES' : 'NO');
    
    // Test with different color
    const testAnswers2 = {
      species: 'dog',
      skinColor: 'purple',
      style: 'muppet',
      personality: 'gentle'
    };
    
    console.log('\n🔧 Testing with different color:');
    console.log('  Species:', testAnswers2.species);
    console.log('  Color:', testAnswers2.skinColor);
    console.log('  Style:', testAnswers2.style);
    console.log('  Personality:', testAnswers2.personality);
    
    const prompt2 = generatePuppetPrompt(testAnswers2);
    console.log('\n📝 Generated prompt:');
    console.log(prompt2);
    
    const hasColor2 = prompt2.toLowerCase().includes(testAnswers2.skinColor.toLowerCase());
    console.log('\n✅ Color included in prompt:', hasColor2 ? 'YES' : 'NO');
    
    // Check generator config in database
    console.log('\n🗄️ Checking generator config in database...');
    const generator = await prisma.imageGenerator.findUnique({
      where: { slug: 'puppetray' }
    });
    
    if (generator) {
      console.log('✅ Generator found:', generator.name);
      console.log('📝 Config questions count:', generator.config.questions?.length || 0);
      
      const colorQuestion = generator.config.questions?.find(q => q.id === 'skinColor');
      if (colorQuestion) {
        console.log('🎨 Color question found:');
        console.log('  Text:', colorQuestion.text);
        console.log('  Type:', colorQuestion.type);
        console.log('  Options count:', colorQuestion.options?.length || 0);
        console.log('  First few options:', colorQuestion.options?.slice(0, 5));
      } else {
        console.log('❌ Color question not found in config');
      }
    } else {
      console.log('❌ Generator not found in database');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPuppetColor();
