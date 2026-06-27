export interface BlockedSite {
    id: string;
    user_id: string;
    url: string;
    created_at: string;
    is_active: boolean;
    access_window?: {
        enabled: boolean;
        start: string;
        end: string;
    } | null;
}
