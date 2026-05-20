import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — createClient is only called when the first method is invoked.
// This prevents build-time crashes when NEXT_PUBLIC_SUPABASE_URL is not yet set.
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string) {
    return (getClient() as unknown as Record<string, unknown>)[prop]
  },
})
