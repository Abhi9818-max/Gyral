import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    // Auth check for testing trigger
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
        return NextResponse.json({ error: 'No FCM tokens found' }, { status: 404 });
    }

    if (!adminMessaging) {
        return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    const results = [];

    for (const device of tokens) {
        try {
            const message = {
                token: device.token,
                notification: {
                    title: "Evening Evaluation",
                    body: "The day ends. Update your records. Did you live according to your nature?",
                },
                data: {
                    url: "/",
                },
                android: {
                    notification: {
                        icon: 'ic_stat_ic_notification'
                    }
                }
            };

            await adminMessaging.send(message);

            results.push({ success: true, user: device.user_id });
        } catch (e: any) {
            console.error(`Failed to send FCM to ${device.user_id} (${device.token})`, e?.message);
            results.push({ success: false, user: device.user_id });
        }
    }

    return NextResponse.json({
        success: true,
        sent: results.filter(r => r.success).length
    });
}
