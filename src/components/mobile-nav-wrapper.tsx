"use client";

import { usePathname } from 'next/navigation';
import { MobileNav } from './mobile-nav';
import { useUserData } from '@/context/user-data-context';

export function MobileNavWrapper() {
    const pathname = usePathname();
    const { user } = useUserData();

    // Always hide navigation on login/signup/auth pages
    if (pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/auth')) {
        return null;
    }

    // On the landing page '/', hide nav only for unauthenticated users.
    // For authenticated users on '/', the middleware will redirect to /dashboard
    // but we show the nav immediately to prevent a flash of missing navigation.
    if (pathname === '/' && !user) {
        return null;
    }

    return <MobileNav />;
}

