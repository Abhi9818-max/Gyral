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

        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('Auth Code Exchange Error:', error.message, error.status)
                return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
            }

            const session = data.session;

            if (session) {
                // Append tokens to the URL fragment so the client-side AuthSync can
                // pick them up and call setSession() in the browser context.
                const fragment = `access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
                const forwardedHost = request.headers.get('x-forwarded-host')
                const isLocalEnv = process.env.NODE_ENV === 'development'

                let redirectUrl: string;
                if (!isLocalEnv && forwardedHost) {
                    redirectUrl = `https://${forwardedHost}${next}#${fragment}`;
                } else {
                    redirectUrl = `${origin}${next}#${fragment}`;
                }
                return NextResponse.redirect(redirectUrl);
            }

            // Code exchange succeeded but no session returned (shouldn't happen)
            console.error('Auth Callback: Code exchanged but no session returned.')
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('Authentication succeeded but no session was created. Please try again.')}`)

        } catch (e) {
            console.error('Auth Callback unexpected error:', e)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`)
        }
    }

    // No code parameter provided at all
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent('No authorization code provided. Please try signing in again.')}`)
}

