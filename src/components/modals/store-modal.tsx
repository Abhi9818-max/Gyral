"use client";

import { useState } from 'react';
import { X, Store, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

interface StoreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STORE_ITEMS = [
    { id: 'freeze', name: 'Streak Freeze', description: 'Protects your streaks for one day if you miss your tasks.', price: 30, icon: '❄️', color: 'from-blue-500/20 to-cyan-500/5', border: 'border-blue-500/30' },
    { id: 'elixir', name: 'Elixir of Clarity', description: 'Automatically pays off up to 10 Nox of outstanding Iron Bank debt.', price: 50, icon: '🧪', color: 'from-emerald-500/20 to-green-500/5', border: 'border-emerald-500/30' },
    { id: 'chronos', name: 'Chronos Watch', description: 'Allows logging a task for yesterday if you forgot.', price: 80, icon: '⏳', color: 'from-amber-500/20 to-orange-500/5', border: 'border-amber-500/30' },
    { id: 'resurrect', name: 'Resurrection Scroll', description: 'Restores a recently broken streak.', price: 100, icon: '📜', color: 'from-rose-500/20 to-red-500/5', border: 'border-rose-500/30' },
    { id: 'ticket', name: 'Golden Ticket', description: 'A free pass to skip all tasks for a day without penalty.', price: 150, icon: '🎫', color: 'from-yellow-500/20 to-amber-500/5', border: 'border-yellow-500/30' },
    { id: 'avatar', name: 'Mystic Avatar', description: 'Unlocks a special profile avatar frame.', price: 200, icon: '🔮', color: 'from-purple-500/20 to-fuchsia-500/5', border: 'border-purple-500/30' },
    { id: 'banner', name: 'House Banner', description: 'Unlocks an exclusive banner for your current House faction.', price: 300, icon: '🚩', color: 'from-red-600/20 to-rose-700/5', border: 'border-red-600/30' },
    { id: 'title', name: 'Royal Title', description: 'Adds a prestigious title to your profile name.', price: 500, icon: '👑', color: 'from-yellow-400/20 to-yellow-600/5', border: 'border-yellow-400/30' },
];

export function StoreModal({ isOpen, onClose }: StoreModalProps) {
    const { noxBalance, updateNoxBalance } = useUserData();
    const [purchasedItems, setPurchasedItems] = useState<Record<string, boolean>>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleBuy = async (item: typeof STORE_ITEMS[0]) => {
        setErrorMsg(null);
        if (noxBalance < item.price) {
            setErrorMsg(`Not enough Nox for ${item.name}.`);
            return;
        }

        try {
            // Deduct the price
            await updateNoxBalance(-item.price);
            
            // Mark as purchased
            setPurchasedItems(prev => ({ ...prev, [item.id]: true }));
            
            // Confetti
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#eab308', '#f59e0b', '#d97706']
            });
            
            // Clear purchase state after 3 seconds so they can buy again if they want
            setTimeout(() => {
                setPurchasedItems(prev => ({ ...prev, [item.id]: false }));
            }, 3000);

        } catch (e) {
            console.error(e);
            setErrorMsg("Failed to process transaction.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-[95%] sm:w-full max-w-4xl bg-zinc-950 border border-indigo-900/40 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.1)] flex flex-col max-h-[90vh] overflow-hidden animate-[scaleIn_0.3s_ease-out]">

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-indigo-900/20 flex justify-between items-center bg-gradient-to-r from-zinc-950 to-indigo-950/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-900/20 rounded-full border border-indigo-700/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            <Store className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">THE EXCHANGE</h2>
                            <p className="text-[10px] sm:text-xs text-indigo-400/80 font-serif italic">"Trade your sweat for power."</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider">Your Balance</span>
                            <div className="flex items-center gap-1.5 justify-end">
                                <Coins className="w-4 h-4 text-amber-500 animate-[pulse_2s_infinite]" />
                                <span className="text-sm font-black text-amber-500 font-mono">{noxBalance} Nox</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs sm:text-sm flex items-center justify-center gap-2 animate-[pulse_1s_ease-in-out]">
                            <span className="text-lg sm:text-xl">⚠️</span> {errorMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {STORE_ITEMS.map((item) => {
                            const isPurchased = purchasedItems[item.id];
                            const canAfford = noxBalance >= item.price;

                            return (
                                <div 
                                    key={item.id} 
                                    className={`relative flex flex-col bg-gradient-to-br ${item.color} border ${item.border} rounded-xl p-4 overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]`}
                                >
                                    {/* Background glow */}
                                    <div className="absolute -right-6 -top-6 text-7xl opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500 pointer-events-none">
                                        {item.icon}
                                    </div>

                                    <div className="flex items-start justify-between mb-3 relative z-10">
                                        <div className="text-3xl bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5 shadow-inner">
                                            {item.icon}
                                        </div>
                                        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/10">
                                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-xs font-mono font-bold text-amber-400">{item.price}</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <h3 className="text-base font-bold text-white mb-1 tracking-wide">{item.name}</h3>
                                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed flex-1">
                                            {item.description}
                                        </p>

                                        <button
                                            onClick={() => handleBuy(item)}
                                            disabled={!canAfford || isPurchased}
                                            className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                                                isPurchased
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : canAfford
                                                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40'
                                                        : 'bg-black/30 text-zinc-600 border border-white/5 cursor-not-allowed'
                                            }`}
                                        >
                                            {isPurchased ? (
                                                <><CheckCircle2 className="w-4 h-4" /> Acquired</>
                                            ) : canAfford ? (
                                                <><Sparkles className="w-4 h-4" /> Purchase</>
                                            ) : (
                                                <>Not Enough Nox</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
