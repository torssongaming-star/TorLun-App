import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a dummy client or handle it gracefully during build
    // This prevents the build from crashing if env vars are missing
    return {} as any
  }

  return createBrowserClient(url, key)
}
