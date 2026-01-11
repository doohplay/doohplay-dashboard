import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function requireRole(allowed: string[]) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!data || !allowed.includes(data.role)) {
    throw new Error('Forbidden')
  }

  return data.role
}
