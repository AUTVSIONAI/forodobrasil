import { cookies, headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export function getServerSupabase() {
  const h = headers()
  const authHeader = h.get('Authorization')
  const token = cookies().get('sb-access-token')?.value
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    authHeader ? { global: { headers: { Authorization: authHeader } } } : (token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined)
  )
}

export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
