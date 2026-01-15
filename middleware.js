// Temporary passthrough middleware (i18n disabled)
// When ready to enable i18n, uncomment the code below and remove this passthrough

export function middleware(request) {
    // Just pass through - no locale routing
    return;
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
