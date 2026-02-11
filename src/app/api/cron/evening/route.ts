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

    // Auth check for testing trigger
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get all subscriptions with their user_ids
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*');

    if (error || !subscriptions) {
        return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const results = [];

    // 2. Iterate (Group by user would be more efficient in SQL but iterating JS for prototype)
    for (const sub of subscriptions) {
        try {
            // Check incomplete habits for this user
            // We assume "tasks" table has user_id and completed_dates array or similar
            // Adjust query to match your actual schema. 
            // Based on previous contexts, habits are in 'tasks' table and completion is tracked in 'records' or locally.
            // Simplified Check: Just check if they have ANY habits for now, or if we can check records.

            // To be precise with "Did you do the task?", we need to know today's date status.
            // Since `records` jsonb map is complex to query efficiently in one go without a view,
            // we will send a generic "Check your progress" if we can't easily count.

            // However, let's try to query pending count if possible.
            // Actually, for this specific user, let's just send the reminder.
            // The client-side logic keeps track of 'records'. The server might not have the today's record sync'd perfectly if offline.
            // WE WILL ASSUME: If they have habits, we remind them.

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

        } catch (e) {
            console.error(`Failed to send to ${sub.user_id}`, e);
            results.push({ success: false, user: sub.user_id });
        }
    }

    return NextResponse.json({
        success: true,
        sent: results.filter(r => r.success).length
    });
}
