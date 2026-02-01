
import { NextResponse } from 'next/server';
import { generateLuciusReflection } from '@/lib/lucius-core';

export async function POST(request: Request) {
    try {
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
