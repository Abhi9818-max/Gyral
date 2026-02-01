"use client";

import { useUserData } from "@/context/user-data-context";
import { Coins, Target, Clock, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { addHours } from "date-fns";

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InvestmentModal({ isOpen, onClose }: InvestmentModalProps) {
    const { addInvestment, investments, completeInvestment } = useUserData();
    const [amount, setAmount] = useState("5 Iron Bricks");
    const [goal, setGoal] = useState("3 Hours of Deep Focus");
    const [duration, setDuration] = useState("1"); // hours

    if (!isOpen) return null;

    const handleInvest = async () => {
        const deadline = addHours(new Date(), parseInt(duration)).toISOString();
        await addInvestment(amount, goal, deadline);
        onClose();
    };

    const activeInvestments = investments.filter(i => i.status === 'pending');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

            <div className="relative max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-8 md:p-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                            <Coins className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Iron Bank Investment</h2>
                            <p className="text-zinc-500 text-sm">Wager your honor on your output.</p>
                        </div>
                    </div>

                    {activeInvestments.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Active Contracts</h3>
                            {activeInvestments.map(inv => (
                                <div key={inv.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-white font-bold">{inv.goal}</p>
                                            <p className="text-zinc-500 text-xs mt-1">Staking: {inv.amount}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => completeInvestment(inv.id, true)}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => completeInvestment(inv.id, false)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                            >
                                                <Zap size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                        <Clock size={12} />
                                        <span>Deadline: {new Date(inv.deadline).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <label className="block space-y-2">
                                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">The Stake (Collateral)</span>
                                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
                                        {['5 Bricks', '10 Bricks', 'The Streak'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setAmount(opt)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${amount === opt ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">The Goal</span>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            value={goal}
                                            onChange={(e) => setGoal(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-colors"
                                            placeholder="What must be done?"
                                        />
                                    </div>
                                </label>

                                <label className="block space-y-2">
                                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Time Limit</span>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-yellow-500/50 transition-colors appearance-none"
                                    >
                                        <option value="1">1 Hour</option>
                                        <option value="2">2 Hours</option>
                                        <option value="4">4 Hours</option>
                                        <option value="8">8 Hours</option>
                                    </select>
                                </label>
                            </div>

                            <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Failure to meet this goal within the time limit will result in immediate seizure of your collateral by the Iron Bank.
                                </p>
                            </div>

                            <button
                                onClick={handleInvest}
                                className="w-full py-4 bg-yellow-500 text-black font-bold rounded-2xl hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
                            >
                                Sign the Contract
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 text-center border-t border-white/5 bg-zinc-950/50">
                    <button onClick={onClose} className="text-zinc-600 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                        Cancel Negotiation
                    </button>
                </div>
            </div>
        </div>
    );
}
