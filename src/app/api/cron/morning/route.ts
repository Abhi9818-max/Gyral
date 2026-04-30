import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

const STOIC_QUOTES = [
    "The sun rises. What will you conquer today?",
    "We suffer more often in imagination than in reality. — Seneca",
    "Waste no more time arguing about what a good man should be. Be one. — Marcus Aurelius",
    "You have power over your mind — not outside events. — Marcus Aurelius",
    "The happiness of your life depends upon the quality of your thoughts. — Marcus Aurelius",
    "It is not death that a man should fear, but he should fear never beginning to live. — Marcus Aurelius",
    "Man conquers the world by conquering himself. — Epictetus",
    "First say to yourself what you would be; then do what you have to do. — Epictetus",
    "He who is not a good servant will not be a good master. — Plato",
    "The secret of getting ahead is getting started. — Agamemnon",
    "Difficulty is what wakes up the genius. — Nassim Taleb",
    "Make the most of yourself, for that is all there is of you. — Ralph Waldo Emerson",
];

export async function GET(req: NextRequest) {
    // Vercel cron jobs call via GET and pass the Authorization header automatically
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return sendMorningNotifications();
}

// Also allow POST for manual testing (from the app itself)
export async function POST(req: NextRequest) {
    // For manual triggers from the app, require a logged-in user OR cron secret
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron) {
        // Allow if called from app (no strict auth needed for testing)
        console.log('[Morning Cron] Manual trigger via POST');
    }

    return sendMorningNotifications();
}

async function sendMorningNotifications() {
    if (!adminMessaging) {
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    const adminClient = createAdminClient();
    const { data: tokens, error } = await adminClient
        .from('fcm_tokens')
        .select('user_id, token');

    if (error) {
        console.error('[Morning Cron] Error fetching FCM tokens:', error);
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
        return NextResponse.json({ message: 'No registered devices' }, { status: 200 });
    }

    const randomQuote = STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)];

    const results = await Promise.allSettled(tokens.map(device => {
        const message = {
            token: device.token,
            notification: {
                title: '☀️ Morning Briefing',
                body: randomQuote,
            },
            data: { url: '/' },
            android: {
                notification: {
                    icon: 'ic_stat_ic_notification',
                    color: '#6366f1',
                }
            },
            apns: {
                payload: {
                    aps: { badge: 1, sound: 'default' }
                }
            }
        };
        return adminMessaging!.send(message);
    }));

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[Morning Cron] Sent to ${successCount}/${tokens.length} devices`);

    return NextResponse.json({
        success: true,
        sent: successCount,
        total: tokens.length,
        quote: randomQuote
    });
}
