import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminMessaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, title, body: messageBody, url, tag } = body;

        if (!userId || !title || !messageBody) {
            return NextResponse.json(
                { error: 'Missing required fields: userId, title, body' },
                { status: 400 }
            );
        }

        if (!adminMessaging) {
            return NextResponse.json(
                { error: 'Firebase Admin not configured properly' },
                { status: 500 }
            );
        }

        // Get all FCM tokens for the user
        const { data: tokens, error: tokenError } = await supabase
            .from('fcm_tokens')
            .select('*')
            .eq('user_id', userId);

        if (tokenError) {
            console.error('Error fetching FCM tokens:', tokenError);
            return NextResponse.json(
                { error: 'Failed to fetch stored tokens' },
                { status: 500 }
            );
        }

        if (!tokens || tokens.length === 0) {
            return NextResponse.json(
                { message: 'No devices strictly registered found for user' },
                { status: 200 }
            );
        }

        // Send push notification to all stored FCM tokens
        const sendPromises = tokens.map(async (device) => {
            try {
                const message = {
                    token: device.token,
                    notification: {
                        title,
                        body: messageBody,
                    },
                    data: {
                        url: url || '/notifications',
                        tag: tag || 'notification',
                        timestamp: Date.now().toString(),
                    },
                    android: {
                        notification: {
                            icon: 'ic_stat_ic_notification',
                            color: '#000000',
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                badge: 1,
                                sound: 'default',
                            }
                        }
                    }
                };

                await adminMessaging!.send(message);
                return { success: true, token: device.token };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error('Error sending push to FCM token:', device.token, error);

                // If token is invalid or unregistered, delete it
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    await supabase
                        .from('fcm_tokens')
                        .delete()
                        .eq('id', device.id);
                }

                return { success: false, token: device.token, error: error.message };
            }
        });

        const results = await Promise.all(sendPromises);
        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            sent: successCount,
            total: tokens.length,
            results,
        });
    } catch (error) {
        console.error('Error sending push notifications:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
