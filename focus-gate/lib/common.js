// Shared helpers for the background worker and the extension pages.

export const DEFAULT_SETTINGS = {
  sites: [
    'instagram.com',
    'facebook.com',
    'tiktok.com',
    'x.com',
    'twitter.com',
    'youtube.com',
    'reddit.com',
    'linkedin.com',
    'threads.net',
    'pinterest.com',
    'snapchat.com',
  ],
  // Minutes of non-work social media allowed per day.
  personalLimitMin: 20,
  // Seconds the gate makes you wait before you can continue.
  pauseSeconds: 5,
  workHours: { enabled: true, days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
  // During work hours, only work sessions are allowed.
  blockPersonalDuringWork: true,
};

export const WORK_DURATIONS = [10, 25, 45];
export const PERSONAL_DURATIONS = [5, 10, 15];
export const MIN_INTENT_LENGTH = 3;
const DAYS_KEPT = 30;

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function emptyDay() {
  return { personalSec: 0, workSec: 0, resisted: 0, sites: {}, log: [] };
}

// Normalizes user input like "https://www.Instagram.com/foo" to "instagram.com".
export function normalizeSite(input) {
  let s = String(input).trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '');
  return s.split(/[/?#:]/)[0];
}

// Returns the tracked site that `url` belongs to, or null.
export function matchSite(url, sites) {
  if (!url) return null;
  let host;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    host = parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
  return sites.find((site) => host === site || host.endsWith('.' + site)) ?? null;
}

function minutesOfDay(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function inWorkHours(settings, date = new Date()) {
  const wh = settings.workHours;
  if (!wh?.enabled || !wh.days.includes(date.getDay())) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  return now >= minutesOfDay(wh.start) && now < minutesOfDay(wh.end);
}

export function personalBlocked(settings, date = new Date()) {
  return settings.blockPersonalDuringWork && inWorkHours(settings, date);
}

export function sessionActive(session, now = Date.now()) {
  return Boolean(session) && now < session.endsAt;
}

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    workHours: { ...DEFAULT_SETTINGS.workHours, ...settings?.workHours },
  };
}

export async function getDays() {
  const { days = {} } = await chrome.storage.local.get('days');
  return days;
}

export function pruneDays(days) {
  const keys = Object.keys(days).sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - DAYS_KEPT))) delete days[key];
  return days;
}

export function formatMinutes(sec) {
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}
