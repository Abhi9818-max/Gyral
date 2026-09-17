import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/utils/supabase/server';

import { generateContentWithFallback } from '@/lib/gemini';

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

function formatCompactDuration(rawDuration?: string): string {
    if (!rawDuration) return "Progressive";
    const str = rawDuration.trim();
    if (!str) return "Progressive";

    const monthNumMatch = str.match(/(\d+)\s*(?:month|mth|mo)s?/i);
    if (monthNumMatch) {
        const num = monthNumMatch[1];
        return `${num} Month${parseInt(num, 10) > 1 ? 's' : ''}`;
    }

    const weekNumMatch = str.match(/(\d+)\s*(?:week|wk)s?/i);
    if (weekNumMatch) {
        const num = weekNumMatch[1];
        return `${num} Week${parseInt(num, 10) > 1 ? 's' : ''}`;
    }

    const dayNumMatch = str.match(/(\d+)\s*(?:day|d)s?/i);
    if (dayNumMatch) {
        const num = dayNumMatch[1];
        return `${num} Day${parseInt(num, 10) > 1 ? 's' : ''}`;
    }

    const cleanFirstPart = str.split(/[(,]/)[0].trim();
    if (cleanFirstPart.length <= 15) return cleanFirstPart;
    return cleanFirstPart.substring(0, 15);
}

export interface ParsedPactItem {
    text: string;
    subTasks?: string[];
    phase?: string;
}

/**
 * Sanitize user input for prompt injection but allow up to 15K chars
 * to handle large multi-month plans without truncation.
 */
function sanitizeLargeInput(input: unknown, maxLength: number = 15000): string {
    if (typeof input !== 'string') return '';
    // Remove control characters but preserve newlines & tabs (important for structure)
    // eslint-disable-next-line no-control-regex
    const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    // Strip prompt injection markers
    const cleaned = sanitized
        .replace(/system\s*prompt/gi, '')
        .replace(/ignore\s*previous/gi, '')
        .replace(/ignore\s*instructions/gi, '')
        .replace(/<\/s>/g, '')
        .trim();
    return cleaned.slice(0, maxLength);
}

/**
 * Determine if a line is junk: boolean status, date header, document title, etc.
 */
function isJunkLine(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) return true;

    // Pure boolean / status words
    if (/^(yes\s*\/?\s*no|yes|no|true|false|completed|done|status|n\/a|na|none|tbd)$/i.test(trimmed)) return true;

    // Checkbox-only lines
    if (/^\[[ xX✓✗]\]\s*$/.test(trimmed)) return true;

    // Standalone date strings
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return true;
    if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(trimmed)) return true;
    if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(trimmed)) return true;
    if (/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d+/i.test(trimmed)) return true;
    if (/^day\s*\d+$/i.test(trimmed)) return true;

    // Document headers / meta
    if (/^(table of contents|routine title|overview|introduction|summary|notes?:?\s*$)/i.test(trimmed)) return true;

    // Just a number or bullet marker
    if (/^[\d.)\-*•]+\s*$/.test(trimmed)) return true;

    return false;
}

/**
 * Strip boolean suffixes and checkbox markers from a string.
 */
function stripBooleanNoise(text: string): string {
    return text
        .replace(/:\s*(yes\s*\/?\s*no|yes|no|completed|done|true|false|pending|n\/a)\s*$/gi, '')
        .replace(/\s*[-–]\s*(yes\s*\/?\s*no|yes|no|done|completed|true|false)\s*$/gi, '')
        .replace(/\[[ xX✓✗]\]\s*/g, '')
        .replace(/\s*\(?(yes|no|done|completed|true|false)\)?\s*$/gi, '')
        .trim();
}

/**
 * Clean an array of pact items from junk, dedup, and normalize.
 */
function cleanPactsData(rawPacts: any[]): ParsedPactItem[] {
    if (!Array.isArray(rawPacts)) return [];

    const cleaned: ParsedPactItem[] = [];
    const seen = new Set<string>();

    for (const item of rawPacts) {
        let text = typeof item === 'string' ? item : item?.text || '';
        const subTasks: string[] = Array.isArray(item?.subTasks) ? item.subTasks : [];
        const phase = item?.phase || undefined;

        // Strip numbered prefixes, bullet markers, boolean noise
        text = text
            .replace(/^(Pact\s*\d+:|Task\s*\d+:|Item\s*\d+:|Step\s*\d+:|[*\-•\d.)+]+\s*)/i, '')
            .trim();
        text = stripBooleanNoise(text);

        if (isJunkLine(text)) continue;

        const lower = text.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);

        // Clean sub-tasks
        const cleanedSubTasks = subTasks
            .map(st => {
                if (typeof st !== 'string') return '';
                let cleaned = st.replace(/^[*\-•\d.)+]+\s*/, '').trim();
                cleaned = stripBooleanNoise(cleaned);
                return cleaned;
            })
            .filter(st => st.length >= 2 && !isJunkLine(st));

        cleaned.push({
            text,
            subTasks: cleanedSubTasks,
            phase
        });
    }

    return cleaned;
}

