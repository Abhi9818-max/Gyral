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
    startDate?: string;
    endDate?: string;
}

const MONTH_MAP: { [key: string]: number } = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
};

export function extractDateRangeFromText(text: string, currentYear: number = new Date().getFullYear()): { startDate?: string; endDate?: string } | null {
    if (!text || typeof text !== 'string') return null;

    // Pattern 1: "12 Sept to 25 Sept", "12 September - 25 October"
    const matchA = text.match(/(\d{1,2})\s*([a-z]{3,9})\.?\s*(?:to|–|—|-|till|until|through)\s*(\d{1,2})\s*([a-z]{3,9})\.?/i);
    if (matchA) {
        const d1 = parseInt(matchA[1], 10);
        const m1 = MONTH_MAP[matchA[2].toLowerCase().replace(/\.$/, '')];
        const d2 = parseInt(matchA[3], 10);
        const m2 = MONTH_MAP[matchA[4].toLowerCase().replace(/\.$/, '')];

        if (m1 !== undefined && m2 !== undefined) {
            const startDate = `${currentYear}-${String(m1 + 1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
            const endDate = `${currentYear}-${String(m2 + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
            return { startDate, endDate };
        }
    }

    // Pattern 2: "Sept 12 to Oct 25", "September 12 - October 25"
    const matchB = text.match(/([a-z]{3,9})\.?\s*(\d{1,2})\s*(?:to|–|—|-|till|until|through)\s*([a-z]{3,9})\.?\s*(\d{1,2})/i);
    if (matchB) {
        const m1 = MONTH_MAP[matchB[1].toLowerCase().replace(/\.$/, '')];
        const d1 = parseInt(matchB[2], 10);
        const m2 = MONTH_MAP[matchB[3].toLowerCase().replace(/\.$/, '')];
        const d2 = parseInt(matchB[4], 10);

        if (m1 !== undefined && m2 !== undefined) {
            const startDate = `${currentYear}-${String(m1 + 1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
            const endDate = `${currentYear}-${String(m2 + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
            return { startDate, endDate };
        }
    }

    // Pattern 3: ISO dates "2026-09-12 to 2026-09-25"
    const matchC = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:to|–|—|-|till|until|through)\s*(\d{4}-\d{2}-\d{2})/i);
    if (matchC) {
        return { startDate: matchC[1], endDate: matchC[2] };
    }

    // Pattern 4: "12 Sept to 25th" (Same month)
    const matchD = text.match(/(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:to|–|—|-|till|until|through)\s*(\d{1,2})\s*(?:st|nd|rd|th)?\s*([a-z]{3,9})\.?/i);
    if (matchD) {
        const d1 = parseInt(matchD[1], 10);
        const d2 = parseInt(matchD[2], 10);
        const m = MONTH_MAP[matchD[3].toLowerCase().replace(/\.$/, '')];

        if (m !== undefined) {
            const startDate = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
            const endDate = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
            return { startDate, endDate };
        }
    }

    return null;
}

// ── Month names regex fragment ──
const MONTH_NAMES = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DAY_NAMES = '(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)';

/**
 * Sanitize user input for prompt injection. Allows up to 200K chars
 * to handle very large multi-month plans (Gemini 1.5/2.0 supports 1M token context).
 */
function sanitizeLargeInput(input: unknown, maxLength: number = 200000): string {
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

    // Just a bare number, bullet, or pure punctuation — but NOT "500ml" or "3×20" which have letters
    // Only discard if the text is purely digits/symbols with NO alphabetic characters
    if (/^[\d.)\-*•:;,|/\\]+\s*$/.test(t) && !/[a-zA-Z×xX]/.test(t)) return true;

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
 * 1. Strip labeled prefixes like "Pact 1:", "Task 2:", "Item 3:" but NOT leading quantity numbers
 * 2. Strip bullet markers (*, -, •) at the start ONLY
 * 3. Strip boolean noise
 * 4. Strip date patterns (ranges & singles)
 * 5. Check if result is junk → discard
 *
 * IMPORTANT: Do NOT strip leading numbers that are part of the content.
 * "50 jumping jacks" → keep as-is
 * "500ml water" → keep as-is
 * "3 eggs morning" → keep as-is
 * "15 pages" → keep as-is
 * Only strip: "1. Push-ups" (numbered list prefix) → "Push-ups"
 *             "• Push-ups" → "Push-ups"
 *             "- Push-ups" → "Push-ups"
 *             "Pact 1: Push-ups" → "Push-ups"
 */
function cleanPactText(raw: string): string | null {
    let text = raw
        // Strip labeled prefixes: "Pact 1:", "Task 2:", "Item 3:", "Step 4:"
        .replace(/^(Pact|Task|Item|Step)\s*\d+:\s*/i, '')
        // Strip bullet/symbol markers ONLY at the very start (*, -, •)
        .replace(/^[\s]*[*\-•]\s+/, '')
        // Strip numbered-list prefixes like "1. ", "2) ", "3. " but ONLY if the number is followed by a separator (. or ))
        // This avoids stripping "50 push-ups" or "500ml water"
        .replace(/^(\d{1,3})[.)]\s+/, '')
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
        let startDate = item?.startDate || undefined;
        let endDate = item?.endDate || undefined;

        // Auto-extract date range if missing from AI fields
        if (!startDate || !endDate) {
            const extracted = extractDateRangeFromText(rawText) || extractDateRangeFromText(item?.phase || '');
            if (extracted) {
                startDate = extracted.startDate;
                endDate = extracted.endDate;
            }
        }

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

        // Clean sub-tasks with same pipeline — preserve leading quantities
        const cleanedSubTasks = subTasks
            .map(st => {
                if (typeof st !== 'string') return '';
                // Strip only bullet/symbol markers and "Pact 1:" style prefixes, NOT leading quantities
                let c = st
                    .replace(/^(Pact|Task|Item|Step)\s*\d+:\s*/i, '')
                    .replace(/^[\s]*[*\-•]\s+/, '')
                    .replace(/^(\d{1,3})[.)]\s+/, '')
                    .trim();
                c = stripBooleanNoise(c);
                c = stripDatesFromText(c);
                return c;
            })
            .filter(st => st.length >= 2 && !isJunkText(st));

        cleaned.push({
            text,
            subTasks: cleanedSubTasks,
            phase,
            startDate,
            endDate
        });
    }

    return cleaned;
}

