
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

const QUOTES = [
    "The sun rises. What will you conquer today?",
    "We suffer more often in imagination than in reality.",
    "Waste no more time arguing about what a good man should be. Be one.",
    "You have power over your mind - not outside events.",
    "The happiness of your life depends upon the quality of your thoughts.",
    "It is not death that a man should fear, but he should fear never beginning to live.",
    "Man conquers the world by conquering himself."
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: NextRequest) {
    // Auth check for testing trigger
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();
    const { data: tokens, error } = await adminClient
        .from('fcm_tokens')
        .select('*');

    if (error) {
        console.error('Error fetching FCM tokens:', error);
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
        return NextResponse.json({ error: 'No fcm tokens found' }, { status: 404 });
    }

    if (!adminMessaging) {
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const notification = {
        title: "Morning Briefing",
        body: randomQuote,
    };

    const results = await Promise.allSettled(tokens.map(device => {
        const message = {
            token: device.token,
            notification,
            data: { url: "/" },
            android: { notification: { icon: 'ic_stat_ic_notification' } }
        };
        return adminMessaging!.send(message);
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    return NextResponse.json({
        success: true,
        message: `Sent morning briefing to ${successCount} devices`,
        quote: randomQuote
    });
}
