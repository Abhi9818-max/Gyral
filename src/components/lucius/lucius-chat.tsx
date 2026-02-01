"use client";

import { useState, useRef, useEffect } from 'react';
import { Ghost, Send } from 'lucide-react';

interface Message {
    role: 'user' | 'lucius';
    text: string;
}

interface LuciusChatProps {
    initialHistory: Message[];
    onSendMessage: (message: string) => Promise<void>;
    isLocked: boolean;
    turnsLeft: number;
    onClose: () => void;
}

export function LuciusChat({ initialHistory, onSendMessage, isLocked, turnsLeft, onClose }: LuciusChatProps) {
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [initialHistory, isSending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLocked || isSending || turnsLeft <= 0) return;

        const message = input;
        setInput("");
        setIsSending(true);
        await onSendMessage(message);
        setIsSending(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col h-[60vh] md:h-[500px] relative lucius-enter-active">

            {/* Header / Context */}
            <div className="absolute -top-12 left-0 right-0 text-center opacity-50">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    Communion ({turnsLeft} turns remaining)
                </span>
            </div>

            {/* Script / Dialogue Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-8 py-8">
                {initialHistory.length === 0 && (
                    <div className="text-center text-white/10 text-sm italic pt-20">
                        The void listens.
                    </div>
                )}

                {initialHistory.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} lucius-enter-active`}
                    >
                        <span className="text-[10px] uppercase tracking-widest mb-1 text-white/20 select-none">
                            {msg.role === 'user' ? 'You' : 'Lucius'}
                        </span>
                        <div
                            className={`max-w-[85%] text-lg md:text-xl leading-relaxed ${msg.role === 'lucius'
                                    ? 'font-serif italic text-[var(--lucius-text-primary)] text-left'
                                    : 'font-mono text-[var(--lucius-text-muted)] text-right'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isSending && (
                    <div className="flex flex-col items-end lucius-enter-active">
                        <span className="text-[10px] uppercase tracking-widest mb-1 text-white/20">You</span>
                        <div className="text-lg md:text-xl font-mono text-white/30 animate-pulse">...</div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="mt-4 relative group">
                <div className={`absolute inset-0 bg-gradient-to-t from-[var(--lucius-void-900)] to-transparent -top-20 pointer-events-none`} />

                <form onSubmit={handleSubmit} className="relative z-10 flex items-center gap-4 border-t border-white/5 pt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors px-2"
                    >
                        End
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isLocked ? "Silence falls..." : "Speak your truth..."}
                            disabled={isLocked || isSending || turnsLeft <= 0}
                            className="w-full bg-transparent border-none text-lg md:text-xl font-serif italic text-white/80 placeholder:text-white/10 focus:ring-0 focus:outline-none py-2 px-0"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!input.trim() || isLocked || isSending}
                        className="text-white/40 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
