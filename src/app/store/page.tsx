"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Coins, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

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

export default function StorePage() {
    const router = useRouter();
    const { noxBalance, updateNoxBalance } = useUserData();
    const [purchasedItems, setPurchasedItems] = useState<Record<string, boolean>>({});
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleBuy = async (item: typeof STORE_ITEMS[0]) => {
        setErrorMsg(null);
        if (noxBalance < item.price) {
            setErrorMsg(`Not enough Nox for ${item.name}.`);
            return;
        }

        try {
            await updateNoxBalance(-item.price);
            setPurchasedItems(prev => ({ ...prev, [item.id]: true }));
            
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#eab308', '#f59e0b', '#d97706']
            });
            
            setTimeout(() => {
                setPurchasedItems(prev => ({ ...prev, [item.id]: false }));
            }, 3000);

        } catch (e) {
            console.error(e);
            setErrorMsg("Failed to process transaction.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-white/5 rounded-full border border-white/10 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
                    </button>
                    <div className="p-2 bg-indigo-900/20 rounded-full border border-indigo-700/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <Store className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">THE EXCHANGE</h1>
                        <p className="text-[10px] sm:text-xs text-indigo-400/80 font-serif italic">"Trade your sweat for power."</p>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] self-stretch sm:self-auto justify-between sm:justify-start">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Your Balance</span>
                    <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-500 animate-[pulse_2s_infinite]" />
                        <span className="text-base font-black text-amber-500 font-mono">{noxBalance} Nox</span>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-center gap-2 animate-[pulse_1s_ease-in-out]">
                    <span>⚠️</span> {errorMsg}
                </div>
            )}

            {/* Store Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STORE_ITEMS.map((item) => {
                    const isPurchased = purchasedItems[item.id];
                    const canAfford = noxBalance >= item.price;

                    return (
                        <div 
                            key={item.id} 
                            className={`relative flex flex-col bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-5 overflow-hidden group transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]`}
                        >
                            {/* Background glow */}
                            <div className="absolute -right-6 -top-6 text-8xl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500 pointer-events-none select-none">
                                {item.icon}
                            </div>

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="text-3xl bg-black/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/5 shadow-inner">
                                    {item.icon}
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                                    <span className="text-xs font-mono font-bold text-amber-400">{item.price}</span>
                                </div>
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-white mb-1.5 tracking-wide">{item.name}</h3>
                                <p className="text-xs sm:text-[13px] text-zinc-400 mb-5 leading-relaxed flex-1">
                                    {item.description}
                                </p>

                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={!canAfford || isPurchased}
                                    className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                                        isPurchased
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : canAfford
                                                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40'
                                                : 'bg-black/30 text-zinc-600 border border-white/5 cursor-not-allowed'
                                    }`}
                                >
                                    {isPurchased ? (
                                        <><CheckCircle2 className="w-4.5 h-4.5" /> Acquired</>
                                    ) : canAfford ? (
                                        <><Sparkles className="w-4.5 h-4.5" /> Purchase</>
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
    );
}