/**
 * Smart JSON parser that attempts to repair truncated JSON (common when AI outputs large 3-month plans)
 */
function tryParseOrRepairJson(rawStr: string): any {
    if (!rawStr || typeof rawStr !== 'string') return null;

    let text = rawStr.trim();
    if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    text = text.trim();

    try {
        return JSON.parse(text);
    } catch {
        // Attempt repair on truncated JSON
        let repaired = text;

        const firstBrace = repaired.indexOf('{');
        if (firstBrace !== -1) {
            repaired = repaired.slice(firstBrace);
        }

        // Close unclosed quote if odd number of quotes
        let inString = false;
        let escaped = false;
        for (let i = 0; i < repaired.length; i++) {
            const ch = repaired[i];
            if (ch === '\\' && !escaped) {
                escaped = true;
            } else {
                if (ch === '"' && !escaped) {
                    inString = !inString;
                }
                escaped = false;
            }
        }
        if (inString) {
            repaired += '"';
        }

        // Remove trailing comma before bracket or EOF
        repaired = repaired
            .replace(/,\s*([\}\]])/g, '$1')
            .replace(/,\s*$/, '');

        // Balance unclosed brackets
        const stack: string[] = [];
        inString = false;
        escaped = false;

        for (let i = 0; i < repaired.length; i++) {
            const ch = repaired[i];
            if (ch === '\\' && !escaped) {
                escaped = true;
                continue;
            }
            if (ch === '"' && !escaped) {
                inString = !inString;
            } else if (!inString) {
                if (ch === '{' || ch === '[') {
                    stack.push(ch);
                } else if (ch === '}') {
                    if (stack[stack.length - 1] === '{') stack.pop();
                } else if (ch === ']') {
                    if (stack[stack.length - 1] === '[') stack.pop();
                }
            }
            escaped = false;
        }

        while (stack.length > 0) {
            const open = stack.pop();
            if (open === '{') repaired += '}';
            else if (open === '[') repaired += ']';
        }

        try {
            return JSON.parse(repaired);
        } catch {
            return null;
        }
    }
}

