"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LayoutDashboard, Users, Shield, ScrollText, ClipboardList, Flag, Settings, Plus, Flame, Globe, Ghost, Skull, Coins, Menu, X, Search, MessageCircle, Bell, Sword, Home, User, Brain, Trophy } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createClient } from '@/utils/supabase/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Sigil } from './sigil';
import { AddTaskModal } from './modals/add-task-modal';
import { PactsModal } from './modals/pacts-modal';
import { BankModal } from './modals/bank-modal';
import { NightsWatchModal } from './modals/nights-watch-modal';
import { SearchModal } from './modals/search-modal';
import { DailyReviewModal } from './modals/daily-review-modal';
import { FriendRequestsModal } from './modals/friend-requests-modal';
import { getUserAvatar } from '@/utils/avatar-helpers';
import { useMessageNotifications } from '@/context/message-notification-context';

import { FactionPickerModal } from './modals/faction-picker-modal';
import { StoreModal } from './modals/store-modal';

import { InvestmentModal } from './modals/investment-modal';

export function Header() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPactsModalOpen, setIsPactsModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDailyReviewModalOpen, setIsDailyReviewModalOpen] = useState(false);
  const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState(false);
  const [isFactionModalOpen, setIsFactionModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { consistencyScore, currentStreak, streakStatus, streakTier, streakStrength, activeFilterTaskId, tasks, currentFaction, user, profile, noxBalance } = useUserData();
  const { unreadCount, friendRequestCount } = useMessageNotifications();
  const router = useRouter();

  // Smart Header Logic
  const pathname = usePathname();
  const isHome = pathname === '/dashboard';
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show if near top or scrolling up
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false); // Hide
      } else {
        setIsVisible(true); // Show
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getFlameColor = () => {
    if (currentStreak === 0) return "text-zinc-600";
    if (streakStrength >= 30) return "text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]"; // Relentless
    if (streakStrength >= 15) return "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"; // Strong
    if (streakStrength >= 5) return "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"; // Normal
    return "text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]"; // Weak/Spark
  };

  // Easter Egg Listener
  useEffect(() => {
    const handleOpenDailyReview = () => setIsDailyReviewModalOpen(true);
    window.addEventListener('openDailyReview', handleOpenDailyReview);
    return () => window.removeEventListener('openDailyReview', handleOpenDailyReview);
  }, []);

  const getFlameAnimation = () => {
    if (streakStatus === 'at-risk') return "animate-[flicker_2s_ease-in-out_infinite]";
    if (streakStatus === 'safe' && currentStreak > 0) return "animate-[pulse-slow_4s_ease-in-out_infinite]";
    if (streakTier === 'committed') return "animate-[blue-pulse_3s_ease-in-out_infinite]";
    return "";
  };

  const getStrengthLabel = () => {
    if (currentStreak === 0) return "";
    if (streakStrength >= 30) return "RELENTLESS";
    if (streakStrength >= 15) return "STRONG";
    if (streakStrength >= 5) return "NORMAL";
    return "WEAK";
  };

  const activeTask = activeFilterTaskId ? tasks.find(t => t.id === activeFilterTaskId) : null;

  const getTooltipText = () => {
    const contextLabel = activeTask ? ` • ${activeTask.name}` : "";
    if (currentStreak === 0) return "Start a streak today.";
    if (streakStatus === 'at-risk') return `Day ${currentStreak}${contextLabel}. Risk imminent.`;
    return `Day ${currentStreak}${contextLabel} • Heat: ${streakStrength.toFixed(1)} (${getStrengthLabel()})`;
  };

  return (
    <>
      <header className={`${isHome ? 'flex' : 'hidden md:flex'} items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-black/90 backdrop-blur-3xl fixed top-0 w-full z-50 shadow-[0_4px_30px_rgba(0,0,0,0.8)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="flex items-center relative group cursor-pointer">
          <Link href="/dashboard" className="relative flex items-center">
            <span className="text-lg md:text-2xl font-light tracking-[0.4em] text-white/90 hover:text-white transition-all duration-500 uppercase">
              GYRAL
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Streak Indicator - Always Visible */}
          <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-white/5 border border-white/10 relative group cursor-help hover:border-white/20 transition-colors">
            <Flame
              className={`w-3 h-3 md:w-4 md:h-4 transition-all duration-500 ${getFlameColor()} ${getFlameAnimation()}`}
              fill={currentStreak > 0 ? "currentColor" : "none"}
            />
            <span className={`text-xs md:text-sm font-bold font-mono ${currentStreak > 0 ? 'text-white' : 'text-muted-foreground'}`}>
              {currentStreak}
            </span>
            {currentStreak > 0 && (
              <span className="hidden sm:inline text-[10px] font-bold text-muted-foreground ml-1 border-l border-white/10 pl-2 uppercase tracking-wider">
                {getStrengthLabel()}
              </span>
            )}
            <div className="absolute top-full right-0 mt-2 bg-black border border-white/20 text-xs text-white px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              {getTooltipText()}
            </div>
          </div>

          {/* Nox Balance Indicator - Always Visible */}
          <div 
            onClick={() => router.push('/bank')}
            className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/35 transition-colors cursor-pointer group select-none"
            title="Nox Balance (Iron Bank)"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 animate-[pulse_2s_infinite]" />
            <span className="text-xs md:text-sm font-bold font-mono text-amber-400">
              {noxBalance} Nox
            </span>
          </div>

          {/* Universal Menu Button */}
          <button
            className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/20 relative ${currentFaction ? 'p-1' : ''}`}
            onClick={() => {
              const menuDiv = document.createElement('div');
              menuDiv.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] animate-in fade-in duration-200';
              menuDiv.innerHTML = `
                <div class="absolute top-20 right-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-64 max-h-[70vh] overflow-y-auto shadow-2xl">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 class="text-lg font-bold text-white">Features</h3>
                    <button id="close-menu" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div class="p-3 space-y-2">
                    <button id="profile-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>👤</span>
                      <span class="text-white font-medium">Profile</span>
                    </button>
                    <button id="messages-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left relative">
                      <span>💬</span>
                      <span class="text-white font-medium">Messages</span>
                      ${unreadCount > 0 ? `<span class="ml-auto w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
                    </button>
                    <button id="friend-requests-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left relative">
                      <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <span class="text-white font-medium">Friend Requests</span>
                      ${friendRequestCount > 0 ? `<span class="ml-auto w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${friendRequestCount > 9 ? '9+' : friendRequestCount}</span>` : ''}
                    </button>
                    <button id="faction-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                       <span class="text-white">🚩</span>
                       <span class="text-white font-medium">House</span>
                    </button>
                    <button id="bank-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-yellow-500">💰</span>
                      <span class="text-white font-medium">Bank</span>
                    </button>
                    <button id="store-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-indigo-400">🛍️</span>
                      <span class="text-white font-medium">Store</span>
                    </button>
                    <button id="chat-rooms-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-sky-400">💬</span>
                      <span class="text-white font-medium">Chat Rooms</span>
                    </button>
                    <button id="world-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🌍</span>
                      <span class="text-white font-medium">World</span>
                    </button>
                    <button id="memento-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>💀</span>
                      <span class="text-white font-medium">Memento</span>
                    </button>
                    <button id="pacts-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>📜</span>
                      <span class="text-white font-medium">Pacts</span>
                    </button>
                    <button id="watch-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-slate-400">🛡️</span>
                      <span class="text-white font-medium">The Watch</span>
                    </button>
                    <button id="goals-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🎯</span>
                      <span class="text-white font-medium">Goals</span>
                    </button>
                    <button id="bucket-list-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>📝</span>
                      <span class="text-white font-medium">Bucket List</span>
                    </button>
                    <button id="achievements-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>🏆</span>
                      <span class="text-white font-medium">Achievements</span>
                    </button>
                    <button id="notes-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>📋</span>
                      <span class="text-white font-medium">Notes</span>
                    </button>
                    <button id="habits-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>➕</span>
                      <span class="text-white font-medium">Manage Habits</span>
                    </button>
                    <button id="daily-review-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-left">
                      <span>🌙</span>
                      <span class="text-indigo-300 font-medium">Daily Review</span>
                    </button>
                    <button id="settings-nav-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>⚙️</span>
                      <span class="text-white font-medium">Settings</span>
                    </button>
                    <button id="logout-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all text-left">
                      <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      <span class="text-red-400 font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              `;
              document.body.appendChild(menuDiv);
 
              const closeMenu = () => {
                if (document.body.contains(menuDiv)) {
                  document.body.removeChild(menuDiv);
                }
              };
              menuDiv.addEventListener('click', (e) => {
                if (e.target === menuDiv) closeMenu();
              });
              document.getElementById('close-menu')?.addEventListener('click', closeMenu);
 
              document.getElementById('profile-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/profile');
              });
              document.getElementById('messages-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/messages');
              });
              document.getElementById('friend-requests-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsFriendRequestsModalOpen(true);
              });
              document.getElementById('faction-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsFactionModalOpen(true);
              });
              document.getElementById('bank-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/bank');
              });
              document.getElementById('store-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/store');
              });
              document.getElementById('chat-rooms-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/chat');
              });
              document.getElementById('world-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/world');
              });
              document.getElementById('memento-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/memento');
              });
              document.getElementById('pacts-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsPactsModalOpen(true);
              });
              document.getElementById('watch-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsWatchModalOpen(true);
              });
              document.getElementById('goals-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/goals');
              });
              document.getElementById('bucket-list-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/bucket-list');
              });
              document.getElementById('achievements-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/achievements');
              });
              document.getElementById('notes-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/notes');
              });
              document.getElementById('habits-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsAddModalOpen(true);
              });
              document.getElementById('daily-review-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsDailyReviewModalOpen(true);
              });
              document.getElementById('settings-nav-btn')?.addEventListener('click', () => {
                closeMenu();
                router.push('/settings');
              });
              document.getElementById('logout-btn')?.addEventListener('click', async () => {
                closeMenu();
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                router.push('/login');
              });
            }}
          >
            {currentFaction ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentFaction.sigilUrl} alt={currentFaction.name} className="w-full h-full object-cover rounded-full" />
              </>
            ) : (
              <Menu className="w-5 h-5" />
            )}
            {(friendRequestCount > 0 || unreadCount > 0) && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
            )}
          </button>
        </div>
      </header>


      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <PactsModal isOpen={isPactsModalOpen} onClose={() => setIsPactsModalOpen(false)} />
      <BankModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />
      <NightsWatchModal isOpen={isWatchModalOpen} onClose={() => setIsWatchModalOpen(false)} />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
      <FriendRequestsModal
        isOpen={isFriendRequestsModalOpen}
        onClose={() => setIsFriendRequestsModalOpen(false)}
        currentUserId={user?.id || ''}
      />
      <DailyReviewModal
        isOpen={isDailyReviewModalOpen}
        onClose={() => setIsDailyReviewModalOpen(false)}
      />
      <FactionPickerModal isOpen={isFactionModalOpen} onClose={() => setIsFactionModalOpen(false)} />
      <InvestmentModal isOpen={isInvestmentModalOpen} onClose={() => setIsInvestmentModalOpen(false)} />
      <StoreModal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} />
    </>
  );
}
