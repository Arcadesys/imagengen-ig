import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function maskSecret(secret?: string, showStart = 4, showEnd = 4) {
  if (!secret) return ""
  const s = String(secret)
  if (s.length <= showStart + showEnd) return "[redacted]"
  return `${s.slice(0, showStart)}…${s.slice(-showEnd)}`
}

function getProjectRef(url?: string | null) {
  try {
    if (!url) return null
    const u = new URL(url)
    // <ref>.supabase.co
    const host = u.hostname
    const ref = host.split(".")[0]
    return { host, ref }
  } catch {
    return null
  }
}

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

// Optional debug logging for visibility in production troubleshooting
if (process.env.APP_DEBUG === 'true') {
  try {
    const status = getSupabaseConfigStatus()
    console.log('[app] Supabase config status', status)
  } catch (e) {
    // no-op
  }
}

// Extra masked debug if explicitly enabled
if (process.env.APP_DEBUG_KEYS === 'true') {
  const meta = getProjectRef(supabaseUrl)
  console.log('[app] Supabase meta', {
    host: meta?.host,
    projectRef: meta?.ref,
    anonKey: maskSecret(supabaseAnonKey),
    serviceKey: maskSecret(supabaseServiceRoleKey)
  })
}
