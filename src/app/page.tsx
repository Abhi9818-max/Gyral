import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { FilterBar } from "@/components/filter-bar";
import { Heatmap } from "@/components/heatmap";
import { WeeklyProgress } from "@/components/weekly-progress";
import { HydrationWidget } from "@/components/hydration-widget";
import { VowWidget } from "@/components/vow-widget";
import { LongTermReminders } from "@/components/long-term-reminders";
import { RitualSection } from "@/components/ritual-section";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { HomeModals } from "@/components/home-modals";

export default function Home() {
  const quote = getQuoteOfTheDay();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 pb-20 md:pb-8">
        <LongTermReminders />

        <RitualSection />

        <div className="text-center py-8 md:py-12 max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-accent/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <blockquote className="relative z-10">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60 leading-relaxed drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-[fadeInUp_1s_ease-out] px-4">
              &quot;{quote.text}&quot;
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
