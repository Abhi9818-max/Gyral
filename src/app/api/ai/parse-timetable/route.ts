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

// ── Month names regex fragment ──
const MONTH_NAMES = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DAY_NAMES = '(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)';

/**
 * Sanitize user input for prompt injection but allow up to 15K chars.
 */
function sanitizeLargeInput(input: unknown, maxLength: number = 15000): string {
    if (typeof input !== 'string') return '';
    // eslint-disable-next-line no-control-regex
    const sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    const cleaned = sanitized
        .replace(/system\s*prompt/gi, '')
        .replace(/ignore\s*previous/gi, '')
        .replace(/ignore\s*instructions/gi, '')
        .replace(/<\/s>/g, '')
        .trim();
    return cleaned.slice(0, maxLength);
}

/**
 * Strip ALL date-like patterns from a string and return what's left.
 * Handles: "12 Sept to 25 Sept", "September 12 - October 3", "2026-09-12",
 * "12/09/2026", "Day 1", "Week 3", "Monday", date ranges with colons, etc.
 */
function stripDatesFromText(text: string): string {
    let result = text;

    // Date ranges: "12 Sept to 25 Sept", "Sept 12 - Oct 25", "12 September to 25 October", etc.
    // Pattern: <num> <month> <separator> <num> <month>
    const dateRangeA = new RegExp(`\\d{1,2}\\s*${MONTH_NAMES}\\.?\\s*(?:to|–|—|-|till|until|through)\\s*\\d{1,2}\\s*${MONTH_NAMES}\\.?`, 'gi');
    result = result.replace(dateRangeA, '');

    // Pattern: <month> <num> <separator> <month> <num>
    const dateRangeB = new RegExp(`${MONTH_NAMES}\\.?\\s*\\d{1,2}\\s*(?:,\\s*\\d{4})?\\s*(?:to|–|—|-|till|until|through)\\s*${MONTH_NAMES}\\.?\\s*\\d{1,2}(?:\\s*,\\s*\\d{4})?`, 'gi');
    result = result.replace(dateRangeB, '');

    // Pattern: <num>/<num>/<num> to <num>/<num>/<num>
    result = result.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\s*(?:to|–|—|-|till|until|through)\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi, '');

    // ISO date ranges: 2026-09-12 to 2026-09-25
    result = result.replace(/\d{4}-\d{2}-\d{2}\s*(?:to|–|—|-|till|until|through)\s*\d{4}-\d{2}-\d{2}/gi, '');

    // Single dates: "12 Sept", "Sept 12", "September 17", "12th September", etc.
    const singleDateA = new RegExp(`\\d{1,2}(?:st|nd|rd|th)?\\s*${MONTH_NAMES}\\.?(?:\\s*\\d{4})?`, 'gi');
    result = result.replace(singleDateA, '');

    const singleDateB = new RegExp(`${MONTH_NAMES}\\.?\\s*\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{4})?`, 'gi');
    result = result.replace(singleDateB, '');

    // ISO dates: 2026-09-17
    result = result.replace(/\d{4}-\d{2}-\d{2}/g, '');

    // Slash dates: 12/09/2026, 09-12-26
    result = result.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '');

    // Day names: Monday, Tuesday, Mon, Tue, etc.
    const dayNamePattern = new RegExp(`\\b${DAY_NAMES}\\b`, 'gi');
    result = result.replace(dayNamePattern, '');

    // "Day 1", "Day 15", "Week 3", "Week 12"
    result = result.replace(/\b(?:day|week)\s*\d+\b/gi, '');

    // Clean leftover separators/punctuation after stripping
    result = result
        .replace(/^\s*[:\-–—,;|]+\s*/, '')  // leading separators
        .replace(/\s*[:\-–—,;|]+\s*$/, '')  // trailing separators
        .replace(/\s{2,}/g, ' ')             // collapse multiple spaces
        .trim();

    return result;
}

/**
 * Strip boolean/status suffixes and checkbox markers from a string.
 */
