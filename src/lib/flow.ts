import type { Cookies } from '@sveltejs/kit';

export interface FlowState {
  baseServiceId?: number;
  addonIds: number[];
  barberId?: number | null; // null = any
  startsAt?: string; // ISO +08:00
}

const COOKIE = 'flow';
const MAX_AGE = 60 * 30; // 30 min

export function loadFlow(cookies: Cookies): FlowState {
  const raw = cookies.get(COOKIE);
  if (!raw) return { addonIds: [] };
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return {
      baseServiceId: typeof parsed.baseServiceId === 'number' ? parsed.baseServiceId : undefined,
      addonIds: Array.isArray(parsed.addonIds) ? parsed.addonIds.filter((n: unknown) => typeof n === 'number') : [],
      barberId:
        parsed.barberId === null
          ? null
          : typeof parsed.barberId === 'number'
            ? parsed.barberId
            : undefined,
      startsAt: typeof parsed.startsAt === 'string' ? parsed.startsAt : undefined
    };
  } catch {
    return { addonIds: [] };
  }
}

export function saveFlow(cookies: Cookies, next: FlowState): void {
  cookies.set(COOKIE, encodeURIComponent(JSON.stringify(next)), {
    path: '/',
    maxAge: MAX_AGE,
    httpOnly: false,
    sameSite: 'lax',
    secure: true
  });
}

export function clearFlow(cookies: Cookies): void {
  cookies.delete(COOKIE, { path: '/' });
}
