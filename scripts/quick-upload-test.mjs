#!/usr/bin/env node

/**
 * Quick Production Upload Test
 * 
 * Tests the upload API endpoint in production to ensure it's working correctly.
 * This can be run as a health check or monitoring script.
 */

async function testProductionUpload() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  console.log(`🧪 Testing upload at: ${baseUrl}`)
  
  try {
    // Create a minimal test image (1x1 PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // Create form data
    const formData = new FormData()
    const blob = new Blob([testImageBuffer], { type: 'image/png' })
    formData.append('file', blob, 'test.png')
    
    // Test upload
    const response = await fetch(`${baseUrl}/api/images/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.baseImageId || !result.url) {
      throw new Error('Invalid response format')
    }
    
    console.log('✅ Upload test successful!')
    console.log(`📁 Image ID: ${result.baseImageId}`)
    console.log(`🔗 URL: ${result.url}`)
    
    // Test if the image is accessible
    const imageResponse = await fetch(result.url)
    if (!imageResponse.ok) {
      throw new Error(`Image not accessible: ${imageResponse.status}`)
    }
    
    console.log('✅ Image is publicly accessible!')
    return true
    
  } catch (error) {
    console.log('❌ Upload test failed:', error.message)
    return false
  }
}

async function testGalleryEndpoint() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/gallery`)
    
    if (!response.ok) {
      throw new Error(`Gallery failed: ${response.status}`)
    }
    
    const gallery = await response.json()
    
    if (!Array.isArray(gallery)) {
      throw new Error('Gallery response is not an array')
    }
    
    console.log(`✅ Gallery endpoint working! Found ${gallery.length} images`)
    return true
    
  } catch (error) {
    console.log('❌ Gallery test failed:', error.message)
    return false
  }
}

async function runQuickTest() {
  console.log('🚀 Quick Production Upload Test')
  console.log('===============================\n')
  
  const uploadTest = await testProductionUpload()
  console.log('')
  const galleryTest = await testGalleryEndpoint()
  
  console.log('\n📊 Results')
  console.log('============')
  
  if (uploadTest && galleryTest) {
    console.log('🎉 All tests passed! Upload system is working correctly.')
    process.exit(0)
  } else {
    console.log('❌ Some tests failed. Check the logs above.')
    process.exit(1)
  }
}

// Handle browser environments
if (typeof window === 'undefined') {
  runQuickTest().catch(console.error)
}

export { testProductionUpload, testGalleryEndpoint }
