import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Do not throw at import time to avoid crashing route module initialization
// Export nullable clients and helper utils so callers can validate at runtime
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// For server-side operations that need service role access
export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey)
}

export function getSupabaseConfigStatus() {
  return {
    hasUrl: !!supabaseUrl,
    hasAnon: !!supabaseAnonKey,
    hasServiceRole: !!supabaseServiceRoleKey,
  }
}
