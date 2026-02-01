
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

// Keep the old export for backward compatibility if needed, or better yet, refactor usages. 
// For now, let's keep 'supabase' as a singleton instance for simple client-side fetches if existing code relies on it,
// but the new best practice is to use the function.
export const supabase = createClient();
