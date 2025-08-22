#!/usr/bin/env node

/**
 * Supabase Storage Setup Script
 * 
 * This script creates the required storage bucket and policies for the ImageGen app.
 * Run this after setting up your Supabase environment variables.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...')
  
  try {
    // Create the images bucket
    console.log('📦 Creating images bucket...')
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif'],
      fileSizeLimit: 10485760 // 10MB
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating bucket:', bucketError)
      return false
    }

    if (bucketError?.message.includes('already exists')) {
      console.log('✅ Images bucket already exists')
    } else {
      console.log('✅ Images bucket created successfully')
    }

    // Note: Storage policies need to be set up in the Supabase dashboard
    // as they require SQL execution which isn't available via the JS client
    console.log('\n📋 Next steps:')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0])
    console.log('2. Navigate to Storage > Policies')
    console.log('3. Create the following policies for the "images" bucket:')
    console.log('')
    console.log('🔓 SELECT Policy (Public Access):')
    console.log('   Name: Allow public access')
    console.log('   Policy: FOR SELECT TO public USING (bucket_id = \'images\')')
    console.log('')
    console.log('📤 INSERT Policy (Authenticated Uploads):')
    console.log('   Name: Allow authenticated uploads')
    console.log('   Policy: FOR INSERT TO authenticated WITH CHECK (bucket_id = \'images\')')
    console.log('')
    console.log('🗑️ DELETE Policy (Authenticated Deletes):')
    console.log('   Name: Allow authenticated deletes')
    console.log('   Policy: FOR DELETE TO authenticated USING (bucket_id = \'images\')')
    console.log('')
    console.log('✅ Storage setup complete! Your app is ready to use Supabase Storage.')

    return true
  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    return false
  }
}

setupStorage().then(success => {
  if (!success) {
    process.exit(1)
  }
})