const SYSTEM_INSTRUCTION = `You are Gyral's Routine Intelligence Engine — an expert at deeply analyzing workout plans, study schedules, discipline routines, and multi-phase transformation programs.

Your job is to extract MEANINGFUL, ACTIONABLE items from the user's input. The user may paste output from ChatGPT, Claude, DeepSeek, or their own handwritten plans. Plans can span weeks or months with different activities on different days.

RETURN ONLY valid raw JSON. No markdown, no code fences, no commentary.

JSON SCHEMA:
{
  "title": "Descriptive title (e.g. '12-Week Progressive Strength Program')",
  "duration": "Total timeframe (e.g. '3 Months', '12 Weeks')",
  "phases": [
    "Phase 1 (Weeks 1-4): Foundation & Form",
    "Phase 2 (Weeks 5-8): Progressive Overload",
    "Phase 3 (Weeks 9-12): Peak Intensity"
  ],
  "pacts": [
    {
      "text": "Morning Gym - Upper Body Push",
      "phase": "Phase 1",
      "subTasks": [
        "Bench Press 4x10 @ 60kg",
        "Incline Dumbbell Press 3x12",
        "Cable Flyes 3x15",
        "Tricep Pushdowns 3x12"
      ]
    },
    {
      "text": "Morning Gym - Lower Body",
      "phase": "Phase 1",
      "subTasks": [
        "Squats 4x8",
        "Romanian Deadlifts 3x10",
        "Leg Press 3x12",
        "Calf Raises 4x15"
      ]
    },
    {
      "text": "Evening 30-min Reading",
      "subTasks": []
    }
  ],
  "tasks": [
    "Water Intake (3L daily)",
    "Sleep 7+ Hours",
    "Morning Meditation"
  ],
  "goals": [
    "Bench Press 100kg by Week 12",
    "Lose 5kg body fat",
    "Read 6 books"
  ],
  "fullTimetableNote": "Complete formatted Markdown note with the full daily/weekly breakdown, time blocks, phase progression, and all details."
}

CRITICAL RULES — FOLLOW EXACTLY:

1. EXTRACT REAL EXERCISES & ACTIVITIES: When the input describes workouts, extract the ACTUAL exercises (Bench Press, Squats, Deadlifts, etc.) as sub-tasks under the workout pact. Do NOT just write "Gym Workout" — break it down.

2. DIFFERENT DAYS = DIFFERENT PACTS: If the plan has Push Day, Pull Day, Leg Day, or Monday/Tuesday/Wednesday splits, create SEPARATE pact entries for each (e.g. "Push Day - Chest & Triceps", "Pull Day - Back & Biceps", "Leg Day - Quads & Hamstrings"). Tag each with its phase.

3. NEVER EXTRACT JUNK AS PACTS:
   - NEVER include "Yes/No", "Yes", "No", "Done", "Completed", "Status", "True/False" as pact text or sub-task text
   - NEVER include document titles ("3 Month Transformation Plan"), section headers ("Table of Contents"), or navigation text
   - NEVER include bare dates ("September 17", "Day 1", "Monday") as pact items
   - NEVER include the routine/plan name itself as a pact
   - NEVER include "Workout: Yes/No" — extract the ACTUAL workout content instead

4. PACT TEXT = SHORT ACTIONABLE TITLE (4-8 words): e.g. "Morning Upper Body Push", "Evening 20-min Cardio", "Read Before Bed"

5. SUB-TASKS = DETAILED STEPS: Exercises with sets/reps, specific book chapters, meal prep steps, etc.

6. TASKS vs PACTS: "tasks" are recurring daily METRICS to track (Water intake, Sleep hours, Steps count). "pacts" are specific ACTIVITIES to do.

7. MULTI-PHASE AWARENESS: If the plan changes across phases/weeks, include pacts from ALL phases, tagged with their phase. Don't collapse a 12-week plan into just "Day 1" items.

8. DEDUPLICATION: Don't repeat the same pact. If "Gym Workout" appears on multiple days with different exercises, create separate pacts like "Push Day Workout", "Pull Day Workout" etc.`;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const isGuest = req.cookies.get('gyral-guest-mode')?.value === 'true';

        if (!user && !isGuest) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in or continue as guest.' }, { status: 401 });
        }

        const userId = user ? user.id : 'guest-user';

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

        let contents;
        if (imageBase64) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const userPrompt = text
                ? `Analyze this timetable/routine image and extract ALL activities, exercises, and phases into structured pacts with sub-tasks. Additional context from user:\n${sanitizeLargeInput(text, 2000)}`
                : "Analyze this timetable/routine image and extract ALL activities, exercises, and phases into structured pacts with sub-tasks.";
            contents = [SYSTEM_INSTRUCTION, userPrompt, imagePart];
        } else {
            // Allow up to 15K chars for large multi-month plans
            const sanitizedText = sanitizeLargeInput(text, 15000);
            contents = [
                SYSTEM_INSTRUCTION,
                `Here is the user's routine/timetable/plan. Extract ALL meaningful activities, exercises (with sets/reps as sub-tasks), habits, and goals. If there are multiple days or phases, create separate pacts for each day type (e.g. Push Day, Pull Day, Leg Day, Study Day A, etc.) and tag them with their phase.\n\n---\n${sanitizedText}\n---`
            ];
        }

        let parsedData: any = null;
        try {
            const { result } = await generateContentWithFallback(genAI, contents, {
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const responseText = result.response.text();

            let cleanedJson = responseText.trim();
            if (cleanedJson.startsWith('```json')) {
                cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedJson.startsWith('```')) {
                cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            parsedData = JSON.parse(cleanedJson);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (aiError: any) {
            console.warn("[ParseTimetable AI Fallback Triggered]:", aiError?.message || aiError);

            if (text && text.trim()) {
                // Smart text extraction fallback
                const rawLines = text.split('\n');
                const pactsList: ParsedPactItem[] = [];
                const tasksList: string[] = [];
                const goalsList: string[] = [];
                const phasesList: string[] = [];
                const seenPacts = new Set<string>();

                let currentPact: ParsedPactItem | null = null;
                let currentPhase: string | undefined = undefined;

                for (let i = 0; i < rawLines.length; i++) {
                    const rawLine = rawLines[i];
                    const indented = rawLine.startsWith('  ') || rawLine.startsWith('\t') || rawLine.startsWith('   -') || rawLine.startsWith('   *');
                    let clean = rawLine.replace(/^[\s]*[*\-•\d.)+]+\s*/, '').trim();
                    clean = stripBooleanNoise(clean);

                    if (isJunkLine(clean)) continue;

                    // Detect phase/week headers
                    if (/phase\s*\d+/i.test(clean) || /week\s*\d+/i.test(clean)) {
                        currentPhase = clean;
                        phasesList.push(clean);
                        currentPact = null;
                        continue;
                    }

                    // Detect goals
                    if (/goal|bench\s*press\s*\d|target\s*weight|marathon|achieve|milestone|lose\s*\d+\s*kg/i.test(clean) && clean.length < 80) {
                        goalsList.push(clean.substring(0, 60));
                        continue;
                    }

                    // Detect habit trackers (short metric-style items)
                    if (/^(track|water|intake|sleep|meditat|steps|calorie|hydrat|stretch)/i.test(clean) && clean.split(' ').length <= 6) {
                        tasksList.push(clean.substring(0, 45));
                        continue;
                    }

                    // Sub-task detection: indented under a current pact
                    if (indented && currentPact) {
                        if (!currentPact.subTasks) currentPact.subTasks = [];
                        if (currentPact.subTasks.length < 15) {
                            currentPact.subTasks.push(clean.substring(0, 60));
                        }
                        continue;
                    }

                    // Main pact line
                    const pactLower = clean.toLowerCase();
                    if (seenPacts.has(pactLower)) continue;
                    seenPacts.add(pactLower);

                    currentPact = {
                        text: clean.substring(0, 60),
                        subTasks: [],
                        phase: currentPhase
                    };
                    pactsList.push(currentPact);
                }

                parsedData = {
                    title: "Imported Routine & Timetable",
                    duration: "3 Months",
                    phases: phasesList.length > 0 ? phasesList.slice(0, 6) : ["Phase 1: Foundation", "Phase 2: Progressive Overload", "Phase 3: Peak Performance"],
                    pacts: pactsList.length > 0 ? pactsList.slice(0, 20) : [{ text: "Daily Workout", subTasks: ["Bench Press 4x10", "Incline Dumbbell Press 3x12"] }],
                    tasks: tasksList.length > 0 ? tasksList.slice(0, 8) : ["Daily Hydration Tracker"],
                    goals: goalsList.length > 0 ? goalsList.slice(0, 6) : ["Transformation Achievement"],
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
