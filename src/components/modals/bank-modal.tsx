"use client";

import { useState } from 'react';
import { X, Coins, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

interface BankModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BankModal({ isOpen, onClose }: BankModalProps) {
    const { debts, addDebt, payDebt } = useUserData();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handlePay = async (id: string) => {
        await payDebt(id);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-zinc-950 border border-yellow-900/40 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden animate-[scaleIn_0.3s_ease-out]">

                {/* Header */}
                <div className="p-6 border-b border-yellow-900/20 flex justify-between items-center bg-gradient-to-r from-zinc-950 to-yellow-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-900/20 rounded-full border border-yellow-700/30">
                            <Coins className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">THE IRON BANK</h2>
                            <p className="text-xs text-yellow-600 font-serif italic">"The Bank will have its due."</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* CONFESSION FORM */}
                    <div className="space-y-4">
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
                            <div className="flex gap-2">
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
                                    className="px-6 py-3 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/30 text-yellow-500 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Debt
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* LEDGER */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Coins className="w-4 h-4 text-yellow-600" /> Outstanding Debts
                        </h3>

                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {debts.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                                    <div className="inline-flex p-3 bg-zinc-900 rounded-full mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    </div>
                                    <p className="text-zinc-500 text-sm">Your accounts are balanced.</p>
                                </div>
                            ) : (
                                debts.map((debt) => (
                                    <div key={debt.id} className="group bg-black/30 border border-zinc-800 hover:border-red-900/50 p-4 rounded-lg flex items-center justify-between transition-colors">
                                        <div>
                                            <p className="font-medium text-white">{debt.description}</p>
                                            <p className="text-sm text-yellow-600 font-mono mt-0.5">{debt.amount}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePay(debt.id)}
                                            className="px-3 py-1.5 text-xs font-bold bg-zinc-900 hover:bg-green-900/30 text-zinc-500 hover:text-green-500 border border-zinc-800 hover:border-green-800 rounded transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                        >
                                            <Coins className="w-3 h-3" /> PAY DEBT
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
