
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const apiKey = process.env.DIOGENES_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Server configuration error: DIOGENES_API_KEY not set' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${apiKey}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Service Role to bypass RLS since we are accessing on behalf of the user via API Key
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // We need to know which user to fetch for.
    // Ideally this is set in env, or passed as a query param if we supported multi-tenancy.
    // For personal use, we'll try to find the user via ID in env, or fallback to the first profile found (dangerous but convenient for single user).

    let userId = process.env.DIOGENES_USER_ID;

    if (!userId) {
        // Fallback: Try to get the username from query params
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (username) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single();
            if (profile) userId = profile.id;
        }
    }

    if (!userId) {
        // Last resort/Lazy mode: Just grab the first user in profiles (Assumes single-tenant/personal instance)
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) {
            userId = profiles[0].id;
        }
    }

    if (!userId) {
        return NextResponse.json({ error: 'User not specified and no default found. Set DIOGENES_USER_ID in env.' }, { status: 400 });
    }

    // Parallel fetch for speed
    const [
        { data: profile },
        { data: tasks },
        { data: pacts },
        { data: vows },
        { data: notes },
        { data: recentRecords }
    ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('tasks').select('*').eq('user_id', userId).eq('is_archived', false),
        supabase.from('pacts').select('*').eq('user_id', userId).eq('is_completed', false),
        supabase.from('vows').select('*').eq('user_id', userId).eq('status', 'active'),
        supabase.from('notes').select('*').eq('user_id', userId).limit(5).order('updated_at', { ascending: false }),
        supabase.from('records').select('*').eq('user_id', userId).gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ]);

    // Construct the context packet
    const context = {
        user: {
            name: profile?.full_name,
            username: profile?.username,
            bio: profile?.bio
        },
        active_vows: vows,
        daily_habits: tasks?.map(t => ({
            id: t.id,
            name: t.name,
            metric: t.metric_config,
            recent_logs: recentRecords?.filter((r: any) => r.task_id === t.id)
        })),
        pending_pacts: pacts,
        recent_notes: notes
    };

    return NextResponse.json(context);
}
