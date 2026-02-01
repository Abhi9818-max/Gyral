"use client";

import { useState } from 'react';
import { X, Calendar, User } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';

interface OnboardingModalProps {
    isOpen: boolean;
}

export function OnboardingModal({ isOpen }: OnboardingModalProps) {
    const { completeOnboarding } = useUserData();
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!dateOfBirth) {
            alert('Please enter your date of birth');
            return;
        }

        setIsSubmitting(true);
        try {
            await completeOnboarding(dateOfBirth, gender);
        } catch (error) {
            console.error('Onboarding error:', error);
            alert('Failed to complete onboarding. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-950 border border-white/10 rounded-3xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in duration-300">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Diogenes</h2>
                    <p className="text-sm text-zinc-400">Let's personalize your experience</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date of Birth */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Date of Birth
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                                required
                            />
                        </div>
                        <p className="text-xs text-zinc-600 mt-2">Used for Memento Mori calculations</p>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-3">
                            Gender
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['male', 'female', 'other'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setGender(option)}
                                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all capitalize ${gender === option
                                            ? 'bg-accent/10 border-accent text-accent'
                                            : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-600 mt-2">For personalized profile avatar</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-accent to-purple-500 text-white font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Setting up...' : 'Get Started'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-xs text-center text-zinc-600 mt-6">
                    This information helps us personalize your experience and is stored securely.
                </p>
            </div>
        </div>
    );
}
