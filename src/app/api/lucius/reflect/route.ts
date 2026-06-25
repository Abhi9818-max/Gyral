
import { NextResponse } from 'next/server';
import { generateLuciusReflection } from '@/lib/lucius-core';
import { createClient } from '@/utils/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
    try {
        // 🔒 AUTH CHECK: Reject unauthenticated requests
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🛡️ RATE LIMIT CHECK: Limit per authenticated user (10 requests per hour)
        const rateLimitCheck = checkRateLimit(user.id, 'lucius-reflect', {
            cooldownMs: 60000,   // 60 seconds cooldown
            maxRequests: 10,     // 10 requests max
            windowMs: 3600000,    // 1 hour window
            reason: "Lucius requires time between reflections."
        });

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                {
                    error: rateLimitCheck.reason || "Lucius requires time between reflections.",
                    waitTime: rateLimitCheck.waitTime
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { streak, consistency, logs } = body;

        // In a real implementation with LLM:
        // 1. Construct System Prompt with "Manifesto"
        // 2. Feed filtered logs (handled by core now)
        // 3. Call OpenAI/Anthropic
        // 4. Parse JSON

        // For now, we use the deterministic core logic which is safer for consistent demo
        // AND enforces the Observation Layer rules (30 days) internally.
        const reflection = generateLuciusReflection(streak, consistency, logs);

        return NextResponse.json(reflection);

    } catch (error) {
        console.error('Lucius Reflection Error:', error);
        return NextResponse.json({ error: 'Failed to consult the mirror.' }, { status: 500 });
    }
}
