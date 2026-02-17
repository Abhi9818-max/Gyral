
"use client";

import { useUserData, Vow } from "@/context/user-data-context";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function VowWidget() {
    const { vows, completeVowDaily } = useUserData();

    // Filter active vows
    const activeVows = vows.filter(v => v.status === 'active');

    if (activeVows.length === 0) return null;

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800/50 rounded-xl p-4 md:p-6 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl relative overflow-hidden group">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] bg-indigo-500/10 pointer-events-none" />

            <div className="flex items-center justify-between relative z-10 mb-2">
                <h3 className="text-base md:text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    The Watch
                </h3>
            </div>

            <div className="space-y-3 relative z-10">
                {activeVows.map(vow => {
                    const isCompletedToday = vow.lastCompletedDate === today;

                    return (
                        <div key={vow.id} className="bg-black/40 rounded-lg p-3 border border-white/5 flex items-center justify-between group/vow hover:border-indigo-500/30 transition-colors">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className={`text-sm font-medium truncate transition-colors ${isCompletedToday ? "text-slate-400 line-through" : "text-slate-200"}`}>
                                    {vow.text}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                        Streak: <span className="text-indigo-400">{vow.currentStreak} Days</span>
                                    </div>
                                    {isCompletedToday && (
                                        <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                                            <CheckCircle className="w-3 h-3" /> Done
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => !isCompletedToday && completeVowDaily(vow.id)}
                                disabled={isCompletedToday}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isCompletedToday
                                    ? "bg-green-500/20 text-green-500 cursor-default"
                                    : "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white"
                                    }`}
                            >
                                {isCompletedToday ? <CheckCircle className="w-5 h-5" /> : <Shield className="w-4 h-4" />}
                            </button>
                        </div>
                    );
                })}
            </div>

            {activeVows.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-sm">
                    No active vows. Your watch has ended... for now.
                </div>
            )}
        </div>
    );
}
