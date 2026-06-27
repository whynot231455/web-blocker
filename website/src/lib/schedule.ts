import SCHEDULE_UTILS from '../../../shared/schedule-utils';

export type AccessWindow = {
  enabled: boolean;
  start: string;
  end: string;
};

export type AccessWindowState = {
  allowed: boolean;
  configured: boolean;
  nextTransitionAt: number | null;
};

export const parseTimeToMinutes = SCHEDULE_UTILS.parseTimeToMinutes as (value: string) => number | null;
export const normalizeTimeString = SCHEDULE_UTILS.normalizeTimeString as (value: string) => string | null;
export const normalizeAccessWindow = SCHEDULE_UTILS.normalizeAccessWindow as (window: unknown) => AccessWindow | null;
export const getAccessWindowState = SCHEDULE_UTILS.getAccessWindowState as (window: AccessWindow | null | undefined, now?: Date) => AccessWindowState;
export const buildBlockedSitesSignature = SCHEDULE_UTILS.buildBlockedSitesSignature as (sites: Array<{ url?: string | null; is_active?: boolean | null; access_window?: AccessWindow | null }>) => string;
