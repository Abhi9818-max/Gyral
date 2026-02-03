
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const apiKey = process.env.DIOGENES_API_KEY;
    let userId = process.env.DIOGENES_USER_ID;

    if (!apiKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    if (authHeader !== `Bearer ${apiKey}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Identity resolution
    if (!userId) {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');
        if (username) {
            const { data } = await supabase.from('profiles').select('id').eq('username', username).single();
            if (data) userId = data.id;
        }
    }
    if (!userId) {
        const { data } = await supabase.from('profiles').select('id').limit(1);
        if (data?.[0]) userId = data[0].id;
    }
    if (!userId) return NextResponse.json({ error: 'User target not found' }, { status: 400 });

    try {
        const body = await req.json();

        if (!body.text) {
            return NextResponse.json({ error: 'Missing "text" field' }, { status: 400 });
        }

        const { data, error } = await supabase.from('pacts').insert({
            user_id: userId,
            text: body.text,
            date: body.date || new Date().toISOString().split('T')[0], // Default to today
            is_completed: false
        }).select();

        if (error) throw error;

        return NextResponse.json({ success: true, pact: data[0] });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
