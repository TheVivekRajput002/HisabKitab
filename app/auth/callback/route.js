import { NextResponse } from 'next/server';

export async function GET(request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        // The session will be handled by the AuthContext on the client side
        // Just redirect to home
        return NextResponse.redirect(new URL('/', requestUrl.origin));
    }

    // Redirect to home page
    return NextResponse.redirect(new URL('/', requestUrl.origin));
}
