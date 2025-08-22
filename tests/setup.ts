import { vi } from 'vitest'

// Set up test environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'

// Mock Supabase for tests
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/images/test-path' }
        })
      })
    }
  })
}))

// Environment-specific setup
if (typeof window !== 'undefined') {
  // Browser/DOM environment setup for React tests
  // This will run for .tsx files in happy-dom environment
  global.ResizeObserver = class ResizeObserver {
    constructor(cb: any) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
} else {
  // Node environment setup for API tests
  // This will run for .ts files in node environment
}
