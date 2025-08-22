import { vi } from 'vitest'

// Set up test environment variables with valid format
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgU2VydmljZSIsImlhdCI6MTUxNjIzOTAyMn0.test'

// Mock the lib/supabase module for tests
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ 
          data: { path: 'test-images/test-image.png' }, 
          error: null 
        }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/images/test-images/test-image.png' }
        })
      })
    }
  },
  supabaseAdmin: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ 
          data: { path: 'test-images/test-image.png' }, 
          error: null 
        }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/images/test-images/test-image.png' }
        })
      })
    }
  }
}))

// Also mock the underlying package as backup
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ 
          data: { path: 'test-images/test-image.png' }, 
          error: null 
        }),
        getPublicUrl: vi.fn().mockReturnValue({ 
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/images/test-images/test-image.png' }
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
