import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // 🔐 Cria cliente Supabase usando cookies da requisição
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({
            name,
            value,
            ...options
          })
        },
        remove(name, options) {
          res.cookies.set({
            name,
            value: '',
            ...options
          })
        }
      }
    }
  )

  // 🔎 Verifica usuário autenticado
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname

  // 🔒 PROTEÇÃO DO DASHBOARD
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return res
}

// 🎯 Define quais rotas passam pelo middleware
export const config = {
  matcher: ['/dashboard/:path*']
}