function stripBooleanNoise(text: string): string {
    return text
        // "Workout: Yes/No", "Workout: Yes", "Workout: Done"
        .replace(/:\s*(yes\s*\/?\s*no|yes|no|completed|done|true|false|pending|n\/a)\s*$/gi, '')
        // "Workout - Yes/No"
        .replace(/\s*[-–—]\s*(yes\s*\/?\s*no|yes|no|done|completed|true|false)\s*$/gi, '')
        // "[x] Workout", "[ ] Workout"
        .replace(/\[[ xX✓✗]\]\s*/g, '')
        // "Workout (Yes)", "Workout (No)"
        .replace(/\s*\(\s*(yes|no|done|completed|true|false)\s*\)\s*$/gi, '')
        // "Yes/No" anywhere in text (including "Workout Yes/No" without colon)
        .replace(/\s+yes\s*\/\s*no\s*$/gi, '')
        .replace(/\b(yes\s*\/\s*no)\b/gi, '')
        // Trailing standalone " Yes", " No", " Done" at end (no separator, just space)
        .replace(/\s+(yes|no|done|completed|true|false)\s*$/gi, '')
        .trim();
}

/**
 * Check if text is pure junk that should be discarded entirely.
 */
function isJunkText(text: string): boolean {
    const t = text.trim();
    if (!t || t.length < 3) return true;

    // Pure boolean / status words
    if (/^(yes\s*\/?\s*no|yes|no|true|false|completed|done|status|n\/a|na|none|tbd|ok|pending)$/i.test(t)) return true;

    // Checkbox-only
    if (/^\[[ xX✓✗]\]\s*$/.test(t)) return true;

    // Just a number, bullet, or punctuation
    if (/^[\d.)\-*•:;,|/\\]+\s*$/.test(t)) return true;

    // Document headers / meta labels
    if (/^(table of contents|routine title|overview|introduction|summary|schedule|timetable|plan title|notes?|description|details?|comments?|remarks?)\s*:?\s*$/i.test(t)) return true;

    // Pure date strings (standalone)
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return true;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(t)) return true;
    const pureDayName = new RegExp(`^${DAY_NAMES}$`, 'i');
    if (pureDayName.test(t)) return true;
    const pureMonthDate = new RegExp(`^${MONTH_NAMES}\\.?\\s*\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{4})?$`, 'i');
    if (pureMonthDate.test(t)) return true;
    const pureDateMonth = new RegExp(`^\\d{1,2}(?:st|nd|rd|th)?\\s*${MONTH_NAMES}\\.?(?:\\s*\\d{4})?$`, 'i');
    if (pureDateMonth.test(t)) return true;
    if (/^day\s*\d+$/i.test(t)) return true;
    if (/^week\s*\d+$/i.test(t)) return true;

    // Date range that IS the entire text (nothing else)
    const dateRangeOnly = new RegExp(`^\\d{1,2}\\s*${MONTH_NAMES}\\.?\\s*(?:to|-|–|—)\\s*\\d{1,2}\\s*${MONTH_NAMES}\\.?$`, 'i');
    if (dateRangeOnly.test(t)) return true;

    // Plan/routine title patterns — generic labels not actionable
    if (/^\d+\s*[-\s]?\s*(?:month|week|day)s?\s+(?:plan|routine|program|schedule|transformation|challenge|journey)\b/i.test(t)) return true;
    if (/^(?:my\s+)?(?:fitness|gym|workout|study|discipline|training|health)\s+(?:plan|routine|program|schedule|journey)\s*$/i.test(t)) return true;
    if (/^(?:transformation|progressive|complete|full|total|master)\s+(?:plan|routine|program|schedule)\s*$/i.test(t)) return true;

    return false;
}

/**
 * Full cleaning pipeline for a single pact text:
 * 1. Strip numbered prefixes & bullet markers
 * 2. Strip boolean noise
 * 3. Strip date patterns (ranges & singles)
 * 4. Check if result is junk → discard
 */
function cleanPactText(raw: string): string | null {
    let text = raw
        .replace(/^(Pact\s*\d+:|Task\s*\d+:|Item\s*\d+:|Step\s*\d+:|[*\-•\d.)+]+\s*)/i, '')
        .trim();

    text = stripBooleanNoise(text);
    text = stripDatesFromText(text);

    // If after stripping dates the text is empty or junk, discard
    if (isJunkText(text)) return null;

    return text;
}

/**
 * Clean an entire pacts array from the AI response.
 */
