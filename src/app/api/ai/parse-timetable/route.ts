import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/utils/supabase/server';
import { sanitizeForPrompt } from '@/lib/validation';

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

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
  "title": "Short descriptive title for this routine (e.g. Hypertrophy & Study Schedule)",
  "pacts": [
    "Specific daily habit, vow, or time-blocked action item (e.g. 7:00 AM Gym Workout, Read 20 pages before bed, No sugar after 8 PM)"
  ],
  "tasks": [
    "Habit trackers or recurring metrics (e.g. Heavy Upper Body Training, 3L Water Intake, Meditation)"
  ],
  "goals": [
    "Long-term milestones or target achievements (e.g. Bench press 100kg in 3 months, Read 12 books this year)"
  ],
  "fullTimetableNote": "A clean, beautifully formatted Markdown reference note representing the complete daily/weekly timetable with time blocks, sections, and bullet points."
}

RULES:
- Clean up any raw chat fluff, conversation intros, or filler text.
- Ensure 'pacts' are clear, actionable, concise statements suitable for daily check-off.
- Ensure 'fullTimetableNote' uses Markdown headings (##), tables, and bullet points so it looks great as a saved note.
`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        let result;
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
            result = await model.generateContent([systemPrompt, userPrompt, imagePart]);
        } else {
            // Process text input
            const sanitizedText = sanitizeForPrompt(text, 4000);
            result = await model.generateContent([systemPrompt, `User AI Timetable Input:\n\n${sanitizedText}`]);
        }

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
