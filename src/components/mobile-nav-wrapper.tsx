"use client";

import { usePathname } from 'next/navigation';
import { MobileNav } from './mobile-nav';

export function MobileNavWrapper() {
    const pathname = usePathname();

    // Hide navigation on landing page (/) and login/signup pages
    if (pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/signup')) {
        return null;
    }

    return <MobileNav />;
}
