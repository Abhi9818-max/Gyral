"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, AlertTriangle, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { haptic } from '@/utils/haptic';
import { sfx } from '@/utils/sfx';

const parseDebtAmount = (amountStr: string): number => {
    const num = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 3 : num;
};

export default function BankPage() {
    const router = useRouter();
    const { debts, addDebt, payDebtAmount, noxBalance } = useUserData();
    
    // Confession states
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment states
    const [payNoxAmount, setPayNoxAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const [isPayInputVisible, setIsPayInputVisible] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) return;

        setIsSubmitting(true);
        try {
            await addDebt({ description, amount });
            setDescription('');
            setAmount('');
            sfx.playSuccess();
            haptic.medium();
        } catch (err) {
            console.error("Failed to add debt:", err);
            sfx.playError();
            haptic.error();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayDebtWithNox = async () => {
        setPayError(null);
        const amountToPay = parseFloat(payNoxAmount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            sfx.playError();
            haptic.error();
            setPayError('Please enter a valid amount.');
            return;
        }
        if (amountToPay > noxBalance) {
            sfx.playError();
            haptic.error();
            setPayError(`Insufficient balance. You only have ${noxBalance} Nox.`);
            return;
        }

        setIsPaying(true);
        try {
            await payDebtAmount(amountToPay);
            setPayNoxAmount('');
            setIsPayInputVisible(false);
            
            sfx.playSuccess();
            haptic.success();

            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#eab308', '#f59e0b', '#d97706']
            });
        } catch (e) {
            console.error(e);
            sfx.playError();
            haptic.error();
            setPayError('An error occurred during payment.');
        } finally {
            setIsPaying(false);
        }
    };

    const totalDebt = debts.reduce((sum, d) => sum + parseDebtAmount(d.amount), 0);
    const paidDebt = debts.filter(d => d.status === 'PAID').reduce((sum, d) => sum + parseDebtAmount(d.amount), 0);
    const remainingDebt = debts.filter(d => d.status === 'OWED').reduce((sum, d) => sum + parseDebtAmount(d.amount), 0);

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4 md:px-8 max-w-5xl mx-auto animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            sfx.playClick();
                            haptic.light();
                            router.push('/dashboard');
                        }}
                        className="p-2 hover:bg-white/5 rounded-full border border-white/10 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
                    </button>
                    <div className="p-2 bg-yellow-950/20 rounded-full border border-yellow-700/30 shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse">
                        <Coins className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">THE IRON BANK</h1>
                        <p className="text-[10px] sm:text-xs text-yellow-600 font-serif italic">"The Bank will have its due."</p>
                    </div>
                </div>

                <div className="bg-zinc-900/40 border border-white/5 px-4 py-2.5 rounded-2xl flex items-center gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] self-stretch sm:self-auto justify-between sm:justify-start">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Your Balance</span>
                    <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-base font-black text-yellow-500 font-mono">{noxBalance} Nox</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Stats and Confessions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Panel */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.01)] hover:border-white/10 transition-colors">
                            <span className="text-[9px] sm:text-xs text-zinc-500 uppercase font-mono tracking-wider block">Total Debt</span>
                            <span className="text-base sm:text-xl font-black text-white font-mono mt-1 block">{totalDebt} Nox</span>
                        </div>
                        <div className="bg-emerald-950/10 border border-emerald-900/20 p-4 rounded-2xl text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.01)] hover:border-emerald-900/40 transition-colors">
                            <span className="text-[9px] sm:text-xs text-emerald-500/70 uppercase font-mono tracking-wider block">Paid Debt</span>
                            <span className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-1 block">{paidDebt} Nox</span>
                        </div>
                        <div className="bg-rose-950/10 border border-rose-900/20 p-4 rounded-2xl text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.01)] hover:border-rose-900/40 transition-colors">
                            <span className="text-[9px] sm:text-xs text-rose-500/70 uppercase font-mono tracking-wider block">Remaining</span>
                            <span className="text-base sm:text-xl font-black text-rose-400 font-mono mt-1 block">{remainingDebt} Nox</span>
                        </div>
                    </div>

                    {/* Settle Debt Panel */}
                    {remainingDebt > 0 && (
                        <div className="bg-zinc-900/20 border border-yellow-900/30 p-5 rounded-2xl space-y-4 shadow-[0_4px_20px_rgba(234,179,8,0.03)]">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-yellow-600 uppercase tracking-widest font-mono flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Settle Outstanding Debt
                                </h3>
                            </div>
                            
                            {!isPayInputVisible ? (
                                <button
                                    onClick={() => setIsPayInputVisible(true)}
                                    className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.005] shadow-[0_0_20px_rgba(234,179,8,0.15)] text-sm uppercase tracking-wider"
                                >
                                    <Coins className="w-4 h-4 animate-pulse" /> Settle Debt with Nox
                                </button>
                            ) : (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min="1"
                                                max={noxBalance}
                                                value={payNoxAmount}
                                                onChange={(e) => {
                                                    setPayNoxAmount(e.target.value);
                                                    setPayError(null);
                                                }}
                                                placeholder="Enter Nox to pay..."
                                                className="w-full bg-black border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-700/50 text-sm font-mono"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono select-none">Nox</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handlePayDebtWithNox}
                                                disabled={!payNoxAmount || parseFloat(payNoxAmount) <= 0 || parseFloat(payNoxAmount) > noxBalance || isPaying}
                                                className="flex-1 sm:flex-initial px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
                                            >
                                                {isPaying ? 'Paying...' : 'Submit'}
                                            </button>
                                            <button 
                                                onClick={() => { setIsPayInputVisible(false); setPayNoxAmount(''); setPayError(null); }}
                                                className="px-4 py-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                    {payError && (
                                        <p className="text-xs text-red-400 font-mono">{payError}</p>
                                    )}
                                    <p className="text-[10px] text-zinc-500 leading-normal font-mono select-none">
                                        * Settle debts chronologically. 1 unit of outstanding debt requires 2 Nox to clear.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Confession Form */}
                    <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-orange-500">
                            <AlertTriangle className="w-5 h-5" />
                            <h2 className="text-sm font-bold uppercase tracking-widest">Confess Failure</h2>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Every broken vow, missed habit, or failed endeavor incurs a penalty. Confess your failure here to register the debt.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What did you fail to do? (e.g. Missed daily workout)"
                                className="w-full bg-black border border-zinc-800/80 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-700/50 transition-colors text-sm"
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Penalty Amount (e.g. 5)"
                                    className="flex-1 bg-black border border-zinc-800/80 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-700/50 transition-colors text-sm font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={!description || !amount || isSubmitting}
                                    className="w-full sm:w-auto px-6 py-3 bg-yellow-950/20 hover:bg-yellow-950/40 border border-yellow-800/40 text-yellow-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add Debt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Side: Account Ledger */}
                <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-2xl flex flex-col h-[500px] lg:h-auto max-h-[600px]">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className="w-5 h-5 text-yellow-600" />
                        <h2 className="text-sm font-bold uppercase tracking-widest">Account Ledger</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {debts.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center h-full">
                                <div className="inline-flex p-3.5 bg-zinc-950 border border-zinc-900 rounded-full mb-3 text-green-500">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <p className="text-zinc-500 text-sm font-bold">Your accounts are balanced.</p>
                                <p className="text-zinc-650 text-xs mt-1">No outstanding debt recorded.</p>
                            </div>
                        ) : (
                            [...debts].reverse().map((debt) => (
                                <div 
                                    key={debt.id} 
                                    className={`p-4 rounded-xl flex items-center justify-between gap-3 border transition-all ${
                                        debt.status === 'PAID'
                                            ? 'bg-emerald-950/5 border-emerald-900/10 hover:border-emerald-900/25'
                                            : 'bg-zinc-900/40 border-zinc-800/50 hover:border-rose-900/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.01)]'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${debt.status === 'PAID' ? 'text-zinc-500 line-through' : 'text-white'} break-words leading-relaxed`}>
                                            {debt.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-yellow-650 font-mono font-bold">{debt.amount} Nox</span>
                                            {debt.status === 'PAID' && (
                                                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider font-bold">Settled</span>
                                            )}
                                            {debt.status === 'OWED' && (
                                                <span className="text-[9px] bg-rose-500/10 text-rose-450 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider font-bold">Owed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
