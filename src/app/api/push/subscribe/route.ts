import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { subscription } = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!subscription) {
            return NextResponse.json({ error: 'No subscription provided' }, { status: 400 });
        }

        const { error } = await supabase
            .from('push_subscriptions')
            .insert({
                user_id: user.id,
                subscription: subscription
            });

        if (error) {
            console.error("DB Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
