import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/utils/supabase/server';
import { sanitizeForPrompt } from '@/lib/validation';

import { generateContentWithFallback } from '@/lib/gemini';

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

function formatCompactDuration(rawDuration?: string): string {
    if (!rawDuration) return "Progressive";
    const str = rawDuration.trim();
    if (!str) return "Progressive";

    // 1. If months are mentioned anywhere (e.g. "12 Weeks ( 3 Month )", "3 Months", "3 mths") -> Primary: Months Only
    const monthNumMatch = str.match(/(\d+)\s*(?:month|mth|mo)s?/i);
    if (monthNumMatch) {
        const num = monthNumMatch[1];
        return `${num} Month${parseInt(num, 10) > 1 ? 's' : ''}`;
    }

    // 2. Secondary: If weeks are mentioned (e.g. "12 weeks") -> Weeks Only
    const weekNumMatch = str.match(/(\d+)\s*(?:week|wk)s?/i);
    if (weekNumMatch) {
        const num = weekNumMatch[1];
        return `${num} Week${parseInt(num, 10) > 1 ? 's' : ''}`;
    }

    // 3. Tertiary: If days are mentioned (e.g. "30 days") -> Days Only
    const dayNumMatch = str.match(/(\d+)\s*(?:day|d)s?/i);
    if (dayNumMatch) {
        const num = dayNumMatch[1];
        return `${num} Day${parseInt(num, 10) > 1 ? 's' : ''}`;
    }

    // 4. Fallback clean up
    const cleanFirstPart = str.split(/[(,]/)[0].trim();
    if (cleanFirstPart.length <= 15) return cleanFirstPart;
    return cleanFirstPart.substring(0, 15);
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Guest check fallback via cookie
        const isGuest = req.cookies.get('gyral-guest-mode')?.value === 'true';

        if (!user && !isGuest) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in or continue as guest.' }, { status: 401 });
        }

        const userId = user ? user.id : 'guest-user';

        // Rate limit: 20 parse requests per hour per user/guest
        const rateLimitCheck = checkRateLimit(userId, 'parse-timetable', {
            cooldownMs: 3000,
            maxRequests: 20,
            windowMs: 3600000,
            reason: "Rate limit reached for AI timetable parser. Please wait a moment."
        });

        if (!rateLimitCheck.allowed) {
            return NextResponse.json(
                { error: rateLimitCheck.reason, waitTime: rateLimitCheck.waitTime },
                { status: 429 }
            );
        }

        if (!genAI) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing on server.' }, { status: 500 });
        }

        const body = await req.json();
        const { text, imageBase64 } = body;

        if (!text && !imageBase64) {
            return NextResponse.json({ error: 'Provide either text or imageBase64 data.' }, { status: 400 });
        }

        const systemPrompt = `
You are an expert Productivity & Routine Parsing Engine for the Gyral discipline system.
Analyze the user's timetable, gym schedule, habit plan, or raw AI output (from ChatGPT, Claude, DeepSeek, etc.) and extract structured data.

INSTRUCTIONS:
1. Return ONLY valid, raw JSON (no code block formatting, no markdown wrappers, no commentary).
2. The JSON schema MUST match exactly:
{
  "title": "Short descriptive title for this routine (e.g. 3-Month Progressive Gym & Mindset Routine)",
  "duration": "Target timeframe for this transformation (e.g. 3 Months)",
  "phases": [
    "Phase breakdown describing progressive workload variation (e.g. Phase 1 (Weeks 1-4): Light Foundation & Form, Phase 2 (Weeks 5-8): Progressive Overload, Phase 3 (Weeks 9-12): Peak Intensity)"
  ],
  "pacts": [
    "Specific daily habit, vow, or time-blocked action item (e.g. 7:00 AM Gym Workout, Read 20 pages before bed, No sugar after 8 PM)"
  ],
  "tasks": [
    "Habit trackers or recurring metrics (e.g. Heavy Upper Body Training, 3L Water Intake, Meditation)"
  ],
  "goals": [
    "Long-term milestones or target achievements (e.g. Bench press 100kg in 3 months, Read 12 books this year)"
  ],
  "fullTimetableNote": "A clean, beautifully formatted Markdown reference note representing the complete daily/weekly timetable with time blocks, progressive phase breakdown, and bullet points."
}

RULES:
- DURATION RULE: Keep 'duration' extremely compact. If months are mentioned (e.g. 3 Months), USE MONTHS ONLY (e.g. '3 Months'). If months are not mentioned but weeks are, USE WEEKS ONLY (e.g. '12 Weeks'). Never combine both like '12 Weeks (3 Months)'!
- PACTS LENGTH RULE: Each entry in 'pacts' MUST be concise (ideally 4-5 words per item). Avoid long, complex sentences so daily check-off items do not look tricky or overwhelming to read.
- NO DUPLICATIONS RULE: Avoid duplicating the exact same entries between 'pacts' and 'tasks' (habit trackers). Keep pacts as time-blocked vows and habit trackers as distinct daily metrics.
- ACCURATE PROGRESSIVE PHASES RULE: Provide accurate progressive workload phase breakdowns (scaling intensity over weeks/months). Make sure phase descriptions are clear and actionable.
- DETAILED CATEGORY NOTES RULE: In 'fullTimetableNote', organize clean, detailed Markdown headings (##) and sections for each category (Phases, Daily Schedule, Habit Trackers, Goals) so the user can open Notes and read every detail in full depth.
`;

        let contents;
        if (imageBase64) {
            // Process screenshot image
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const userPrompt = text
                ? `Extract timetable from this image. Additional context: ${sanitizeForPrompt(text, 500)}`
                : "Extract timetable from this screenshot image.";
            contents = [systemPrompt, userPrompt, imagePart];
        } else {
            // Process text input
            const sanitizedText = sanitizeForPrompt(text, 4000);
            contents = [systemPrompt, `User AI Timetable Input:\n\n${sanitizedText}`];
        }

        const { result } = await generateContentWithFallback(genAI, contents, {
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const responseText = result.response.text();

        // Clean any potential markdown fencing if model didn't obey responseMimeType strictly
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsedData = JSON.parse(cleanedJson);

        return NextResponse.json({
            success: true,
            data: {
                title: parsedData.title || "AI Routine & Timetable",
                duration: formatCompactDuration(parsedData.duration),
                phases: Array.isArray(parsedData.phases) ? parsedData.phases : [],
                pacts: Array.isArray(parsedData.pacts) ? parsedData.pacts : [],
                tasks: Array.isArray(parsedData.tasks) ? parsedData.tasks : [],
                goals: Array.isArray(parsedData.goals) ? parsedData.goals : [],
                fullTimetableNote: parsedData.fullTimetableNote || text || "Imported Timetable"
            }
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("[ParseTimetable API Error]:", error);
        return NextResponse.json({
            error: error.message || 'Failed to parse timetable with AI. Please check format and try again.'
        }, { status: 500 });
    }
}
