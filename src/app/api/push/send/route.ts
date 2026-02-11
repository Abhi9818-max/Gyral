
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
        return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url } = await req.json();

    // Use admin client to bypass RLS and read subscriptions
    const admin = createAdminClient();
    const { data: subscriptions, error } = await admin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
        return NextResponse.json({ error: 'No subscriptions found. Please enable notifications first.' }, { status: 404 });
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
        } catch (error: any) {
            console.error('Error sending push:', error?.message || error);
            return { success: false, error: error?.message };
        }
    }));

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return NextResponse.json({
        success: successCount > 0,
        sent: successCount,
        failed: failedCount,
        errors: results.filter(r => !r.success).map(r => r.error)
    });
}
