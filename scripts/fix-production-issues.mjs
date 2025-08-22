#!/usr/bin/env node

/**
 * Fix Production Issues Script
 * 
 * This script identifies and provides solutions for common production issues
 * including auth configuration, environment variables, and API errors.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'

const ISSUES_DETECTED = []
const SOLUTIONS = []

function logIssue(title, description, solution) {
  ISSUES_DETECTED.push({ title, description, solution })
  console.log(`❌ ${title}`)
  console.log(`   ${description}`)
  console.log(`   💡 Solution: ${solution}`)
  console.log('')
}

function logSuccess(message) {
  console.log(`✅ ${message}`)
}

function logWarning(message) {
  console.log(`⚠️  ${message}`)
}

async function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables for Production...\n')
  
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
    'DATABASE_URL': 'PostgreSQL database connection string',
    'OPENAI_API_KEY': 'OpenAI API key for image generation',
    'AUTH_SECRET': 'NextAuth secret for session encryption'
  }

  const productionVars = {
    'NEXT_PUBLIC_APP_URL': 'Your production domain URL',
    'AUTH_URL': 'Authentication callback URL (should match NEXT_PUBLIC_APP_URL)'
  }

  let hasErrors = false

  // Check required variables
  for (const [varName, description] of Object.entries(requiredVars)) {
    if (!process.env[varName]) {
      logIssue(
        `Missing ${varName}`,
        `${description} is not configured`,
        `Set ${varName} in your production environment variables`
      )
      hasErrors = true
    } else {
      logSuccess(`${varName} is configured`)
    }
  }

  // Check production-specific variables
  for (const [varName, description] of Object.entries(productionVars)) {
    if (!process.env[varName]) {
      logWarning(`${varName} not set - this may cause auth issues in production`)
      SOLUTIONS.push(`Set ${varName} to your production domain (e.g., https://yourapp.vercel.app)`)
    } else if (process.env[varName]?.includes('localhost')) {
      logIssue(
        `${varName} points to localhost`,
        `${description} is set to localhost, which won't work in production`,
        `Update ${varName} to your production domain`
      )
      hasErrors = true
    } else {
      logSuccess(`${varName} is configured for production`)
    }
  }

  // Check AUTH_SECRET strength
  if (process.env.AUTH_SECRET) {
    const secret = process.env.AUTH_SECRET
    if (secret.length < 32) {
      logIssue(
        'AUTH_SECRET too short',
        'AUTH_SECRET should be at least 32 characters for security',
        'Generate a new 32+ character secret using: openssl rand -base64 32'
      )
      hasErrors = true
    } else {
      logSuccess('AUTH_SECRET has adequate length')
    }
  }

  return !hasErrors
}

async function checkSupabaseConnection() {
  console.log('📡 Testing Supabase Connection...\n')
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logIssue(
      'Cannot test Supabase connection',
      'Missing Supabase environment variables',
      'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
    return false
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    
    // Test connection
    const { data, error } = await supabase.from('User').select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      logIssue(
        'Supabase connection failed',
        `Database query failed: ${error.message}`,
        'Check your Supabase URL and keys, ensure database is accessible'
      )
      return false
    }
    
    logSuccess('Supabase connection successful')
    return true
  } catch (error) {
    logIssue(
      'Supabase connection error',
      `Connection attempt failed: ${error.message}`,
      'Verify Supabase credentials and network connectivity'
    )
    return false
  }
}

async function checkDatabaseConnection() {
  console.log('🗄️  Testing Database Connection...\n')
  
  if (!process.env.DATABASE_URL) {
    logIssue(
      'No DATABASE_URL configured',
      'Prisma cannot connect to the database',
      'Set DATABASE_URL to your PostgreSQL connection string'
    )
    return false
  }

  try {
    // Import Prisma dynamically to avoid module loading issues
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    // Test database connection
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    
    logSuccess('Database connection successful')
    return true
  } catch (error) {
    logIssue(
      'Database connection failed',
      `Prisma connection error: ${error.message}`,
      'Check DATABASE_URL format and database accessibility'
    )
    return false
  }
}

function generateProductionEnvTemplate() {
  console.log('📋 Generating Production Environment Template...\n')
  
  const template = `# Production Environment Variables Template
# Copy these to your production environment (Vercel, Railway, etc.)

# ================================
# REQUIRED VARIABLES
# ================================

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Authentication Configuration
AUTH_SECRET=${randomBytes(32).toString('base64')}
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
AUTH_URL=https://your-production-domain.com

# ================================
# OPTIONAL VARIABLES
# ================================

# File Upload Configuration
UPLOAD_MAX_SIZE_BYTES=10485760

# Admin Configuration
ADMIN_SECRET=your_admin_secret_here
`

  fs.writeFileSync('.env.production.template', template)
  logSuccess('Created .env.production.template with production-ready configuration')
  SOLUTIONS.push('Use the generated .env.production.template to configure your production environment')
}

function analyzeCommonProductionErrors() {
  console.log('🔍 Analyzing Common Production Issues...\n')
  
  const commonIssues = [
    {
      pattern: 'AuthError',
      title: 'NextAuth Configuration Error',
      causes: [
        'AUTH_SECRET not set or too short',
        'AUTH_URL/NEXT_PUBLIC_APP_URL mismatch',
        'Callback URLs not configured correctly'
      ],
      solutions: [
        'Set AUTH_SECRET to a 32+ character random string',
        'Ensure AUTH_URL matches your production domain',
        'Configure callback URLs in your OAuth providers'
      ]
    },
    {
      pattern: '500 Internal Server Error',
      title: 'Server Configuration Error',
      causes: [
        'Database connection failure',
        'Missing environment variables',
        'Prisma schema out of sync'
      ],
      solutions: [
        'Verify DATABASE_URL is correct and accessible',
        'Check all required environment variables are set',
        'Run database migrations: npx prisma db push'
      ]
    },
    {
      pattern: '401 Unauthorized',
      title: 'Authentication Failure',
      causes: [
        'Session configuration issues',
        'Invalid JWT secret',
        'Database authentication tables missing'
      ],
      solutions: [
        'Verify NextAuth configuration',
        'Check AUTH_SECRET is properly set',
        'Ensure user authentication tables exist'
      ]
    }
  ]

  commonIssues.forEach(issue => {
    console.log(`🔧 ${issue.title}`)
    console.log('   Common causes:')
    issue.causes.forEach(cause => console.log(`   • ${cause}`))
    console.log('   Solutions:')
    issue.solutions.forEach(solution => console.log(`   ✓ ${solution}`))
    console.log('')
  })
}

async function main() {
  console.log('🚀 Production Issues Diagnostic & Fix Script')
  console.log('=' .repeat(50))
  console.log('')

  const envOk = await checkEnvironmentVariables()
  const supabaseOk = await checkSupabaseConnection()
  const dbOk = await checkDatabaseConnection()
  
  generateProductionEnvTemplate()
  
  console.log('')
  analyzeCommonProductionErrors()
  
  console.log('📊 Summary:')
  console.log('=' .repeat(30))
  
  if (ISSUES_DETECTED.length === 0) {
    console.log('✅ No critical issues detected!')
  } else {
    console.log(`❌ Found ${ISSUES_DETECTED.length} issue(s) that need attention:`)
    ISSUES_DETECTED.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.title}: ${issue.solution}`)
    })
  }
  
  console.log('')
  console.log('🔧 Next Steps:')
  console.log('1. Fix any environment variable issues')
  console.log('2. Redeploy your application')
  console.log('3. Test the functionality in production')
  console.log('4. Monitor logs for any remaining errors')
  
  if (ISSUES_DETECTED.length > 0) {
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
