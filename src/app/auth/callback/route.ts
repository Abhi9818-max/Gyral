import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { isValidPath } from '@/lib/validation'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    
    // 🛡️ Validate redirect target path to prevent open redirect vulnerabilities
    let next = searchParams.get('next') ?? '/dashboard'
    if (!isValidPath(next)) {
        next = '/dashboard'
    }

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const forwardedHost = request.headers.get('x-forwarded-host')
        /* ... existing logic for pure redirect without tokens if needed ... */

    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=No code provided`)
}
