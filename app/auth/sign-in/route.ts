import { getSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const formData = await req.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))

  const supabase = getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=1', req.url)
    )
  }

  return NextResponse.redirect(new URL('/dashboard', req.url))
}
