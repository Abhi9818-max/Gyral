"use client";

import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { X, Coins, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { PaymentModal } from './payment-modal';

interface BankModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const parseDebtAmount = (amountStr: string): number => {
    const num = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 3 : num;
};

export function BankModal({ isOpen, onClose }: BankModalProps) {
    const { debts, addDebt, payDebt, payDebtAmount, noxBalance } = useUserData();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePayDebt, setActivePayDebt] = useState<{ id: string; amount: string; description: string } | null>(null);

    const [payNoxAmount, setPayNoxAmount] = useState('');
    const [isPaying, setIsPaying] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);
    const [isPayInputVisible, setIsPayInputVisible] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount) return;

        setIsSubmitting(true);
        await addDebt({ description, amount });
        setDescription('');
        setAmount('');
        setIsSubmitting(false);
    };

    const handlePayClick = (debt: any) => {
        setActivePayDebt({
            id: debt.id,
            amount: debt.amount,
            description: `Penalty settlement: "${debt.description}"`
        });
    };

    const handlePaymentSuccess = async () => {
        if (activePayDebt) {
            await payDebt(activePayDebt.id);
            setActivePayDebt(null);
        }
    };

    const handlePayDebtWithNox = async () => {
        setPayError(null);
        const amountToPay = parseFloat(payNoxAmount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            setPayError('Please enter a valid amount.');
            return;
        }
        if (amountToPay > noxBalance) {
            setPayError(`Insufficient balance. You only have ${noxBalance} Nox.`);
            return;
        }

        setIsPaying(true);
        try {
            await payDebtAmount(amountToPay);
            setPayNoxAmount('');
            setIsPayInputVisible(false);
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 }
            });
        } catch (e) {
            console.error(e);
            setPayError('An error occurred during payment.');
        } finally {
            setIsPaying(false);
        }
    };

    const totalDebt = debts.reduce((sum, d) => sum + parseDebtAmount(d.amount), 0);
    const paidDebt = debts.filter(d => d.status === 'PAID').reduce((sum, d) => sum + parseDebtAmount(d.amount), 0);
    const remainingDebt = debts.filter(d => d.status === 'OWED').reduce((sum, d) => sum + parseDebtAmount(d.amount), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-zinc-950 border border-yellow-900/40 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.1)] flex flex-col max-h-[90vh] overflow-hidden animate-[scaleIn_0.3s_ease-out]">

                {/* Header */}
                <div className="p-6 border-b border-yellow-900/20 flex justify-between items-center bg-gradient-to-r from-zinc-950 to-yellow-950/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-900/20 rounded-full border border-yellow-700/30">
                            <Coins className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">THE IRON BANK</h2>
                            <p className="text-xs text-yellow-600 font-serif italic">"The Bank will have its due."</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider">Your Balance</span>
                            <span className="text-sm font-black text-yellow-500 font-mono">{noxBalance} Nox</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">

                    {/* STATS PANEL */}
                    <div className="grid grid-cols-3 gap-3 shrink-0">
                        <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                            <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block">Total Debt</span>
                            <span className="text-sm font-bold text-white font-mono mt-1 block">{totalDebt} Nox</span>
                        </div>
                        <div className="bg-emerald-950/10 border border-emerald-900/20 p-3 rounded-xl text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                            <span className="text-[9px] text-emerald-500/70 uppercase font-mono tracking-wider block">Paid Debt</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">{paidDebt} Nox</span>
                        </div>
                        <div className="bg-rose-950/10 border border-rose-900/20 p-3 rounded-xl text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                            <span className="text-[9px] text-rose-500/70 uppercase font-mono tracking-wider block">Remaining</span>
                            <span className="text-sm font-bold text-rose-400 font-mono mt-1 block">{remainingDebt} Nox</span>
                        </div>
                    </div>

                    {/* CUSTOM NOX DEBT PAYMENT */}
                    {remainingDebt > 0 && (
                        <div className="shrink-0 space-y-3">
                            {!isPayInputVisible ? (
                                <button
                                    onClick={() => setIsPayInputVisible(true)}
                                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01] shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                >
                                    <Coins className="w-4 h-4 animate-pulse" /> Pay Debt
                                </button>
                            ) : (
                                <div className="bg-yellow-950/5 border border-yellow-900/20 p-4 rounded-xl space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.01)] animate-in fade-in slide-in-from-top duration-200">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-widest font-mono">Settle Outstanding Debt</h4>
                                        <button 
                                            onClick={() => { setIsPayInputVisible(false); setPayNoxAmount(''); setPayError(null); }}
                                            className="text-zinc-400 hover:text-white text-xs font-mono"
                                        >
                                            Cancel
                                        </button>
                                    </div>
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
                                                className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-4 pr-12 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-700/50 text-sm font-mono"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono select-none">Nox</span>
                                        </div>
                                        <button
                                            onClick={handlePayDebtWithNox}
                                            disabled={!payNoxAmount || parseFloat(payNoxAmount) <= 0 || parseFloat(payNoxAmount) > noxBalance || isPaying}
                                            className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
                                        >
                                            {isPaying ? 'Paying...' : 'Submit Payment'}
                                        </button>
                                    </div>
                                    {payError && (
                                        <p className="text-[10px] text-red-400 font-mono">{payError}</p>
                                    )}
                                    <p className="text-[9px] text-zinc-500 leading-normal font-mono select-none">
                                        * Settle debts chronologically. 1 unit of outstanding debt requires 2 Nox to clear.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CONFESSION FORM */}
                    <div className="space-y-4 shrink-0">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" /> Confess Failure
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="I failed to..."
                                className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-700/50 transition-colors"
                                autoFocus
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Price (Penalty)"
                                    className="flex-1 bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-700/50 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!description || !amount || isSubmitting}
                                    className="w-full sm:w-auto px-6 py-3 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/30 text-yellow-500 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Debt
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* LEDGER */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-600" /> Account Ledger
                        </h3>

                        <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {debts.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                                    <div className="inline-flex p-3 bg-zinc-900 rounded-full mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    </div>
                                    <p className="text-zinc-500 text-sm">Your accounts are balanced.</p>
                                </div>
                            ) : (
                                debts.map((debt) => (
                                    <div 
                                        key={debt.id} 
                                        className={`p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${
                                            debt.status === 'PAID'
                                                ? 'bg-emerald-950/5 border-emerald-900/10 hover:border-emerald-900/25'
                                                : 'bg-black/30 border-zinc-800 hover:border-red-900/50'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium ${debt.status === 'PAID' ? 'text-zinc-400 line-through' : 'text-white'} break-words`}>
                                                {debt.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-sm text-yellow-600 font-mono">{debt.amount}</span>
                                                {debt.status === 'PAID' && (
                                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Settled</span>
                                                )}
                                            </div>
                                        </div>
                                        {debt.status !== 'PAID' && (
                                            <button
                                                onClick={() => handlePayClick(debt)}
                                                className="px-3 py-2 text-xs font-bold bg-zinc-900 hover:bg-green-900/30 text-zinc-500 hover:text-green-500 border border-zinc-800 hover:border-green-800 rounded transition-all flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 self-end sm:self-auto shrink-0"
                                            >
                                                <Coins className="w-3.5 h-3.5" /> PAY DEBT
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <PaymentModal
                isOpen={activePayDebt !== null}
                onClose={() => setActivePayDebt(null)}
                amount={activePayDebt?.amount || '0'}
                description={activePayDebt?.description || ''}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
