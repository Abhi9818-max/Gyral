"use client";

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Smartphone, CreditCard, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: string;
    description: string;
    onSuccess: () => void;
}

type PaymentTab = 'upi' | 'paypal' | 'demo';

function loadScript(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined') return resolve(false);
        
        // Check if already loaded
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src === src) return resolve(true);
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

const cleanAmountValue = (amountStr: string): number => {
    const num = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 500 : num; // fallback to 500 INR/Paise
};

export function PaymentModal({ isOpen, onClose, amount, description, onSuccess }: PaymentModalProps) {
    const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);

    const numericAmount = cleanAmountValue(amount);
    const usdAmount = (numericAmount / 80).toFixed(2); // Rough USD conversion

    useEffect(() => {
        if (!isOpen) {
            setSuccessPaymentId(null);
            setError(null);
            setActiveTab('upi');
        }
    }, [isOpen]);

    // PayPal Buttons Integration
    useEffect(() => {
        if (activeTab !== 'paypal' || !isOpen || successPaymentId) return;

        let isMounted = true;
        const clientId = typeof window !== 'undefined' ? (localStorage.getItem('diogenes-paypal-client-id') || 'sb') : 'sb';
        const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;

        const initPayPal = async () => {
            setIsLoading(true);
            setError(null);
            const loaded = await loadScript(sdkUrl);
            if (!isMounted) return;
            setIsLoading(false);

            if (loaded && (window as any).paypal) {
                const container = document.getElementById('paypal-button-container');
                if (container) container.innerHTML = '';

                try {
                    (window as any).paypal.Buttons({
                        createOrder: (data: any, actions: any) => {
                            return actions.order.create({
                                purchase_units: [{
                                    description: description,
                                    amount: {
                                        currency_code: 'USD',
                                        value: usdAmount
                                    }
                                }]
                            });
                        },
                        onApprove: async (data: any, actions: any) => {
                            const details = await actions.order.capture();
                            if (isMounted) {
                                handlePaymentSuccess(details.id || 'paypal_success_123');
                            }
                        },
                        onError: (err: any) => {
                            console.error("PayPal Error:", err);
                            if (isMounted) {
                                setError("PayPal transaction encountered an error. Try again or use Demo Checkout.");
                            }
                        }
                    }).render('#paypal-button-container');
                } catch (err) {
                    console.error("Failed to render PayPal buttons:", err);
                    if (isMounted) {
                        setError("Could not render PayPal Buttons. Verify your Client ID in Settings.");
                    }
                }
            } else {
                if (isMounted) {
                    setError("Failed to load PayPal Payment SDK.");
                }
            }
        };

        initPayPal();
        return () => {
            isMounted = false;
        };
    }, [activeTab, isOpen, successPaymentId, usdAmount, description]);

    const handlePaymentSuccess = (paymentId: string) => {
        setSuccessPaymentId(paymentId);
        
        // Confetti explosion!
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
        });

        // Delay closing and executing callback to allow visual satisfaction
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 2200);
    };

    // Razorpay Integration
    const handleRazorpayPayment = async () => {
        setIsLoading(true);
        setError(null);
        const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
        setIsLoading(false);

        if (!loaded) {
            setError("Failed to load Razorpay Checkout Script.");
            return;
        }

        const keyId = localStorage.getItem('diogenes-razorpay-key-id') || 'rzp_test_dummykey123';
        const options = {
            key: keyId,
            amount: numericAmount * 100, // Razorpay amount in paise (subunits)
            currency: "INR",
            name: "Gyral System",
            description: description,
            image: "/icons/icon-192.png",
            handler: function (response: any) {
                handlePaymentSuccess(response.razorpay_payment_id || 'rzp_pay_success_123');
            },
            prefill: {
                name: "Aspirant",
                email: "aspirant@gyral.io"
            },
            theme: {
                color: "#f59e0b" // Warm Amber
            },
            modal: {
                ondismiss: function () {
                    console.log("Razorpay Checkout dismissed.");
                }
            }
        };

        try {
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            console.error("Razorpay error:", err);
            setError("Failed to initialize Razorpay checkout. Check your settings Key ID.");
        }
    };

    // Demo / Sandbox instant payment
    const handleDemoPayment = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            handlePaymentSuccess(`demo_tx_${Math.random().toString(36).substr(2, 9)}`);
        }, 1200);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />

            {/* Content Card */}
            <div className="relative w-full max-w-md bg-zinc-950/80 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-[scaleIn_0.25s_ease-out] flex flex-col">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors p-1 z-10">
                    <X className="w-5 h-5" />
                </button>

                {successPaymentId ? (
                    // Success View
                    <div className="p-8 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px]">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-[bounce_1s_infinite]">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white tracking-wide">Pledge Settled</h3>
                            <p className="text-zinc-500 text-xs font-mono">Receipt ID: {successPaymentId}</p>
                        </div>
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl max-w-xs">
                            <p className="text-xs text-emerald-400 font-serif italic">
                                "The Iron Bank thanks you. Your account stands balanced and your honor is intact."
                            </p>
                        </div>
                    </div>
                ) : (
                    // Payment Selection View
                    <>
                        {/* Header Details */}
                        <div className="p-6 pb-4 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent flex flex-col items-center text-center">
                            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-3">
                                <ShieldCheck className="w-6 h-6 text-yellow-500" />
                            </div>
                            <h2 className="text-lg font-bold text-white tracking-wide">SECURE PAYMENT</h2>
                            <p className="text-zinc-500 text-xs mt-1 select-none max-w-[280px] line-clamp-1">{description}</p>
                            
                            {/* Amount Badge */}
                            <div className="mt-4 px-6 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex flex-col items-center">
                                <span className="text-xs font-mono tracking-wider text-yellow-500/60 uppercase">Amount Due</span>
                                <span className="text-2xl font-black text-yellow-500">{amount}</span>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex px-4 pt-3 gap-2 bg-black/40">
                            <button
                                onClick={() => { setActiveTab('upi'); setError(null); }}
                                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'upi' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                UPI / GPay
                            </button>
                            <button
                                onClick={() => { setActiveTab('paypal'); setError(null); }}
                                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'paypal' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <CreditCard className="w-3.5 h-3.5" />
                                PayPal
                            </button>
                            <button
                                onClick={() => { setActiveTab('demo'); setError(null); }}
                                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'demo' ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                                Demo
                            </button>
                        </div>

                        {/* Error Indicator */}
                        {error && (
                            <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 items-start">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-red-400 leading-normal">{error}</p>
                            </div>
                        )}

                        {/* Content Panel */}
                        <div className="p-6 flex-1 flex flex-col justify-center min-h-[180px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                                    <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                                    <span className="text-zinc-500 text-xs font-mono">Securing connection...</span>
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-300">
                                    {activeTab === 'upi' && (
                                        <div className="space-y-4 text-center">
                                            <p className="text-xs text-zinc-500 leading-relaxed px-4">
                                                Checkout instantly using UPI IDs, PhonePe, Google Pay, Netbanking, or local wallets via Razorpay.
                                            </p>
                                            <button
                                                onClick={handleRazorpayPayment}
                                                className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                                            >
                                                Pay via UPI / GPay
                                            </button>
                                        </div>
                                    )}

                                    {activeTab === 'paypal' && (
                                        <div className="space-y-4">
                                            <div className="text-center mb-2">
                                                <p className="text-xs text-zinc-500">
                                                    PayPal supports USD checkout. Converted stake: <span className="font-mono text-white">${usdAmount}</span>
                                                </p>
                                            </div>
                                            <div id="paypal-button-container" className="w-full max-h-[140px] overflow-y-auto" />
                                        </div>
                                    )}

                                    {activeTab === 'demo' && (
                                        <div className="space-y-4 text-center">
                                            <p className="text-xs text-zinc-500 leading-relaxed px-4">
                                                Test/sandbox checkout bypass. Use this to simulate a successful payment instantly.
                                            </p>
                                            <button
                                                onClick={handleDemoPayment}
                                                className="w-full py-3.5 bg-zinc-900 border border-zinc-700 hover:border-yellow-500/50 hover:bg-zinc-800 text-yellow-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                Execute Demo Payment
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer notice */}
                        <div className="p-4 text-center border-t border-white/5 bg-black/40 text-[9px] text-zinc-600 select-none font-mono">
                            SSL Encrypted 256-Bit • Powered by Razorpay & PayPal
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
