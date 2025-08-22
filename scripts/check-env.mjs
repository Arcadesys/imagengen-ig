#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Run this to check if your .env.local is properly configured
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local and .env files
function loadEnvFile(filename) {
  const envPath = resolve(filename)
  if (!existsSync(envPath)) {
    return {}
  }
  
  const content = readFileSync(envPath, 'utf8')
  const vars = {}
  
  content.split('\n').forEach(line => {
    line = line.trim()
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim()
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        vars[key.trim()] = value
      }
    }
  })
  
  return vars
}

// Load environment variables in order of priority
const envLocal = loadEnvFile('.env.local')
const envDefault = loadEnvFile('.env')
const allEnvVars = { ...envDefault, ...envLocal, ...process.env }

console.log('🔧 Environment Variables Validation')
console.log('=' .repeat(40))

if (Object.keys(envLocal).length > 0) {
  console.log('📁 Found .env.local with variables')
} else {
  console.log('⚠️  No .env.local file found - using system environment')
}

const requiredVars = [
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'AUTH_URL'
]

const optionalVars = [
  'DIRECT_URL',
  'ADMIN_SECRET',
  'UPLOAD_MAX_SIZE_BYTES'
]

let missingRequired = []
let missingOptional = []
let validCount = 0

console.log('\n✅ Required Variables:')
requiredVars.forEach(varName => {
  if (allEnvVars[varName]) {
    console.log(`   ✓ ${varName}`)
    validCount++
  } else {
    console.log(`   ❌ ${varName} - MISSING`)
    missingRequired.push(varName)
  }
})

console.log('\n📋 Optional Variables:')
optionalVars.forEach(varName => {
  if (allEnvVars[varName]) {
    console.log(`   ✓ ${varName}`)
  } else {
    console.log(`   ⚪ ${varName} - not set (optional)`)
    missingOptional.push(varName)
  }
})

console.log('\n🔍 Configuration Check:')

// Check AUTH_SECRET strength
if (allEnvVars.AUTH_SECRET) {
  if (allEnvVars.AUTH_SECRET.length < 32) {
    console.log('   ⚠️  AUTH_SECRET should be at least 32 characters')
  } else {
    console.log('   ✓ AUTH_SECRET has adequate length')
  }
}

// Check URL formats
if (allEnvVars.NEXT_PUBLIC_SUPABASE_URL) {
  if (allEnvVars.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    console.log('   ✓ NEXT_PUBLIC_SUPABASE_URL format looks correct')
  } else {
    console.log('   ⚠️  NEXT_PUBLIC_SUPABASE_URL should start with https://')
  }
}

// Check OpenAI key format
if (allEnvVars.OPENAI_API_KEY) {
  if (allEnvVars.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('   ✓ OPENAI_API_KEY format looks correct')
  } else {
    console.log('   ⚠️  OPENAI_API_KEY should start with sk-')
  }
}

console.log('\n📊 Summary:')
console.log('=' .repeat(20))
console.log(`✅ Valid: ${validCount}/${requiredVars.length} required variables`)

if (missingRequired.length === 0) {
  console.log('🎉 All required environment variables are set!')
  console.log('\n🚀 You can now run:')
  console.log('   npm run dev          # Start development server')
  console.log('   npm run build        # Build for production')
  console.log('   npm run test:upload  # Test file upload')
} else {
  console.log(`❌ Missing ${missingRequired.length} required variables:`)
  missingRequired.forEach(varName => {
    console.log(`   • ${varName}`)
  })
  console.log('\n🔧 To fix this:')
  console.log('1. Copy .env.example to .env.local')
  console.log('2. Fill in the missing values')
  console.log('3. Run this script again')
  console.log('\nSee ENV_SETUP.md for detailed instructions.')
}

process.exit(missingRequired.length === 0 ? 0 : 1)
