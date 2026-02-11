import { createClient } from '@/utils/supabase/server';
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
    const supabase = await createClient();

    // In a real cron, we'd verify a secret key header here to prevent spam
    // For this prototype, we'll allow authenticated users to trigger it (for testing)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ALL subscriptions (in a real app you might batch this or filter by timezone)
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*');

    if (error || !subscriptions) {
        return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 });
    }

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const payload = JSON.stringify({
        title: "Morning Briefing",
        body: randomQuote,
        url: "/"
    });

    // Send to all (in the background)
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
