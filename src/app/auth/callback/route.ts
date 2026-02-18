
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('Auth Code Exchange Error:', error)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }

        const session = data.session;
        let redirectUrl = `${origin}${next}`;

        // If we have a session, append tokens to the URL fragment so the client can sync
        if (session) {
            const fragment = `access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
            // If checking for forwarded host (Vercel)
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (!isLocalEnv && forwardedHost) {
                redirectUrl = `https://${forwardedHost}${next}#${fragment}`;
            } else {
                redirectUrl = `${origin}${next}#${fragment}`;
            }
            return NextResponse.redirect(redirectUrl);
        }

        // Fallback for no session (shouldn't happen if no error)
        const forwardedHost = request.headers.get('x-forwarded-host')
        /* ... existing logic for pure redirect without tokens if needed ... */

    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=No code provided`)
}
