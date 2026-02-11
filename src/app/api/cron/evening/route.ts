
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(req: NextRequest) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        return NextResponse.json({ error: 'VAPID keys not configured on server' }, { status: 500 });
    }

    // Auth check for testing trigger
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use admin client to bypass RLS
    const admin = createAdminClient();
    const { data: subscriptions, error } = await admin
        .from('push_subscriptions')
        .select('*');

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const results = [];

    for (const sub of subscriptions) {
        try {
            const payload = JSON.stringify({
                title: "Evening Evaluation",
                body: "The day ends. Update your records. Did you live according to your nature?",
                url: "/"
            });

            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            }, payload);

            results.push({ success: true, user: sub.user_id });
        } catch (e: any) {
            console.error(`Failed to send to ${sub.user_id}`, e?.message);
            results.push({ success: false, user: sub.user_id });
        }
    }

    return NextResponse.json({
        success: true,
        sent: results.filter(r => r.success).length
    });
}
