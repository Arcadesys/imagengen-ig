#!/usr/bin/env node

/**
 * Check the current puppetray generator config in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConfig() {
  console.log('🔍 Checking Puppetray Generator Config');
  console.log('====================================');
  
  try {
    const generator = await prisma.imageGenerator.findUnique({
      where: { slug: 'puppetray' }
    });
    
    if (generator) {
      console.log('✅ Generator found:', generator.name);
      console.log('📋 Config:');
      console.log(JSON.stringify(generator.config, null, 2));
    } else {
      console.log('❌ Generator not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig();
