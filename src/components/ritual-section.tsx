"use client";

import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { RitualModal } from "@/components/modals/ritual-modal";

export function RitualSection() {
  const [showRitualButton, setShowRitualButton] = useState(false);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);

  useEffect(() => {
    // Check if we should show the ritual button
    const checkRitualButton = () => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastShown = localStorage.getItem('ritual_button_last_shown');

      if (lastShown !== today) {
        setShowRitualButton(true);
      }
    };

    checkRitualButton();
  }, []);

  const handleRitualClick = () => {
    setShowRitualButton(false);
    setIsRitualModalOpen(true);

    // Mark as shown for today
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ritual_button_last_shown', today);
  };

  const handleDismissRitual = () => {
    setShowRitualButton(false);

    // Mark as shown for today
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ritual_button_last_shown', today);
  };

  return (
    <>
      {showRitualButton && (
        <div className="relative">
          <div className="absolute inset-0 bg-orange-500/20 blur-3xl animate-pulse" />
          <div className="relative bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/30 rounded-2xl p-6 animate-in slide-in-from-top duration-700">
            <button
              onClick={handleDismissRitual}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all text-xs"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-50 animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl animate-[bounce_2s_ease-in-out_infinite]">
                  <Flame className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
                  Begin Your Daily Ritual
                </h3>
                <p className="text-sm md:text-base text-zinc-400">
                  Set your intentions for today. Define what matters.
                </p>
              </div>

              <button
                onClick={handleRitualClick}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 transition-all duration-300 hover:scale-105 animate-[pulse-slow_3s_ease-in-out_infinite]"
              >
                Start Ritual
              </button>
            </div>
          </div>
        </div>
      )}
      <RitualModal isOpen={isRitualModalOpen} onClose={() => setIsRitualModalOpen(false)} />
    </>
  );
}
