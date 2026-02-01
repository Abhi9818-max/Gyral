"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { FilterBar } from "@/components/filter-bar";
import { Heatmap } from "@/components/heatmap";
import { WeeklyProgress } from "@/components/weekly-progress";
import { StreakSuccessModal } from "@/components/modals/streak-success-modal";
import { StreakLossModal } from "@/components/modals/streak-loss-modal";
import { RitualModal } from "@/components/modals/ritual-modal";
import { Flame } from "lucide-react";
import { getQuoteOfTheDay } from "@/lib/quotes";

export default function Home() {
  const [showRitualButton, setShowRitualButton] = useState(false);
  const quote = getQuoteOfTheDay();
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 pb-20 md:pb-8">
        {/* Daily Ritual Button */}
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

        {/* Quote of the Day */}
        <div className="text-center py-8 md:py-12 max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-accent/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <blockquote className="relative z-10">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60 leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-[fadeInUp_1s_ease-out] px-4">
              "{quote.text}"
            </p>
            <footer className="mt-4 flex items-center justify-end gap-3 opacity-0 animate-[fadeInUp_1s_ease-out_0.5s_forwards] px-4">
              <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent to-accent/50" />
              <cite className="not-italic text-xs md:text-sm text-muted-foreground font-medium tracking-wider">
                — {quote.author}{quote.source && <>, <span className="text-accent/80">{quote.source}</span></>}
              </cite>
            </footer>
          </blockquote>
        </div>

        <div className="space-y-4 md:space-y-6">
          <StatsCard />
          <FilterBar />
          <Heatmap />
        </div>

        <div className="pt-6 md:pt-8">
          <WeeklyProgress />
        </div>
      </main>

      <StreakSuccessModal />
      <StreakLossModal />
      <RitualModal isOpen={isRitualModalOpen} onClose={() => setIsRitualModalOpen(false)} />
    </div>
  );
}
