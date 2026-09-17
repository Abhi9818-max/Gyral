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

export interface ParsedPactItem {
    text: string;
    subTasks?: string[];
    phase?: string;
}

function cleanPactsData(rawPacts: any[]): ParsedPactItem[] {
    if (!Array.isArray(rawPacts)) return [];

    const cleaned: ParsedPactItem[] = [];
    const seen = new Set<string>();

    for (const item of rawPacts) {
        let text = typeof item === 'string' ? item : item?.text || '';
        const subTasks: string[] = Array.isArray(item?.subTasks) ? item.subTasks : [];
        const phase = item?.phase || undefined;

        // Clean text from junk prefixes & boolean statuses
        text = text
            .replace(/^(Pact\s*\d+:|Task\s*\d+:|Item\s*\d+:|[*\-•\d.]+\s*)/i, '')
            .replace(/:\s*(yes\s*\/?\s*no|yes|no|completed|done|true|false)\b/gi, '')
            .replace(/\[[ xX]\]/g, '')
            .trim();

        // Skip document headers, date headers, or boolean noise
        const lower = text.toLowerCase();
        if (
            !text ||
            text.length < 3 ||
            seen.has(lower) ||
            /^(yes\s*\/?\s*no|yes|no|true|false|completed|status|date|day \d+|week \d+|table of contents|routine title)$/i.test(text) ||
            /^\d{4}-\d{2}-\d{2}$/.test(text) ||
            /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+/i.test(text)
        ) {
            continue;
        }

        seen.add(lower);

        // Clean sub-tasks array
        const cleanedSubTasks = subTasks
            .map(st => typeof st === 'string' ? st.replace(/^[*\-•\d.]+\s*/, '').trim() : '')
            .filter(st => st.length >= 2 && !/^(yes\s*\/?\s*no|yes|no|completed|done)$/i.test(st));

        cleaned.push({
            text,
            subTasks: cleanedSubTasks,
            phase
        });
    }

    return cleaned;
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
    {
      "text": "Actionable main pact title (e.g. 7:00 AM Upper Body Gym Workout)",
      "phase": "Optional phase tag (e.g. Phase 1)",
      "subTasks": [
        "Bench Press 4x10",
        "Incline Dumbbell Press 3x12",
        "Cable Flyes 3x15"
      ]
    }
  ],
  "tasks": [
    "Habit trackers or recurring metrics (e.g. Heavy Upper Body Training, 3L Water Intake, Meditation)"
  ],
  "goals": [
    "Long-term milestones or target achievements (e.g. Bench press 100kg in 3 months, Read 12 books this year)"
  ],
  "fullTimetableNote": "A clean, beautifully formatted Markdown reference note representing the complete daily/weekly timetable with time blocks, progressive phase breakdown, and bullet points."
}

CRITICAL CLEANING & EXTRACTION RULES:
- NO JUNK / NO BOOLEAN TEXT: NEVER output text like 'Workout: Yes/No', 'Completed: Yes', 'Status: Done', '[ ]', '[x]', or 'Yes' as pact text! Strip all boolean/checkbox noise completely.
- NO DOCUMENT HEADERS / NO DATES AS PACTS: Never extract document titles (e.g., '3 Month Transformation Plan', 'Table of Contents'), section headers, or date strings (e.g., 'September 17', 'Monday', 'Day 1') as pact items!
- SUB-TASKS CHECKLIST: Whenever a pact or workout has step-by-step exercises, chapters, or sub-activities, extract them into the 'subTasks' array of that pact object!
- CONCISE PACT TEXT: Main pact 'text' MUST be clean and actionable (e.g. '7:00 AM Upper Body Workout', 'Read 20 pages before bed'). Keep it to 4-6 words.
- NO DUPLICATIONS: Keep pacts as time-blocked action items with sub-tasks, and habit trackers ('tasks') as distinct daily metrics.
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

        let parsedData: any = null;
        try {
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

            parsedData = JSON.parse(cleanedJson);
        } catch (aiError: any) {
            console.warn("[ParseTimetable AI Fallback Triggered]:", aiError?.message || aiError);

            if (text && text.trim()) {
                // Perform smart text extraction fallback if Gemini API throws an error
                const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
                const pactsList: ParsedPactItem[] = [];
                const tasksList: string[] = [];
                const goalsList: string[] = [];
                const phasesList: string[] = [];

                let currentPact: ParsedPactItem | null = null;

                lines.forEach((line: string) => {
                    let clean = line.replace(/^[*\-•\d.]+\s*/, '').trim();
                    clean = clean
                        .replace(/:\s*(yes\s*\/?\s*no|yes|no|completed|done|true|false)\b/gi, '')
                        .replace(/\[[ xX]\]/g, '')
                        .trim();

                    if (!clean || clean.length < 3) return;

                    // Skip headers & boolean noise
                    if (/^(yes\s*\/?\s*no|yes|no|true|false|completed|status|date|table of contents|routine title)$/i.test(clean)) return;

                    if (/phase\s*\d+/i.test(clean) || /week\s*\d+/i.test(clean)) {
                        phasesList.push(clean);
                    } else if (/goal|bench|target|weight|marathon|achieve|milestone/i.test(clean)) {
                        goalsList.push(clean.substring(0, 60));
                    } else if (/track|water|intake|sleep|meditat|steps|calorie/i.test(clean) && clean.split(' ').length <= 5) {
                        tasksList.push(clean.substring(0, 45));
                    } else {
                        if (line.startsWith(' ') || line.startsWith('\t') || line.startsWith('  -') || line.startsWith('  *')) {
                            if (currentPact) {
                                if (!currentPact.subTasks) currentPact.subTasks = [];
                                currentPact.subTasks.push(clean.substring(0, 50));
                                return;
                            }
                        }
                        currentPact = { text: clean.substring(0, 50), subTasks: [] };
                        pactsList.push(currentPact);
                    }
                });

                parsedData = {
                    title: "Imported Routine & Timetable",
                    duration: "3 Months",
                    phases: phasesList.length > 0 ? phasesList.slice(0, 3) : ["Phase 1: Foundation", "Phase 2: Progressive Overload", "Phase 3: Peak Performance"],
                    pacts: pactsList.length > 0 ? pactsList.slice(0, 8) : [{ text: "7:00 AM Daily Workout", subTasks: ["Bench Press 4x10", "Incline Dumbbell Press 3x12"] }],
                    tasks: tasksList.length > 0 ? tasksList.slice(0, 6) : ["Daily Hydration Tracker", "Discipline Metric"],
                    goals: goalsList.length > 0 ? goalsList.slice(0, 5) : ["Transformation Achievement"],
                    fullTimetableNote: text
                };
            } else {
                throw aiError;
            }
        }

        const cleanedPacts = cleanPactsData(parsedData?.pacts || []);

        return NextResponse.json({
            success: true,
            data: {
                title: parsedData?.title || "AI Routine & Timetable",
                duration: formatCompactDuration(parsedData?.duration),
                phases: Array.isArray(parsedData?.phases) ? parsedData.phases : [],
                pacts: cleanedPacts,
                tasks: Array.isArray(parsedData?.tasks) ? parsedData.tasks : [],
                goals: Array.isArray(parsedData?.goals) ? parsedData.goals : [],
                fullTimetableNote: parsedData?.fullTimetableNote || text || "Imported Timetable"
            }
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("[ParseTimetable API Error]:", error);
        return NextResponse.json({
            error: error.message || 'Failed to parse timetable. Please check text format and try again.'
        }, { status: 500 });
    }
}
