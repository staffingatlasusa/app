import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes — JWT cookie check (lightweight, no jose in edge)
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) return NextResponse.next()
    const token = request.cookies.get('admin_session')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', request.url))
    // Validate JWT structure — full verify happens in server components via jose (Node runtime)
    const parts = token.split('.')
    if (parts.length !== 3) return NextResponse.redirect(new URL('/admin/login', request.url))
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Platform routes — Supabase session auth
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isAuth = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isPublic = pathname === '/' || isAuth || pathname.startsWith('/api/auth')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
