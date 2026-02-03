"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Shield, ScrollText, ClipboardList, Flag, Settings, Plus, Flame, Globe, Ghost, Skull, Coins, Menu, X, Search, MessageCircle, Bell, Sword, Home, User, Brain } from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { createClient } from '@/utils/supabase/client';
import { Sigil } from './sigil';
import { AddTaskModal } from './modals/add-task-modal';
import { PactsModal } from './modals/pacts-modal';
import { ShareModal } from './modals/share-modal';
import { RitualModal } from './modals/ritual-modal';
import { BankModal } from './modals/bank-modal';
import { NightsWatchModal } from './modals/nights-watch-modal';
import { SearchModal } from './modals/search-modal';
import { DailyReviewModal } from './modals/daily-review-modal';
import { FriendRequestsModal } from './modals/friend-requests-modal';
import { getUserAvatar } from '@/utils/avatar-helpers';
import { useMessageNotifications } from '@/context/message-notification-context';

import { FactionPickerModal } from './modals/faction-picker-modal';

import { InvestmentModal } from './modals/investment-modal';

export function Header() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPactsModalOpen, setIsPactsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDailyReviewModalOpen, setIsDailyReviewModalOpen] = useState(false);
  const [isFriendRequestsModalOpen, setIsFriendRequestsModalOpen] = useState(false);
  const [isFactionModalOpen, setIsFactionModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const { consistencyScore, currentStreak, streakStatus, streakTier, streakStrength, activeFilterTaskId, tasks, currentFaction, user, profile } = useUserData();
  const { unreadCount, friendRequestCount } = useMessageNotifications();

  // Smart Header Logic
  const pathname = usePathname();
  const isHome = pathname === '/';
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
        <div className="flex items-center gap-3 relative group cursor-default">
          {/* Logo Glow */}
          <div className="absolute -inset-2 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Link href="/" className="relative flex items-center gap-2 md:gap-3">
            <Brain className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="text-lg md:text-xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">GYRAL</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-muted-foreground/80">
          <Link href="/world" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Globe className="w-4 h-4 group-hover:text-accent transition-colors" /> <span className="relative">World <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent group-hover:w-full transition-all duration-300" /></span>
          </Link>

          <Link href="/memento" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <Skull className="w-4 h-4 group-hover:text-accent transition-colors" /> <span className="relative">Memento <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent group-hover:w-full transition-all duration-300" /></span>
          </Link>

          <Link href="/notes" className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group">
            <ClipboardList className="w-4 h-4 group-hover:text-accent transition-colors" /> <span className="relative">Notes <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent group-hover:w-full transition-all duration-300" /></span>
          </Link>

          <button
            onClick={() => setIsWatchModalOpen(true)}
            className="hover:text-white hover:scale-105 transition-all duration-300 ease-out flex items-center gap-2 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] group"
          >
            <Shield className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" /> <span className="relative">The Watch <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-slate-500 group-hover:w-full transition-all duration-300" /></span>
          </button>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">


          {/* Desktop Settings Link */}
          <Link
            href="/settings"
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="System Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* Desktop Manage Habits Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-white transition-all duration-300 border border-transparent hover:border-white/20 rounded-full hover:bg-white/5 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Settings className="w-4 h-4" /> Manage Habits
          </button>

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

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 bg-black border border-white/20 text-xs text-white px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              {getTooltipText()}
            </div>
          </div>

          {/* Desktop Add Record Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 md:px-6 py-2 text-sm font-bold bg-white text-black rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.7)] hover:bg-white border-2 border-white/50"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>

          {/* Daily Review Button */}
          <button
            onClick={() => setIsDailyReviewModalOpen(true)}
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            title="Daily Review"
          >
            <span className="sr-only">Daily Review</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          </button>

          {/* Messages Button */}
          <Link
            href="/messages"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-300 relative"
            title="Messages"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Friend Requests Bell - Desktop */}
          <button
            onClick={() => setIsFriendRequestsModalOpen(true)}
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all duration-300 relative"
            title="Friend Requests"
          >
            <Bell className="w-5 h-5" />
            {friendRequestCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {friendRequestCount > 9 ? '9+' : friendRequestCount}
              </span>
            )}
          </button>

          {/* Desktop Menu Button - Three Dots / Sigil */}
          <button
            className={`hidden md:flex w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/20 relative ${currentFaction ? 'p-1 hover:scale-105' : ''}`}
            onClick={() => {
              // Create a temporary div to hold the menu
              const menuDiv = document.createElement('div');
              menuDiv.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] animate-in fade-in duration-200';
              menuDiv.innerHTML = `
                <div class="absolute top-20 right-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-64 max-h-[70vh] overflow-y-auto shadow-2xl">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 class="text-lg font-bold text-white">More</h3>
                    <button id="close-menu" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div class="p-3 space-y-2">
                    <button id="search-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                      <span class="text-white font-medium">Search Users</span>
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
                    <button id="ritual-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-orange-500">🔥</span>
                      <span class="text-white font-medium">Ritual</span>
                    </button>
                    <button id="bank-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-yellow-500">💰</span>
                      <span class="text-white font-medium">Bank</span>
                    </button>
                    <button id="watch-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-slate-400">🛡️</span>
                      <span class="text-white font-medium">The Watch</span>
                    </button>
                    <button id="arena-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-accent">⚔️</span>
                      <span class="text-white font-medium">Arena</span>
                    </button>
                    <button id="negotiate-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-emerald-500">💎</span>
                      <span class="text-white font-medium">Negotiate</span>
                    </button>
                    <a href="/feed" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>👻</span>
                      <span class="text-white font-medium">Feed</span>
                    </a>
                    <a href="/notes" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>📋</span>
                      <span class="text-white font-medium">Notes</span>
                    </a>
                    <a href="/settings" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>⚙️</span>
                      <span class="text-white font-medium">Settings</span>
                    </a>
                    <button id="habits-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>➕</span>
                      <span class="text-white font-medium">Manage Habits</span>
                    </button>
                  </div>
                </div>
              `;
              document.body.appendChild(menuDiv);

              // Close menu handlers
              const closeMenu = () => {
                if (document.body.contains(menuDiv)) {
                  document.body.removeChild(menuDiv);
                }
              };
              menuDiv.addEventListener('click', (e) => {
                if (e.target === menuDiv) closeMenu();
              });
              document.getElementById('close-menu')?.addEventListener('click', closeMenu);

              // Feature button handlers
              document.getElementById('search-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsSearchModalOpen(true);
              });
              document.getElementById('friend-requests-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsFriendRequestsModalOpen(true);
              });
              document.getElementById('faction-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsFactionModalOpen(true);
              });
              document.getElementById('ritual-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsRitualModalOpen(true);
              });
              document.getElementById('bank-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsBankModalOpen(true);
              });
              document.getElementById('watch-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsWatchModalOpen(true);
              });
              document.getElementById('arena-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsShareModalOpen(true);
              });
              document.getElementById('negotiate-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsInvestmentModalOpen(true);
              });
              document.getElementById('habits-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsAddModalOpen(true);
              });
            }}
          >
            {currentFaction ? (
              <img src={currentFaction.sigilUrl} alt={currentFaction.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <Menu className="w-5 h-5" />
            )}

            {(friendRequestCount > 0 && !currentFaction) && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
            )}
          </button>

          {/* Mobile Menu Button - Moved to end for better mobile UX */}
          <button
            className={`md:hidden w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/20 relative ${currentFaction ? 'p-1' : ''}`}
            onClick={() => {
              // Create a temporary div to hold the menu
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
                    <button id="mobile-friend-requests-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left relative">
                      <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      <span class="text-white font-medium">Friend Requests</span>
                      ${friendRequestCount > 0 ? `<span class="ml-auto w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${friendRequestCount > 9 ? '9+' : friendRequestCount}</span>` : ''}
                    </button>
                    <a href="/messages" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left relative">
                      <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      <span class="text-white font-medium">Messages</span>
                      ${unreadCount > 0 ? `<span class="ml-auto w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
                    </a>
                    <button id="faction-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                       <span class="text-white">🚩</span>
                       <span class="text-white font-medium">House</span>
                    </button>
                    <button id="ritual-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-orange-500">🔥</span>
                      <span class="text-white font-medium">Ritual</span>
                    </button>
                    <button id="bank-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-yellow-500">💰</span>
                      <span class="text-white font-medium">Bank</span>
                    </button>
                    <button id="watch-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-slate-400">🛡️</span>
                      <span class="text-white font-medium">The Watch</span>
                    </button>
                    <button id="arena-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span class="text-accent">⚔️</span>
                      <span class="text-white font-medium">Arena</span>
                    </button>
                    <a href="/notes" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>📋</span>
                      <span class="text-white font-medium">Notes</span>
                    </a>
                    <a href="/settings" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>⚙️</span>
                      <span class="text-white font-medium">Settings</span>
                    </a>
                    <button id="habits-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left">
                      <span>➕</span>
                      <span class="text-white font-medium">Manage Habits</span>
                    </button>
                    <button id="mobile-daily-review-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-left">
                      <span>🌙</span>
                      <span class="text-indigo-300 font-medium">Daily Review</span>
                    </button>
                    <button id="mobile-logout-btn" class="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 transition-all text-left">
                      <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      <span class="text-red-400 font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              `;
              document.body.appendChild(menuDiv);

              // Close menu handlers
              const closeMenu = () => {
                if (document.body.contains(menuDiv)) {
                  document.body.removeChild(menuDiv);
                }
              };
              menuDiv.addEventListener('click', (e) => {
                if (e.target === menuDiv) closeMenu();
              });
              document.getElementById('close-menu')?.addEventListener('click', closeMenu);

              document.getElementById('mobile-friend-requests-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsFriendRequestsModalOpen(true);
              });

              // Feature button handlers
              document.getElementById('faction-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsFactionModalOpen(true);
              });
              document.getElementById('ritual-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsRitualModalOpen(true);
              });
              document.getElementById('bank-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsBankModalOpen(true);
              });
              document.getElementById('watch-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsWatchModalOpen(true);
              });
              document.getElementById('arena-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsShareModalOpen(true);
              });
              document.getElementById('habits-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsAddModalOpen(true);
              });
              document.getElementById('mobile-daily-review-btn')?.addEventListener('click', () => {
                closeMenu();
                setIsDailyReviewModalOpen(true);
              });
              document.getElementById('mobile-logout-btn')?.addEventListener('click', async () => {
                closeMenu();
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              });
            }}
          >
            {currentFaction ? (
              <img src={currentFaction.sigilUrl} alt={currentFaction.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
            {(friendRequestCount > 0 || unreadCount > 0) && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
            )}
          </button>

          {/* Profile Picture Link - Hidden on mobile */}
          <Link href="/profile" className="hidden md:flex w-10 h-10 rounded-full border-2 border-white/10 items-center justify-center relative overflow-hidden group cursor-pointer hover:border-accent/50 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(52,211,153,0.3)] bg-gradient-to-tr from-zinc-800 to-zinc-700">
            <img
              src={user?.id ? getUserAvatar(profile?.avatar_url || user?.user_metadata?.avatar_url, profile?.gender, user.id as string) : '/avatars/default-male1.jpeg.jpeg'}
              alt="Profile"
              className="w-full h-full object-cover"
            />

            {/* Tooltip on Hover */}
            <div className="absolute top-full right-0 mt-2 bg-black border border-white/20 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              View Profile
            </div>
          </Link>
        </div>
      </header>


      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <PactsModal isOpen={isPactsModalOpen} onClose={() => setIsPactsModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      <RitualModal isOpen={isRitualModalOpen} onClose={() => setIsRitualModalOpen(false)} />
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
    </>
  );
}
