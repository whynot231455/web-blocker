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
}

export {};
