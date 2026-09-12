"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { FilterBar } from "@/components/filter-bar";
import { TaskViews } from "@/components/task-views";
import { WeeklyProgress } from "@/components/weekly-progress";
import { HydrationWidget } from "@/components/hydration-widget";
import { VowWidget } from "@/components/vow-widget";
import { PactWidget } from "@/components/pacts-widget";
import { LongTermReminders } from "@/components/long-term-reminders";
import { ImportTimetableModal } from "@/components/modals/import-timetable-modal";
import { Sparkles, ArrowRight } from "lucide-react";

import { getQuoteOfTheDay, getSimpleQuoteOfTheDay } from "@/lib/quotes";
import { HomeModals } from "@/components/home-modals";
import { useUserData } from "@/context/user-data-context";

export default function Home() {
  const { hasAchievementToday, isLoaded } = useUserData();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const quote = getQuoteOfTheDay();
  const simpleQuote = getSimpleQuoteOfTheDay();
  
  const showPhilosophical = isLoaded && hasAchievementToday;
  const activeQuote = showPhilosophical ? quote : simpleQuote;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 pb-20 md:pb-8">
        <LongTermReminders />

        {/* AI Routine & Timetable Importer Banner */}
        <div 
          onClick={() => setIsImportModalOpen(true)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-zinc-900/80 border border-indigo-500/30 p-5 md:p-6 cursor-pointer group hover:border-indigo-500/60 transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
        >
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                  Import AI Timetable & Routine
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">ChatGPT / Claude / DeepSeek</span>
                </h3>
                <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
                  Paste your AI gym split or timetable text/screenshot to automatically import Pacts, Tasks, & Reference Notes into Gyral.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg group-hover:bg-indigo-500 transition-colors shrink-0 self-start sm:self-auto">
              <span>Import AI Routine</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="text-center py-6 md:py-8 max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-accent/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <blockquote className="relative z-10">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60 leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-[fadeInUp_1s_ease-out] px-4">
              &quot;{activeQuote.text}&quot;
            </p>
            <footer className="mt-4 flex items-center justify-end gap-3 opacity-0 animate-[fadeInUp_1s_ease-out_0.5s_forwards] px-4">
              <div className="h-[1px] w-8 md:w-12 bg-gradient-to-r from-transparent to-accent/50" />
              <cite className="not-italic text-xs md:text-sm text-muted-foreground font-medium tracking-wider">
                — {activeQuote.author}{activeQuote.source && <>, <span className="text-accent/80">{activeQuote.source}</span></>}
              </cite>
            </footer>
          </blockquote>
        </div>

        <div className="space-y-4 md:space-y-6">
          <PactWidget />
          <StatsCard />
          <FilterBar />
          <TaskViews />
        </div>

        <div className="pt-6 md:pt-8 space-y-6">
          <VowWidget />
          <HydrationWidget />
          <WeeklyProgress />
        </div>
      </main>

      <HomeModals />
      <ImportTimetableModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </div>
  );
}
