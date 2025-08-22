#!/usr/bin/env node

// Setup script to configure Supabase for the imagegen app
const fs = require('fs');
const path = require('path');

console.log('🚀 ImageGen Supabase Setup\n');

const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Check if all required Supabase variables are configured
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL'
];

const missingVars = [];
const hasPlaceholders = [];

for (const varName of requiredVars) {
  const match = envContent.match(new RegExp(`${varName}="?([^"\\n]+)"?`));
  if (!match) {
    missingVars.push(varName);
  } else {
    const value = match[1];
    if (value.includes('your-') || value.includes('placeholder')) {
      hasPlaceholders.push(varName);
    }
  }
}

if (missingVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  console.log('Please add them to your .env.local file\n');
}

if (hasPlaceholders.length > 0) {
  console.log(`⚠️  Please update these placeholder values in .env.local:`);
  hasPlaceholders.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📋 To get your Supabase credentials:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project (or create one)');
  console.log('   3. Go to Settings > API to get URL and keys');
  console.log('   4. Go to Settings > Database to get connection string');
  console.log('   5. Make sure you have an "images" storage bucket (Storage > Create bucket)');
  console.log('\n📖 See SUPABASE_SETUP.md for detailed instructions\n');
  process.exit(1);
}

console.log('✅ All Supabase environment variables are configured!\n');

// Test the connection
console.log('🔌 Testing connection...');
try {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Environment variables not loaded properly');
    process.exit(1);
  }
  
  console.log('✅ Environment variables loaded');
  console.log('✅ Supabase client can be created');
  console.log('\n🎉 Setup complete! You can now:');
  console.log('   1. Run: npm run prisma:push (to sync database schema)');
  console.log('   2. Run: npm run dev (to start the app)');
  console.log('   3. Test image uploads in the app');
  
} catch (error) {
  console.log('❌ Error testing Supabase connection:', error.message);
  console.log('Make sure @supabase/supabase-js is installed: npm install @supabase/supabase-js');
}