function cleanPactsData(rawPacts: any[]): ParsedPactItem[] {
    if (!Array.isArray(rawPacts)) return [];

    const cleaned: ParsedPactItem[] = [];
    const seen = new Set<string>();

    for (const item of rawPacts) {
        const rawText = typeof item === 'string' ? item : item?.text || '';
        const subTasks: string[] = Array.isArray(item?.subTasks) ? item.subTasks : [];
        let phase = item?.phase || undefined;

        const text = cleanPactText(rawText);
        if (!text) continue;

        const lower = text.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);

        // If the phase itself is a date, strip it
        if (phase && typeof phase === 'string') {
            const cleanedPhase = stripDatesFromText(phase);
            phase = cleanedPhase && cleanedPhase.length >= 3 ? cleanedPhase : undefined;
        }

        // Clean sub-tasks with same pipeline
        const cleanedSubTasks = subTasks
            .map(st => {
                if (typeof st !== 'string') return '';
                let c = st.replace(/^[*\-•\d.)+]+\s*/, '').trim();
                c = stripBooleanNoise(c);
                c = stripDatesFromText(c);
                return c;
            })
            .filter(st => st.length >= 2 && !isJunkText(st));

        cleaned.push({
            text,
            subTasks: cleanedSubTasks,
            phase
        });
    }

    return cleaned;
}

