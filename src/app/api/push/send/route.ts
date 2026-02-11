import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url } = await req.json();

    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

    if (error || !subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const payload = JSON.stringify({ title, body, url });

    const results = await Promise.all(subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, payload);
            return { success: true };
        } catch (error) {
            console.error('Error sending push:', error);
            // Optionally delete invalid subscriptions here
            return { success: false, error };
        }
    }));

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({ success: true, sent: successCount });
}
