#!/usr/bin/env node

/**
 * Test Supabase Integration
 * 
 * This script tests the basic functionality of image storage and retrieval.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import fs from 'fs'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local and .env if running locally
function loadEnvFile(filename) {
  const envPath = resolve(filename)
  if (!existsSync(envPath)) return {}
  const content = readFileSync(envPath, 'utf8')
  const vars = {}
  content.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=')
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        vars[key.trim()] = value.trim()
      }
    }
  })
  return vars
}

const envLocal = loadEnvFile('.env.local')
const envDefault = loadEnvFile('.env')
Object.assign(process.env, envDefault, envLocal)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL present:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY present:', !!serviceRoleKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase integration...')
  console.log('   URL:', supabaseUrl)
  
  try {
    // Test 1: Check if bucket exists
    console.log('📦 Checking if images bucket exists...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return false
    }
    
    const imagesBucket = buckets.find(bucket => bucket.name === 'images')
    if (!imagesBucket) {
      console.error('❌ Images bucket not found')
      return false
    }
    
    console.log('✅ Images bucket found')
    
    // Test 2: Create a test image and upload it
    console.log('📤 Testing image upload...')
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==', 'base64')
    const testFileName = `test/test-${Date.now()}.png`
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png',
        upsert: false,
      })
    
    if (uploadError) {
      console.error('❌ Error uploading test image:', uploadError)
      return false
    }
    
    console.log('✅ Test image uploaded successfully')
    
    // Test 3: Get public URL
    console.log('🔗 Testing public URL generation...')
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(testFileName)
    
    console.log('✅ Public URL generated:', publicUrl)
    
    // Test 4: Download the image
    console.log('📥 Testing image download...')
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('images')
      .download(testFileName)
    
    if (downloadError) {
      console.error('❌ Error downloading test image:', downloadError)
      return false
    }
    
    console.log('✅ Test image downloaded successfully')
    
    // Test 5: Clean up test file
    console.log('🧹 Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove([testFileName])
    
    if (deleteError) {
      console.warn('⚠️ Warning: Could not delete test file:', deleteError)
    } else {
      console.log('✅ Test file cleaned up')
    }
    
    console.log('')
    console.log('🎉 All tests passed! Supabase integration is working correctly.')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Set up storage policies in the Supabase dashboard (see previous output)')
    console.log('2. Test image upload through your app')
    console.log('3. Verify images appear in Supabase Storage dashboard')
    
    return true
  } catch (error) {
    console.error('❌ Error during testing:', error)
    return false
  }
}

testSupabaseIntegration().then(success => {
  if (!success) {
    process.exit(1)
  }
})
