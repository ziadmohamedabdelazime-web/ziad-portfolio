import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// The app runs fine without Supabase configured yet: public pages fall back
// to the seed data in src/data/seed.ts. Once VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are set (see .env.example), all sections switch to
// live DB data automatically (see src/hooks/useContent.ts). The Admin Panel
// requires Supabase to be configured — it has no offline mode.
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
