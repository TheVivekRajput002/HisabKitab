import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isCallbackPage = req.nextUrl.pathname.startsWith('/auth/callback')

  // Allow callback and login page through without redirect
  if (isCallbackPage || isLoginPage) return res

  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

/*
// Enable this when ready to implement i18n locale routing:

import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
});
 
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
*/
