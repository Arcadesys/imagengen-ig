#!/usr/bin/env node

// Debug script to test upload functionality
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function debugUpload() {
  console.log('🔍 Debugging upload issues...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL'
  ];

  let missingEnvs = [];
  for (const env of requiredEnvs) {
    const value = process.env[env];
    if (!value) {
      missingEnvs.push(env);
      console.log(`❌ ${env}: MISSING`);
    } else {
      console.log(`✅ ${env}: ${value.substring(0, 20)}...`);
    }
  }

  if (missingEnvs.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingEnvs.join(', ')}`);
    console.log('Please check your .env.local or .env file');
    return;
  }

  // Test Supabase connection
  console.log('\n🔌 Testing Supabase Connection:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic connection
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Failed to connect to Supabase Storage:', bucketsError.message);
      return;
    }

    console.log('✅ Successfully connected to Supabase');
    console.log('📦 Available buckets:', buckets.map(b => b.name).join(', '));

    // Check if images bucket exists
    const imagesBucket = buckets.find(b => b.name === 'images');
    if (!imagesBucket) {
      console.log('❌ "images" bucket not found. Please create it in your Supabase dashboard.');
      console.log('   Go to Storage > Create bucket > Name: "images" > Public: Yes');
      return;
    }

    console.log('✅ "images" bucket found');

    // Test file upload
    console.log('\n📤 Testing file upload:');
    const testBuffer = Buffer.from('test image data', 'utf8');
    const testPath = `test/debug-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(testPath, testBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.log('❌ Upload failed:', uploadError.message);
      console.log('This might be due to missing storage policies.');
      console.log('Check the SUPABASE_SETUP.md file for policy examples.');
      return;
    }

    console.log('✅ Test upload successful');

    // Clean up test file
    await supabase.storage.from('images').remove([testPath]);
    console.log('✅ Test file cleaned up');

  } catch (error) {
    console.log('❌ Supabase test failed:', error.message);
  }

  // Test database connection
  console.log('\n🗄️  Testing Database Connection:');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic query
    const imageCount = await prisma.image.count();
    console.log(`✅ Database connected. Found ${imageCount} images.`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    console.log('Make sure your DATABASE_URL is correct and the database is accessible.');
  }

  console.log('\n🎉 Diagnostic complete!');
}

debugUpload().catch(console.error);
