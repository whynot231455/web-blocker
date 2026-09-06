'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { hasGuestSitesForRedirect } from '@/lib/guestRedirect';

/**
 * Landing header call-to-action. Returning guests with a saved block list
 * see "Go to dashboard"; everyone else sees "Get Started".
 *
 * Must use useSyncExternalStore (not useState initializer): the prerender
 * emits "Get Started" (server snapshot: false) while a returning guest's
 * browser reads true from localStorage. A plain useState initializer would
 * render different HTML on first client render → hydration mismatch.
 */
function subscribe() {
    return () => {};
}

function getClientSnapshot() {
    return hasGuestSitesForRedirect();
}

function getServerSnapshot() {
    return false;
}

export function LandingHeaderCta() {
    const isReturningGuest = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

    if (isReturningGuest) {
        return (
            <Link href="/dashboard">
                <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-gray-100 transition-colors">Go to dashboard</button>
            </Link>
        );
    }

    return (
        <Link href="/login">
            <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-gray-100 transition-colors">Get Started</button>
        </Link>
    );
}