const SYSTEM_INSTRUCTION = `You are Gyral's Routine Intelligence Engine. You read and extract EXACTLY what is written in the user's plan/document — nothing more, nothing less.

RETURN ONLY valid raw JSON. No markdown, no code fences, no commentary.

JSON SCHEMA:
{
  "title": "Short descriptive title taken from the document",
  "duration": "Total timeframe if mentioned (e.g. '3 Months', '12 Weeks'), or omit",
  "phases": ["Phase 1: Foundation", "Phase 2: Overload", "Phase 3: Peak"],
  "pacts": [
    {
      "text": "Morning workout",
      "phase": "Phase 1 (optional)",
      "startDate": "2026-09-12 (optional, ISO format)",
      "endDate": "2026-09-25 (optional, ISO format)",
      "subTasks": ["Push-ups 3×max", "Squats 3×20", "Plank 2×max hold", "Run 20 mins"]
    }
  ],
  "tasks": [],
  "goals": [],
  "fullTimetableNote": "Short executive summary under 80 words."
}

════════════ ABSOLUTELY CRITICAL RULES ════════════

RULE 1 — EXTRACT ONLY WHAT IS LITERALLY WRITTEN:
• ONLY extract pacts, tasks, and goals that are EXPLICITLY present in the document.
• NEVER invent, infer, or hallucinate pacts, tasks, or goals not written in the source.
• If the document has no habit trackers section, return tasks: []
• If the document has no goals section, return goals: []
• If a section heading (like "Morning workout", "Drink water", "Eat right", "Evening activity", "Read", "Skincare") is followed by indented sub-items, the HEADING becomes the pact text and the sub-items become its subTasks array.

RULE 2 — PRESERVE QUANTITIES EXACTLY:
• NEVER strip numbers, quantities, units from activity text.
• "500ml on wake" → keep as "500ml on wake" (not "ml on wake")
• "50 jumping jacks" → keep as "50 jumping jacks" (not "jumping jacks")
• "3 eggs morning" → keep as "3 eggs morning" (not "eggs morning")
• "15 pages — Art of Seduction" → keep as "15 pages — Art of Seduction"
• "Push-ups 3×max" → keep as "Push-ups 3×max"
• NEVER remove leading numbers unless they are pure list numbering like "1. " or "2. "

RULE 3 — DATES ARE SCHEDULING CONTEXT, NOT PACTS:
• Lines like "21 Sep — Mon" or "12 Sept to 25 Sept" are date headers, not pact names.
• Use dates to set startDate/endDate on the pact, but strip the date from the pact text itself.
• If a pact repeats across multiple dates in the document, include it ONCE with the earliest startDate and latest endDate.

RULE 4 — STRUCTURE PACTS CORRECTLY:
• Section headings with indented children → pact + subTasks
• "Morning workout" with bullets below → pact text = "Morning workout", subTasks = all the exercise lines
• "Drink water" with "500ml on wake, 500ml pre-lunch..." below → pact text = "Drink water", subTasks = ["500ml on wake", "500ml pre-lunch", "500ml afternoon", "500ml evening"]
• "Eat right" with food items → pact text = "Eat right", subTasks = ["3 eggs morning", "Dal before rice", "Max 1.5 cups rice", "No puris"]
• "Evening activity" with exercises → pact text = "Evening activity", subTasks = ["50 jumping jacks", "20 squats", "10 push-ups"]

RULE 5 — NO BOOLEAN/STATUS NOISE:
• Never include Yes, No, Yes/No, Done, Completed, True, False in any field.

RULE 6 — PLAN TITLES ARE NOT PACTS:
• Don't make "3 Month Transformation", "My Fitness Plan" a pact.

RULE 7 — fullTimetableNote MUST BE SHORT:
• Keep under 80 words total. Do NOT output a full timetable markdown in this field.`;


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
        const { text, imageBase64, fileBase64, fileMimeType } = body;

        const rawFile = fileBase64 || imageBase64;

        if (!text && !rawFile) {
            return NextResponse.json({ error: 'Provide text, PDF document, or routine image file.' }, { status: 400 });
        }

        let contents;
        if (rawFile) {
            const base64Data = rawFile.replace(/^data:[^;]+;base64,/, '');
            const mimeType = fileMimeType || rawFile.match(/^data:([^;]+);base64,/)?.[1] || 'image/png';

            const filePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            const isPdf = mimeType === 'application/pdf';
            const userPrompt = text
                ? `Extract ONLY what is literally written in this ${isPdf ? 'PDF document' : 'image'}. Follow all rules strictly: preserve all quantities (500ml, 50 jumping jacks, 3 eggs, 15 pages, etc.), use section headings as pact names with their sub-items as subTasks, return empty arrays for tasks and goals if not present in the document, never hallucinate pacts not shown. Additional context:\n${sanitizeLargeInput(text, 200000)}`
                : `Extract ONLY what is literally written in this ${isPdf ? 'PDF document' : 'image'}. Follow all rules strictly: preserve all quantities (500ml, 50 jumping jacks, 3 eggs, 15 pages, etc.), use section headings as pact names with their sub-items as subTasks, return empty arrays for tasks and goals if not present in the document, never hallucinate pacts not shown.`;
            contents = [SYSTEM_INSTRUCTION, userPrompt, filePart];
        } else {
            const sanitizedText = sanitizeLargeInput(text, 200000);
            contents = [
                SYSTEM_INSTRUCTION,
                `Extract ONLY what is literally written in the user's routine/plan below. Follow all rules strictly: preserve all quantities (500ml, 50 jumping jacks, etc.), use section headings as pact names, return empty arrays for tasks/goals if not present, never hallucinate.\n\n---\n${sanitizedText}\n---`
            ];
        }

        let parsedData: any = null;
        try {
            const { result } = await generateContentWithFallback(genAI, contents, {
                generationConfig: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 8192,
                }
            });

            const responseText = result.response.text();
            parsedData = tryParseOrRepairJson(responseText);

            if (!parsedData || !Array.isArray(parsedData.pacts)) {
                throw new Error("AI returned malformed or incomplete JSON structure.");
            }
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
                    phases: phasesList.length > 0 ? phasesList.slice(0, 10) : ["Phase 1: Foundation", "Phase 2: Progressive Overload", "Phase 3: Peak Performance"],
                    pacts: pactsList.length > 0 ? pactsList.slice(0, 100) : [{ text: "Daily Workout", subTasks: [] }],
                    tasks: tasksList.length > 0 ? tasksList.slice(0, 15) : ["Daily Hydration Tracker"],
                    goals: goalsList.length > 0 ? goalsList.slice(0, 10) : ["Transformation Achievement"],
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
