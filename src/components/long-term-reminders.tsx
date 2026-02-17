"use client";

import { useUserData } from "@/context/user-data-context";
import { useEffect, useState } from "react";
import { Clock, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LongTermReminders() {
    const { pacts } = useUserData();
    const [reminders, setReminders] = useState<any[]>([]);

    useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const newReminders: any[] = [];

        Object.entries(pacts).forEach(([dateStr, dayPacts]) => {
            // Must be in the future
            if (dateStr <= todayStr) return;

            dayPacts.forEach(pact => {
                // Must have createdAt to calculate progress
                if (!pact.createdAt) return;

                const targetDate = new Date(dateStr);
                const createdDate = new Date(pact.createdAt);

                // Calculate Total Duration (ms)
                const totalDuration = targetDate.getTime() - createdDate.getTime();
                const totalDays = totalDuration / (1000 * 60 * 60 * 24);

                // Only consider "Long Term" tasks (set > 4 days in advance)
                if (totalDays <= 4) return;

                // Calculate Elapsed Time
                const elapsed = today.getTime() - createdDate.getTime();
                const progress = elapsed / totalDuration; // 0 to 1

                const daysRemaining = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

                let reminderType = null;
                let message = "";

                // Milestone Logic
                // 1. ~25% Elapsed (75% Remaining) - "Just Started / Early"
                // Range: 20% - 30%
                if (progress >= 0.20 && progress <= 0.30) {
                    reminderType = "early";
                    message = "A gentle nudge. You set this a while ago.";
                }
                // 2. ~50% Elapsed - "Halfway"
                // Range: 45% - 55%
                else if (progress >= 0.45 && progress <= 0.55) {
                    reminderType = "halfway";
                    message = "Halfway to the deadline. precise.";
                }
                // 3. ~75% Elapsed - "Closing In"
                // Range: 70% - 80%
                else if (progress >= 0.70 && progress <= 0.80) {
                    reminderType = "late";
                    message = "The horizon is approaching.";
                }
                // 4. One Day Before
                else if (daysRemaining <= 1.5 && daysRemaining > 0.5) {
                    reminderType = "tomorrow";
                    message = "Tomorrow is the day.";
                }

                if (reminderType) {
                    newReminders.push({
                        ...pact,
                        date: dateStr,
                        daysRemaining: Math.ceil(daysRemaining),
                        progress,
                        reminderType,
                        message
                    });
                }
            });
        });

        // Limit to maybe 1 or 2 reminders to not clutter?
        // Let's show all unique applicable ones but unique by day+pact?
        setReminders(newReminders);
    }, [pacts]);

    if (reminders.length === 0) return null;

    return (
        <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
            {reminders.map((r, i) => (
                <div key={`${r.id}-${i}`} className="bg-gradient-to-r from-blue-900/10 to-transparent border-l-2 border-blue-500 p-4 rounded-r-xl backdrop-blur-sm relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />

                    <div className="flex items-start gap-4 relative z-10">
                        <div className="bg-blue-500/20 p-2 rounded-full">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-bold text-blue-200 uppercase tracking-wider">
                                    {r.reminderType === 'tomorrow' ? 'Prepare Yourself' : 'Gentle Reminder'}
                                </h4>
                                <span className="text-xs text-blue-400/60 font-mono">
                                    {r.daysRemaining} days left
                                </span>
                            </div>
                            <p className="text-white font-medium text-lg leading-tight mb-1">
                                {r.text}
                            </p>
                            <p className="text-sm text-blue-300/70 italic">
                                "{r.message}"
                            </p>

                            {/* Progress Bar */}
                            <div className="mt-3 h-1 w-full bg-blue-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 shadow-[0_0_10px_currentColor]"
                                    style={{ width: `${Math.min(r.progress * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="self-center">
                            <Link href="/citadel?date=${r.date}" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <ArrowRight className="w-5 h-5 text-zinc-400 hover:text-white" />
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
