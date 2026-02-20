export interface Session {
    id: string;
    user_id: string;
    start_time: string;
    end_time?: string;
    status: 'active' | 'completed' | 'cancelled';
    goal?: string;
    metadata?: Record<string, any>;
}
