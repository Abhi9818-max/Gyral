import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// NOTE: These should be in env vars. I'm putting placeholders here to be replaced.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@gyral.com',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

export async function POST(request: Request) {
    try {
        const { title, body, userId } = await request.json();
        const supabase = await createClient();

        // If userId not provided, try to send to current user (self-test)
        let targetUserId = userId;
        if (!targetUserId) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) targetUserId = user.id;
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'No recipient' }, { status: 400 });
        }

        // Fetch subscription
        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', targetUserId);

        if (!subs || subs.length === 0) {
            return NextResponse.json({ error: 'No subscriptions found for user' }, { status: 404 });
        }

        // Send to all devices
        const results = await Promise.all(subs.map(async (record) => {
            try {
                await webpush.sendNotification(record.subscription, JSON.stringify({
                    title: title || 'Gyral',
                    body: body || 'Notification',
                    url: '/'
                }));
                return { success: true };
            } catch (err) {
                console.error("Push Error:", err);
                return { success: false, error: err };
            }
        }));

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
