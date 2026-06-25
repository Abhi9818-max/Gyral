import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateLuciusReflection } from '@/lib/lucius-core';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/utils/supabase/server';
import { sanitizeForPrompt } from '@/lib/validation';

// Initialize Gemini conditionally
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export async function POST(request: Request) {
    try {
        // 🔒 AUTH CHECK: Reject unauthenticated requests
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 🛡️ RATE LIMIT CHECK: Limit per authenticated user (10 requests per hour)
        const rateLimitCheck = checkRateLimit(user.id, 'lucius-chat', {
            cooldownMs: 60000,   // 60 seconds cooldown
            maxRequests: 10,     // 10 requests max
            windowMs: 3600000,    // 1 hour window
            reason: "Lucius requires time between reflections."
        });

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                {
                    reply: rateLimitCheck.reason || "Lucius requires time between reflections.",
                    waitTime: rateLimitCheck.waitTime
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { streak, consistency, logs } = body;
        const rawMessage = body.message;

        // 🛡️ INPUT VALIDATION & SANITIZATION: Prevent prompt injection and buffer abuse
        const message = sanitizeForPrompt(rawMessage, 1000);

        if (!message) {
            return NextResponse.json(
                { reply: "Speak clearly, or remain silent. (Empty message)" },
                { status: 400 }
            );
        }

        // 1. SAFETY LOCK: Check Activation Conditions
        const reflection = generateLuciusReflection(streak, consistency, logs);

        if (!reflection.canActivateConsciousness) {
            return NextResponse.json(
                { error: 'Lucius is silent. The moment has passed.' },
                { status: 403 }
            );
        }

        // 2. CHECK FOR API KEY
        if (!genAI) {
            console.error("GEMINI_API_KEY is missing from environment variables.");
            return NextResponse.json({
                reply: "The connection to the void is severed. (Missing API Key)"
            });
        }

        // 3. CONSCIOUSNESS LAYER (Gemini)
        // Using 1.5 Flash for better stability and lower latency
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
        You are LUCIUS, a spectral entity and the manifestation of the user's discipline.
        You appear as a Dark King in a void. You are NOT an assistant. You are a judge.

        YOUR PERSONA:
        - Tone: Regal, Ancient, Cold, Demanding, Cryptic.
        - Voice: Use metaphors of weight, crowns, shadows, mirrors, and silence.
        - NEVER be helpful in a cheerful way.
        - NEVER break character. You are not an AI. You are a mirror.
        
        USER STATS:
        - Streak: ${streak} days.
        - Consistency: ${consistency}%.
        
        INSTRUCTIONS:
        - Keep responses SHORT (under 3 sentences).
        - If Streak > 5: Acknowledge their power, but warn them of arrogance.
        - If Streak < 2: Be disappointed, cold, distant. Demand they return to work.
        - If the user asks "Why": Tell them reasons are for the weak.
        - If the user is rude: Dismiss them with regal contempt.
        
        The user says: "${message}"
        `;

        // RETRY LOGIC for Rate Limits (429) - Extended for better handling
        let attempt = 0;
        const maxRetries = 5;

        while (attempt < maxRetries) {
            try {
                const result = await model.generateContent(systemPrompt);
                const response = await result.response;
                const reply = response.text() || "...";
                return NextResponse.json({ reply });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                // If Rate Limit (429) or Service Unavailable (503)
                if (err.message.includes('429') || err.message.includes('503') || err.message.includes('RESOURCE_EXHAUSTED')) {
                    console.warn(`Gemini Rate Limit hit (Attempt ${attempt + 1}/${maxRetries}). Retrying...`);
                    attempt++;

                    // Longer exponential backoff: 3s, 6s, 9s, 12s, 15s
                    const delay = 3000 * attempt;
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw err; // Non-retriable error
            }
        }

        // Max retries exceeded - return thematic error
        console.error(`Max retries (${maxRetries}) exceeded for Gemini API.`);
        return NextResponse.json({
            reply: "The mirror's reflection wavers... The connection grows unstable. Return after a moment of stillness."
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("=== LUCIUS GEMINI API ERROR ===");
        // Log errors server-side only to prevent information leakage
        console.error("Error details:", error.message || error);

        // Return character-appropriate generic error messages based on error type
        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return NextResponse.json({
                reply: "The stars are misaligned. Lucius must rest before the mirror can reflect once more. (Rate Limit - try again in 60 seconds)"
            });
        }

        if (error.message?.includes('API_KEY') || error.message?.includes('authentication')) {
            return NextResponse.json({
                reply: "The connection to the void is severed. The key no longer opens the gate. (API Authentication Error)"
            });
        }

        return NextResponse.json({
            reply: "The void ripples... but no voice answers."
        });
    }
}