const SYSTEM_INSTRUCTION = `You are Gyral's Routine Intelligence Engine. You deeply analyze workout plans, study schedules, discipline routines, and multi-phase transformation programs.

Your job: extract MEANINGFUL, ACTIONABLE items from the user's raw plan text. The user may paste output from ChatGPT, Claude, DeepSeek, or their own handwritten notes. Plans can span weeks or months.

RETURN ONLY valid raw JSON. No markdown, no code fences, no commentary.

JSON SCHEMA:
{
  "title": "Descriptive title (e.g. '12-Week Progressive Strength Program')",
  "duration": "Total timeframe (e.g. '3 Months', '12 Weeks')",
  "phases": [
    "Phase 1 (Weeks 1-4): Foundation & Form",
    "Phase 2 (Weeks 5-8): Progressive Overload"
  ],
  "pacts": [
    {
      "text": "Upper Body Push Workout",
      "phase": "Phase 1",
      "subTasks": ["Bench Press 4x10", "Incline DB Press 3x12", "Cable Flyes 3x15"]
    },
    {
      "text": "Lower Body Workout",
      "phase": "Phase 1",
      "subTasks": ["Squats 4x8", "Romanian Deadlifts 3x10", "Leg Press 3x12"]
    },
    {
      "text": "Evening 30-min Reading",
      "subTasks": []
    }
  ],
  "tasks": ["Water Intake (3L daily)", "Sleep 7+ Hours", "Morning Meditation"],
  "goals": ["Bench Press 100kg by Week 12", "Lose 5kg body fat"],
  "fullTimetableNote": "Complete formatted Markdown note with the full breakdown."
}

ABSOLUTELY CRITICAL RULES:

1. DATES ARE NOT PACTS! The input may contain lines like "12 Sept to 25 Sept: Push Ups" or "September 12 - October 3: Upper Body". The DATE RANGE is context/scheduling info, NOT the pact. The PACT is the ACTIVITY after the date — "Push Ups" or "Upper Body". NEVER put date ranges, date strings, day numbers, or month names as pact text. STRIP ALL DATES from pact text!

2. "WORKOUT: YES/NO" IS NOT A PACT! If the input says "Workout: Yes/No" or "Push Ups: Yes/No" or "Running: Done", the pact is the ACTIVITY NAME only — "Workout", "Push Ups", "Running". NEVER include Yes, No, Yes/No, Done, Completed, True, False, or any boolean/status text in pact text or sub-task text.

3. EXTRACT THE REAL ACTIVITY: If input says "12 Sept to 25 Sept - Bench Press, Squats, OHP", the pact should be "Strength Training" with sub-tasks ["Bench Press", "Squats", "OHP"]. If input says "Read 20 pages: Yes/No", the pact should be "Read 20 Pages".

4. DIFFERENT WORKOUT TYPES = DIFFERENT PACTS: Push Day, Pull Day, Leg Day, Cardio Day, etc. should be separate pacts with their exercises as sub-tasks.

5. PLAN TITLES ARE NOT PACTS: Don't extract "3 Month Transformation", "My Fitness Plan", "Routine", "Schedule" etc. as pacts.

6. SUB-TASKS: Extract specific exercises, book chapters, meal items, study topics as sub-tasks under the main pact.

7. TASKS vs PACTS: "tasks" = daily metrics to track (Water intake, Sleep, Steps). "pacts" = specific activities to DO.

8. PHASE TAGGING: If the plan has phases, weeks, or date-based periods, use them as phase tags on pacts but NEVER as pact text.

EXAMPLES OF CORRECT EXTRACTION:
Input: "12 Sept to 25 Sept: Push Ups, Bench Press, OHP"
→ pact: { "text": "Upper Body Push", "phase": "Sept 12-25", "subTasks": ["Push Ups", "Bench Press", "OHP"] }

Input: "Workout: Yes/No"
→ pact: { "text": "Daily Workout", "subTasks": [] }

Input: "Monday - Chest Day\n  - Bench Press 4x10\n  - Incline DB 3x12"
→ pact: { "text": "Chest Day Workout", "subTasks": ["Bench Press 4x10", "Incline DB 3x12"] }

Input: "Week 1-4: Light jogging 20 mins"
→ pact: { "text": "Light Jogging 20 mins", "phase": "Weeks 1-4", "subTasks": [] }`;

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
                ? `Analyze this timetable/routine image. Extract ONLY the ACTIVITIES and EXERCISES — strip all dates, day names, and boolean statuses. Additional context:\n${sanitizeLargeInput(text, 2000)}`
                : "Analyze this timetable/routine image. Extract ONLY the ACTIVITIES and EXERCISES — strip all dates, day names, and boolean statuses.";
            contents = [SYSTEM_INSTRUCTION, userPrompt, imagePart];
        } else {
            const sanitizedText = sanitizeLargeInput(text, 15000);
            contents = [
                SYSTEM_INSTRUCTION,
                `Here is the user's routine/plan. IMPORTANT: Lines like "12 Sept to 25 Sept: Push Ups" mean the PACT is "Push Ups" and the date range is just scheduling context. Extract ONLY the activities/exercises as pacts. Never put dates or "Yes/No" in pact text.\n\n---\n${sanitizedText}\n---`
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
                // Smart text extraction fallback — handles "date: activity" pattern
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
                    const indented = rawLine.startsWith('  ') || rawLine.startsWith('\t');

                    // Step 1: Strip bullet markers
                    let clean = rawLine.replace(/^[\s]*[*\-•\d.)+]+\s*/, '').trim();

                    // Step 2: Strip boolean noise
                    clean = stripBooleanNoise(clean);

                    // Step 3: Strip ALL date patterns
                    clean = stripDatesFromText(clean);

                    if (isJunkText(clean)) continue;

                    // Detect phase/week headers
                    if (/phase\s*\d+/i.test(clean) || /weeks?\s*\d+/i.test(clean)) {
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

                    // Detect habit trackers
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
                    pacts: pactsList.length > 0 ? pactsList.slice(0, 20) : [{ text: "Daily Workout", subTasks: [] }],
                    tasks: tasksList.length > 0 ? tasksList.slice(0, 8) : ["Daily Hydration Tracker"],
                    goals: goalsList.length > 0 ? goalsList.slice(0, 6) : ["Transformation Achievement"],
                    fullTimetableNote: text
                };
            } else {
                throw aiError;
            }
        }

        // Post-process: run ALL pacts through aggressive cleaning
        const cleanedPacts = cleanPactsData(parsedData?.pacts || []);

        // Also clean tasks and goals arrays
        const cleanedTasks = (Array.isArray(parsedData?.tasks) ? parsedData.tasks : [])
            .map((t: any) => typeof t === 'string' ? stripBooleanNoise(stripDatesFromText(t)).trim() : '')
            .filter((t: string) => t.length >= 3 && !isJunkText(t));

        const cleanedGoals = (Array.isArray(parsedData?.goals) ? parsedData.goals : [])
            .map((g: any) => typeof g === 'string' ? stripBooleanNoise(g).trim() : '')
            .filter((g: string) => g.length >= 3 && !isJunkText(g));

        return NextResponse.json({
            success: true,
            data: {
                title: parsedData?.title || "AI Routine & Timetable",
                duration: formatCompactDuration(parsedData?.duration),
                phases: Array.isArray(parsedData?.phases) ? parsedData.phases : [],
                pacts: cleanedPacts,
                tasks: cleanedTasks,
                goals: cleanedGoals,
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
