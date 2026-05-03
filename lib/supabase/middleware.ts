import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Pages only unauthenticated users should see
  const isGuestOnlyPage =
    url.pathname === '/login' ||
    url.pathname === '/register' ||
    url.pathname === '/register/confirm' ||
    url.pathname.startsWith('/auth/')

  // Pages that require auth but are not part of the main app (e.g. setup flow)
  const isSetupPage = url.pathname === '/register/setup'

  const isAuthPage = isGuestOnlyPage || isSetupPage

  // Unauthenticated users can only access auth pages
  if (!user && !isAuthPage) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Unauthenticated users trying to access setup page → send to login
  if (!user && isSetupPage) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated users shouldn't see guest-only pages
  if (user && isGuestOnlyPage) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
