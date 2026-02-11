
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

// Admin client that bypasses RLS - only use in server-side API routes
// This requires SUPABASE_SERVICE_ROLE_KEY env var
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not found, falling back to anon key')
        return supabaseCreateClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    }

    return supabaseCreateClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
