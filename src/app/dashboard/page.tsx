"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { FilterBar } from "@/components/filter-bar";
import { TaskViews } from "@/components/task-views";
import { WeeklyProgress } from "@/components/weekly-progress";
import { HydrationWidget } from "@/components/hydration-widget";
import { VowWidget } from "@/components/vow-widget";
import { PactWidget } from "@/components/pacts-widget";
import { LongTermReminders } from "@/components/long-term-reminders";
import { Sparkles, ArrowRight } from "lucide-react";

import { getQuoteOfTheDay, getSimpleQuoteOfTheDay } from "@/lib/quotes";
import { HomeModals } from "@/components/home-modals";
import { useUserData } from "@/context/user-data-context";

export default function Home() {
  const { hasAchievementToday, isLoaded } = useUserData();
  const quote = getQuoteOfTheDay();
  const simpleQuote = getSimpleQuoteOfTheDay();
  
  const showPhilosophical = isLoaded && hasAchievementToday;
  const activeQuote = showPhilosophical ? quote : simpleQuote;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 pb-20 md:pb-8">
        <div className="flex items-center justify-between gap-4">
          <LongTermReminders />

          {/* AI Timetable Synthesizer Shortcut Icon */}
          <Link
            href="/import-timetable"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-zinc-300 hover:text-white transition-all shadow-lg backdrop-blur-xl group shrink-0"
            title="Open AI Timetable & Routine Synthesizer Page"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="hidden sm:inline">AI Timetable Synthesizer</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        <div className="text-center py-4 md:py-6 max-w-4xl mx-auto relative group">
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
    </div>
  );
}
