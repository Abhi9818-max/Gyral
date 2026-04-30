import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

const EVENING_MESSAGES = [
    "The day ends. Update your records. Did you live according to your nature?",
    "Evening evaluation: Did you keep your word to yourself today?",
    "Before you sleep — review. What was done? What was avoided? What must change?",
    "Reflect on your day. The unexamined life is not worth living. — Socrates",
    "Tonight's question: Were you the person you intended to be today?",
    "Log your progress. Small steps compound into great distances.",
    "The Citadel awaits your report. What did you conquer today?",
];

export async function GET(req: NextRequest) {
    // Vercel cron jobs call via GET with Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return sendEveningNotifications();
}

// Allow POST for manual testing from the app
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (!isCron) {
        console.log('[Evening Cron] Manual trigger via POST');
    }
    return sendEveningNotifications();
}

async function sendEveningNotifications() {
    if (!adminMessaging) {
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    const adminClient = createAdminClient();

    // Get all FCM tokens
    const { data: tokens, error: tokenError } = await adminClient
        .from('fcm_tokens')
        .select('user_id, token');

    if (tokenError) {
        console.error('[Evening Cron] Error fetching FCM tokens:', tokenError);
        return NextResponse.json({ error: 'Database error: ' + tokenError.message }, { status: 500 });
    }

    if (!tokens || tokens.length === 0) {
        return NextResponse.json({ message: 'No registered devices' }, { status: 200 });
    }

    // Figure out today's date string (YYYY-MM-DD) in UTC
    const today = new Date().toISOString().split('T')[0];

    // Get all user IDs who have already logged something today
    const userIds = [...new Set(tokens.map(t => t.user_id))];
    const { data: todayRecords } = await adminClient
        .from('records')
        .select('user_id')
        .eq('date', today)
        .in('user_id', userIds);

    const usersWhoLoggedToday = new Set((todayRecords || []).map((r: { user_id: string }) => r.user_id));

    const randomMessage = EVENING_MESSAGES[Math.floor(Math.random() * EVENING_MESSAGES.length)];
    const results = [];

    for (const device of tokens) {
        // Customize message: missed log gets a more urgent nudge
        const hasLogged = usersWhoLoggedToday.has(device.user_id);
        const title = hasLogged ? '🌙 Evening Evaluation' : '⚠️ Don\'t Break the Chain';
        const body = hasLogged
            ? randomMessage
            : "You haven't logged anything today. The chain breaks tonight if you don't act. Open Gyral now.";

        try {
            const message = {
                token: device.token,
                notification: { title, body },
                data: { url: '/' },
                android: {
                    notification: {
                        icon: 'ic_stat_ic_notification',
                        color: '#6366f1',
                        priority: hasLogged ? 'default' : 'high',
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            badge: hasLogged ? 0 : 1,
                            sound: hasLogged ? 'default' : 'default',
                            'interruption-level': hasLogged ? 'active' : 'time-sensitive',
                        }
                    }
                }
            };

            await adminMessaging.send(message as Parameters<typeof adminMessaging.send>[0]);
            results.push({ success: true, user: device.user_id, hasLogged });
        } catch (e: unknown) {
            const err = e as { message?: string };
            console.error(`[Evening Cron] Failed to send to ${device.user_id}:`, err?.message);
            results.push({ success: false, user: device.user_id });
        }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Evening Cron] Sent to ${successCount}/${tokens.length} devices`);

    return NextResponse.json({
        success: true,
        sent: successCount,
        total: tokens.length,
        missedCount: results.filter(r => r.success && !r.hasLogged).length,
    });
}
