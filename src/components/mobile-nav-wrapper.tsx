"use client";

import { usePathname } from 'next/navigation';
import { MobileNav } from './mobile-nav';

export function MobileNavWrapper() {
    const pathname = usePathname();

    // Hide navigation on login/signup pages
    if (pathname?.startsWith('/login') || pathname?.startsWith('/signup')) {
        return null;
    }

    return <MobileNav />;
}
