
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
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
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

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isGuest = request.cookies.get('gyral-guest-mode')?.value === 'true'
    const pathname = request.nextUrl.pathname

    // Public routes that don't require authentication
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/compliance') ||
        pathname.includes('.')

    // If authenticated user visits the landing page, redirect to dashboard
    if (user && pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // If unauthenticated user visits a protected route, redirect to login
    if (!user && !isGuest && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Add Security Headers
    const response = supabaseResponse
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com; frame-ancestors 'none'; upgrade-insecure-requests;")
    response.headers.set('Permissions-Policy', "camera=(self), microphone=(self), geolocation=(self)")
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

    return response
}
