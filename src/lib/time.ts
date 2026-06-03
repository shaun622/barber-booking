// All times in the app are wall-clock at Asia/Makassar (WITA, UTC+8, no DST).
// We store ISO strings with the +08:00 offset and treat them as truth.

export const SHOP_TZ_OFFSET_MIN = 8 * 60;

export function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

// Build an ISO 8601 string at +08:00 from year/month/day/hour/minute.
export function wita(y: number, mo: number, d: number, h: number, mi: number): string {
  return `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}:00+08:00`;
}

// Parse a YYYY-MM-DD date string (assumed to be the shop's local date)
// into { y, mo, d }. month is 1-12.
export function parseDateString(s: string): { y: number; mo: number; d: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return { y: +m[1], mo: +m[2], d: +m[3] };
}

// Day of week for a WITA local date (0=Sun..6=Sat).
export function dayOfWeek(y: number, mo: number, d: number): number {
  // Use UTC date constructor with the local Y-M-D as if it were UTC; the day-of-week is the same.
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

// "HH:MM" → minutes since midnight.
export function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

// Compare two ISO strings at +08:00.
// Since they share offset, lexicographic comparison is correct.
export function isoBefore(a: string, b: string): boolean {
  return a < b;
}

// Add minutes to a +08:00 ISO instant.
export function addMinutes(iso: string, minutes: number): string {
  const t = Date.parse(iso);
  return new Date(t + minutes * 60_000).toISOString().replace('Z', '+00:00').replace(
    /Z?$/,
    ''
  );
  // Note: we re-render below as proper +08:00 wall-clock.
}

// Convert minutes-since-WITA-midnight on a given local date to ISO at +08:00.
export function localMinToWitaIso(y: number, mo: number, d: number, minSinceMidnight: number): string {
  const h = Math.floor(minSinceMidnight / 60);
  const m = minSinceMidnight % 60;
  return wita(y, mo, d, h, m);
}

// Pretty time label "09:30".
export function formatHm(minSinceMidnight: number): string {
  return `${pad2(Math.floor(minSinceMidnight / 60))}:${pad2(minSinceMidnight % 60)}`;
}
