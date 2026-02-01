import { Record } from '@/context/user-data-context';
import { LUCIUS_DIALOGUES, LuciusState } from '@/data/lucius-dialogues';

export interface LuciusReflection {
    state: LuciusState;
    message: string;
    checkpoints: Checkpoint[];
    canActivateConsciousness: boolean;
}

export interface Checkpoint {
    day: string; // e.g., "Mon", "Tue"
    status: 'BOTH_ACTED' | 'USER_PAUSED' | 'USER_RETURNED';
    description: string;
}

// MEMORY SCOPE RULE: Lucius may only reference events from the last 30 days.
const MAX_MEMORY_DAYS = 30;

export function generateLuciusReflection(
    streak: number,
    consistency: number,
    userLogs: Record[] = [] // Default to empty array if not provided yet
): LuciusReflection {

    // 1. FILTER: Enforce Memory Scope (Last 30 Days)
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - MAX_MEMORY_DAYS));

    const recentLogs = userLogs.filter(log => {
        // guard against missing timestamp
        if (!log.timestamp) return false;
        const logDate = new Date(log.timestamp); // Assuming log.timestamp is string or number
        return logDate > cutoff;
    });

    // 2. OBSERVATION: Determine State
    // Real logic would be more complex diffing, but we respect the heuristic for now.
    let state: LuciusState = 'ALIGNED';
    let canActivateConsciousness = false;

    // Activation Logic for Consciousness (Chat)
    // Only opens if: Sustained inconsistency OR Silent drift.

    if (streak > 2 && consistency > 80) {
        state = 'ALIGNED';
        // Strong alignment spike could trigger it, but let's keep it rare.
    } else if (streak === 1) {
        state = 'RETURNING';
        canActivateConsciousness = true; // Post-recovery stabilization
    } else if (streak === 0 && consistency > 60) {
        state = 'DRIFTING';
        canActivateConsciousness = true; // Silent drift
    } else {
        state = 'DISTANT';
        canActivateConsciousness = true; // Sustained inconsistency
    }

    // 3. SELECT DIALOGUE (Fallback/Static)
    const dialogues = LUCIUS_DIALOGUES[state];
    const message = dialogues[Math.floor(Math.random() * dialogues.length)];

    // 4. MIRROR VISUALIZATION (Mocked sparse checkpoints for demo)
    // In a real implementation with full logs, we would iterate the last ~5 days
    // and compare (Did User act? Yes. Did Lucius act? Yes.)
    const checkpoints: Checkpoint[] = [];

    if (state === 'ALIGNED') {
        checkpoints.push(
            { day: 'T-2', status: 'BOTH_ACTED', description: 'We acted.' },
            { day: 'T-1', status: 'BOTH_ACTED', description: 'This is the habit.' },
            { day: 'T-0', status: 'BOTH_ACTED', description: 'We are one.' }
        );
    } else if (state === 'DRIFTING') {
        checkpoints.push(
            { day: 'T-2', status: 'BOTH_ACTED', description: 'We acted.' },
            { day: 'T-1', status: 'USER_PAUSED', description: 'You paused. I continued.' },
            { day: 'T-0', status: 'USER_PAUSED', description: 'The gap widens.' }
        );
    } else if (state === 'RETURNING') {
        checkpoints.push(
            { day: 'T-2', status: 'USER_PAUSED', description: 'You hesitated.' },
            { day: 'T-1', status: 'USER_PAUSED', description: 'I continued.' },
            { day: 'T-0', status: 'USER_RETURNED', description: 'You stand. We align.' }
        );
    } else { // DISTANT
        checkpoints.push(
            { day: 'T-2', status: 'USER_PAUSED', description: 'I walked.' },
            { day: 'T-1', status: 'USER_PAUSED', description: 'I walked.' },
            { day: 'T-0', status: 'USER_PAUSED', description: 'I remain here.' }
        );
    }

    return {
        state,
        message,
        checkpoints,
        canActivateConsciousness
    };
}
