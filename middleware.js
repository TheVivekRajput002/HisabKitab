import { NextResponse } from 'next/server';

export async function middleware(req) {
  // Allow login and auth routes
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // For now, allow all routes (authentication will be handled client-side)
  // You can add server-side auth check later after configuring Supabase properly
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
