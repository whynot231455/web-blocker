// Type definitions for the Ctrl+Blck extension globals.
// This file helps TypeScript understand custom properties on globalThis.

declare global {
    var CTRL_BLCK_CONFIG: {
        supabaseUrl: string;
        supabaseKey: string;
    } | undefined;

    var CTRL_BLCK_SYNC: {
        debugMode: boolean;
        supabaseUrl: string;
        supabaseKey: string;
        dashboardMetaName: string;
        dashboardOrigins: string[];
        defaultDashboardOrigin: string;
        dashboardPaths: {
            login: string;
            dashboard: string;
        };
        storageKeys: Record<string, string>;
        messageActions: Record<string, string>;
        normalizeHostname: (url: string) => string | null;
    } | undefined;

    var CTRL_BLCK_URL_UTILS: {
        normalizeHostname: (url: string) => string | null;
        isValidDomain: (domain: string) => boolean;
    } | undefined;

    type CtrlBlckAccessWindow = { enabled: boolean; start: string; end: string };

    var CTRL_BLCK_SCHEDULE_UTILS: {
        parseTimeToMinutes: (value: unknown) => number | null;
        normalizeTimeString: (value: unknown) => string | null;
        normalizeAccessWindow: (window: unknown) => CtrlBlckAccessWindow | null;
        getAccessWindowState: (window: unknown, now?: Date) => {
            allowed: boolean;
            configured: boolean;
            nextTransitionAt: number | null;
        };
        buildBlockedSitesSignature: (sites: unknown) => string;
    } | undefined;

    var CTRL_BLCK_GUEST_SITE_STORE: {
        normalizeSite: (site: unknown) => unknown;
        normalizeSites: (sites: unknown) => unknown[];
        fromLegacyUrls: (urls: unknown, schedules?: unknown) => unknown[];
        project: (sites: unknown) => { sites: unknown[]; urls: string[]; schedules: Record<string, unknown>; signature: string };
    } | undefined;
}

export {};
