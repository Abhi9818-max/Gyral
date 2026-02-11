
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails('mailto:test@example.com', VAPID_PUBLIC, VAPID_PRIVATE);
}

const QUOTES = [
    "The sun rises. What will you conquer today?",
    "We suffer more often in imagination than in reality.",
    "Waste no more time arguing about what a good man should be. Be one.",
    "You have power over your mind - not outside events.",
    "The happiness of your life depends upon the quality of your thoughts.",
    "It is not death that a man should fear, but he should fear never beginning to live.",
    "Man conquers the world by conquering himself."
];

export async function POST(req: NextRequest) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
        return NextResponse.json({ error: 'VAPID keys not configured on server' }, { status: 500 });
    }

    // Auth check for testing trigger
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const payload = JSON.stringify({
        title: "Morning Briefing",
        body: randomQuote,
        url: "/"
    });

    const results = await Promise.allSettled(subscriptions.map(sub =>
        webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
    ));

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({
        success: true,
        message: `Sent morning briefing to ${successCount} devices`,
        quote: randomQuote
    });
}
