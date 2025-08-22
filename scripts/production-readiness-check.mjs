#!/usr/bin/env node

/**
 * Production Readiness Check for ImageGen File Uploads
 * 
 * This script verifies that file uploads are properly configured for production deployment.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import fs from 'fs'

// Environment variable checks
const ENV_VARS = {
  required: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'OPENAI_API_KEY'
  ],
  production: [
    'AUTH_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ]
}

async function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...')
  
  const missing = []
  const warnings = []
  
  for (const varName of ENV_VARS.required) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  for (const varName of ENV_VARS.production) {
    if (!process.env[varName]) {
      warnings.push(varName)
    }
  }
  
  if (missing.length > 0) {
    console.log(`❌ Missing required variables: ${missing.join(', ')}`)
    return false
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  Missing recommended variables: ${warnings.join(', ')}`)
  }
  
  console.log('✅ Environment variables check passed')
  return true
}

async function checkSupabaseConnection() {
  console.log('\n📡 Testing Supabase Connection...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test bucket existence
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Failed to connect to Supabase Storage')
      return false
    }
    
    const imagesBucket = buckets.find(b => b.name === 'images')
    if (!imagesBucket) {
      console.log('❌ "images" bucket not found')
      return false
    }
    
    // Test upload/download with a minimal PNG
    const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==', 'base64')
    const testPath = `production-test/test-${Date.now()}.png`
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(testPath, testBuffer, {
        contentType: 'image/png',
        upsert: false
      })
    
    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message)
      return false
    }
    
    // Test public URL generation
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(testPath)
    
    if (!publicUrl) {
      console.log('❌ Public URL generation failed')
      return false
    }
    
    // Cleanup
    await supabase.storage.from('images').remove([testPath])
    
    console.log('✅ Supabase connection test passed')
    return true
    
  } catch (error) {
    console.log('❌ Supabase test failed:', error.message)
    return false
  }
}

async function checkDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection...')
  
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Test basic query
    const count = await prisma.image.count()
    console.log(`✅ Database connected. Found ${count} images.`)
    
    await prisma.$disconnect()
    return true
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message)
    return false
  }
}

async function checkFileUploadLimits() {
  console.log('\n📏 Checking File Upload Configuration...')
  
  const maxSize = Number(process.env.UPLOAD_MAX_SIZE_BYTES) || 10 * 1024 * 1024 // 10MB default
  const maxSizeMB = Math.floor(maxSize / (1024 * 1024))
  
  console.log(`📊 Max upload size: ${maxSizeMB}MB`)
  
  // Check if Sharp is available (for image processing)
  try {
    await import('sharp')
    console.log('✅ Sharp image processing library available')
  } catch (error) {
    console.log('⚠️  Sharp not available - image compression disabled')
  }
  
  return true
}

async function checkStoragePolicies() {
  console.log('\n🔒 Storage Policies Reminder...')
  
  console.log('⚠️  Ensure the following policies are configured in Supabase Dashboard:')
  console.log('   1. SELECT Policy: Allow public access to images bucket')
  console.log('   2. INSERT Policy: Allow authenticated uploads to images bucket')
  console.log('   3. DELETE Policy: Allow authenticated deletes from images bucket')
  console.log('   📋 Go to: https://supabase.com/dashboard/project/{PROJECT_ID}/storage/policies')
  
  return true
}

async function checkProductionUrls() {
  console.log('\n🌐 Checking Production URLs...')
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (appUrl && appUrl.includes('localhost')) {
    console.log('⚠️  NEXT_PUBLIC_APP_URL is set to localhost - update for production')
  } else if (appUrl) {
    console.log(`✅ App URL configured: ${appUrl}`)
  }
  
  if (supabaseUrl) {
    console.log(`✅ Supabase URL configured: ${supabaseUrl}`)
  }
  
  return true
}

async function runProductionReadinessCheck() {
  console.log('🚀 ImageGen Production Readiness Check')
  console.log('=====================================\n')
  
  const results = []
  
  results.push(await checkEnvironmentVariables())
  results.push(await checkSupabaseConnection())
  results.push(await checkDatabaseConnection())
  results.push(await checkFileUploadLimits())
  results.push(await checkStoragePolicies())
  results.push(await checkProductionUrls())
  
  const allPassed = results.every(result => result)
  
  console.log('\n📊 Summary')
  console.log('============')
  
  if (allPassed) {
    console.log('🎉 All checks passed! Your app is ready for production.')
    console.log('\n📋 Final deployment checklist:')
    console.log('   1. Set up Supabase storage policies (see above)')
    console.log('   2. Update NEXT_PUBLIC_APP_URL to your production domain')
    console.log('   3. Configure environment variables in your hosting platform')
    console.log('   4. Test image upload after deployment')
  } else {
    console.log('❌ Some checks failed. Please fix the issues above before deploying.')
    process.exit(1)
  }
}

// Handle missing environment variables gracefully
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ Missing Supabase environment variables')
  console.log('Make sure your .env.local file is properly configured')
  process.exit(1)
}

runProductionReadinessCheck().catch(console.error)
