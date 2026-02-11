"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Home, Globe, Flame, Coins, Shield, Sword,
    ClipboardList, MessageCircle, ScrollText, User, Skull
} from 'lucide-react';
import { useUserData, ALL_NAV_ITEMS, NavItemKey } from '@/context/user-data-context';
import { getUserAvatar } from '@/utils/avatar-helpers';
import { RitualModal } from './modals/ritual-modal';
import { BankModal } from './modals/bank-modal';
import { NightsWatchModal } from './modals/nights-watch-modal';
import { ShareModal } from './modals/share-modal';
import { PactsModal } from './modals/pacts-modal';

const ICON_MAP: Record<string, any> = {
    Home, Globe, Flame, Coins, Shield, Sword,
    ClipboardList, MessageCircle, ScrollText, User, Skull
};

export function MobileNav() {
    const pathname = usePathname();
    const { navPreferences, profile, user } = useUserData();

    const [isRitualModalOpen, setIsRitualModalOpen] = useState(false);
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
    const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);
    const [isPactsModalOpen, setIsPactsModalOpen] = useState(false);

    // Get the actual nav items based on preferences
    const activeNavItems = navPreferences
        .map(key => ALL_NAV_ITEMS.find(item => item.key === key))
        .filter(Boolean) as typeof ALL_NAV_ITEMS;

    const handleAction = (key: NavItemKey) => {
        if (key === 'ritual') setIsRitualModalOpen(true);
        if (key === 'bank') setIsBankModalOpen(true);
        if (key === 'watch') setIsWatchModalOpen(true);
        if (key === 'arena') setIsArenaModalOpen(true);
        if (key === 'pacts') setIsPactsModalOpen(true);
    };

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    // Hide nav on full-screen pages like notes editor
    const hideNav = pathname.startsWith('/notes');

    return (
        <>
            {!hideNav && (
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 z-[60] pb-safe">
                    <div className="flex items-center justify-around h-16 px-2">
                        {/* Home Button - Fixed */}
                        <Link
                            href="/"
                            className="flex flex-col items-center justify-center flex-1 h-full relative"
                        >
                            <Home
                                className={`w-6 h-6 transition-all ${isActive('/') ? 'text-white scale-110' : 'text-white/50'}`}
                                strokeWidth={isActive('/') ? 2.5 : 2}
                            />
                            {isActive('/') && (
                                <div className="absolute -top-1 w-1 h-1 rounded-full bg-accent" />
                            )}
                        </Link>

                        {/* Dynamic User Items */}
                        {activeNavItems.map((item) => {
                            const Icon = ICON_MAP[item.icon];
                            if (!Icon) return null;
                            const active = item.href ? isActive(item.href) : false;

                            if (item.href) {
                                return (
                                    <Link
                                        key={item.key}
                                        href={item.href}
                                        className="flex flex-col items-center justify-center flex-1 h-full relative"
                                    >
                                        <Icon
                                            className={`w-6 h-6 transition-all ${active ? 'text-white scale-110' : 'text-white/50'}`}
                                            strokeWidth={active ? 2.5 : 2}
                                        />
                                        {active && (
                                            <div className="absolute -top-1 w-1 h-1 rounded-full bg-accent" />
                                        )}
                                    </Link>
                                );
                            }

                            return (
                                <button
                                    key={item.key}
                                    onClick={() => handleAction(item.key)}
                                    className="flex flex-col items-center justify-center flex-1 h-full relative"
                                >
                                    <Icon className="w-6 h-6 text-white/50 hover:text-white transition-all" />
                                </button>
                            );
                        })}

                        {/* Profile Button - Fixed */}
                        <Link
                            href="/profile"
                            className="flex flex-col items-center justify-center flex-1 h-full relative"
                        >
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all ${isActive('/profile') ? 'border-white' : 'border-white/30'} bg-gradient-to-tr from-zinc-800 to-zinc-700`}>
                                <img
                                    src={getUserAvatar(profile?.avatar_url, profile?.gender, user?.id)}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {isActive('/profile') && (
                                <div className="absolute -top-1 w-1 h-1 rounded-full bg-accent" />
                            )}
                        </Link>
                    </div>
                </nav>
            )}

            <RitualModal isOpen={isRitualModalOpen} onClose={() => setIsRitualModalOpen(false)} />
            <BankModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />
            <NightsWatchModal isOpen={isWatchModalOpen} onClose={() => setIsWatchModalOpen(false)} />
            <ShareModal isOpen={isArenaModalOpen} onClose={() => setIsArenaModalOpen(false)} />
            <PactsModal isOpen={isPactsModalOpen} onClose={() => setIsPactsModalOpen(false)} />
        </>
    );
}
