import { createClient } from '@supabase/supabase-js'

// Frontend uses ONLY the publishable/anon key (safe to ship).
// The service-role key must never appear in this codebase.
// RLS: verified ON for every table with owner-only policies on user data
// and public-read policies on the catalog — re-verify before launch.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('SkinWise: missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(url, anonKey)
