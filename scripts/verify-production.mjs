#!/usr/bin/env node

/**
 * Production Verification Script
 * Run this after setting up production environment variables to verify everything works
 */

import fetch from 'node-fetch'

// Configuration - update these with your production URLs
const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'
const API_BASE = `${PRODUCTION_URL}/api`

// Test endpoints
const ENDPOINTS = [
  { path: '/gallery', method: 'GET', description: 'Gallery API' },
  { path: '/auth/session', method: 'GET', description: 'Auth Session API' },
  // Sessions requires auth, so we'll just check if it returns 401 instead of 500
  { path: '/sessions', method: 'GET', description: 'Sessions API (should return 401, not 500)' }
]

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint.description}...`)
    
    const response = await fetch(`${API_BASE}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const statusCode = response.status
    const isSuccess = statusCode < 400 || (endpoint.path === '/sessions' && statusCode === 401)
    
    if (isSuccess) {
      console.log(`✅ ${endpoint.description}: ${statusCode} ${response.statusText}`)
      return true
    } else {
      console.log(`❌ ${endpoint.description}: ${statusCode} ${response.statusText}`)
      
      // Try to get error details
      try {
        const errorText = await response.text()
        console.log(`   Error details: ${errorText.substring(0, 200)}`)
      } catch (e) {
        console.log(`   Could not read error details`)
      }
      return false
    }
  } catch (error) {
    console.log(`❌ ${endpoint.description}: Network error - ${error.message}`)
    return false
  }
}

async function checkEnvironmentSetup() {
  console.log('🔧 Checking Environment Setup...\n')
  
  const requiredVars = [
    'NEXT_PUBLIC_APP_URL'
  ]
  
  let allSet = true
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.log(`❌ ${varName} not set`)
      allSet = false
    } else {
      console.log(`✅ ${varName}: ${process.env[varName]}`)
    }
  }
  
  if (!allSet) {
    console.log('\n⚠️  Set missing environment variables and try again\n')
    return false
  }
  
  return true
}

async function main() {
  console.log('🚀 Production Verification Script')
  console.log('=' .repeat(50))
  console.log(`Testing production deployment at: ${PRODUCTION_URL}\n`)
  
  // Check local environment
  const envOk = await checkEnvironmentSetup()
  if (!envOk) {
    process.exit(1)
  }
  
  console.log('\n📡 Testing API Endpoints...\n')
  
  let successCount = 0
  let totalCount = 0
  
  for (const endpoint of ENDPOINTS) {
    const success = await testEndpoint(endpoint)
    if (success) successCount++
    totalCount++
    console.log('') // Add spacing
  }
  
  console.log('📊 Results Summary:')
  console.log('=' .repeat(30))
  console.log(`✅ Successful: ${successCount}/${totalCount}`)
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`)
  
  if (successCount === totalCount) {
    console.log('\n🎉 All tests passed! Your production deployment looks good.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above and:')
    console.log('1. Verify all environment variables are set in production')
    console.log('2. Check deployment logs for detailed error messages')
    console.log('3. Ensure your database is accessible')
    console.log('4. Verify Supabase configuration')
  }
  
  console.log(`\n🔍 For more details, check: ${PRODUCTION_URL}`)
  console.log('Monitor the browser console and network tab for additional errors.')
  
  process.exit(successCount === totalCount ? 0 : 1)
}

main().catch(error => {
  console.error('Verification script failed:', error)
  process.exit(1)
})
