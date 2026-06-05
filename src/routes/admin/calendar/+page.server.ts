import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listBarbers } from '$lib/db';
import { witaEnd } from '$lib/time';

export interface CalBooking {
  id: number;
  starts_at: string;
  customer_name: string;
  whatsapp_phone: string;
  status: string;
  barber_id: number | null;
  service_name: string | null;
  barber_name: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
function parse(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}
function addDays(s: string, n: number) {
  const { y, m, d } = parse(s);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return toStr(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}
function dow(s: string) {
  const { y, m, d } = parse(s);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
function addMonths(s: string, n: number) {
  const { y, m } = parse(s);
  const idx = m - 1 + n;
  const ny = y + Math.floor(idx / 12);
  const nm = ((idx % 12) + 12) % 12;
  return `${ny}-${pad(nm + 1)}-01`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export const load: PageServerLoad = async ({ url, platform }) => {
  if (!platform) throw error(500, 'platform not bound');

  const now = new Date();
  const w = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000);
  const today = toStr(w.getUTCFullYear(), w.getUTCMonth() + 1, w.getUTCDate());

  const view = (['day', 'week', 'month'].includes(url.searchParams.get('view') ?? '')
    ? url.searchParams.get('view')
    : 'month') as 'day' | 'week' | 'month';

  const dParam = url.searchParams.get('d');
  const anchor = dParam && /^\d{4}-\d{2}-\d{2}$/.test(dParam) ? dParam : today;
  const { y, m } = parse(anchor);

  let from: string, to: string, prev: string, next: string, title: string;
  let weekDates: string[] = [];

  if (view === 'day') {
    from = `${anchor}T00:00:00+08:00`;
    to = `${anchor}T23:59:59+08:00`;
    prev = addDays(anchor, -1);
    next = addDays(anchor, 1);
    const { d } = parse(anchor);
    title = `${DOW[dow(anchor)]} ${d} ${MON[m - 1]} ${y}`;
  } else if (view === 'week') {
    const start = addDays(anchor, -dow(anchor)); // back to Sunday
    weekDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    from = `${weekDates[0]}T00:00:00+08:00`;
    to = `${weekDates[6]}T23:59:59+08:00`;
    prev = addDays(start, -7);
    next = addDays(start, 7);
    const a = parse(weekDates[0]);
    const b = parse(weekDates[6]);
    title = `${a.d} ${MON[a.m - 1]} – ${b.d} ${MON[b.m - 1]} ${b.y}`;
  } else {
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    from = `${toStr(y, m, 1)}T00:00:00+08:00`;
    to = `${toStr(y, m, daysInMonth)}T23:59:59+08:00`;
    prev = addMonths(anchor, -1);
    next = addMonths(anchor, 1);
    title = `${MONTHS[m - 1]} ${y}`;
  }

  const [res, barbers] = await Promise.all([
    platform.env.DB.prepare(
      `SELECT b.id, b.starts_at, b.customer_name, b.whatsapp_phone, b.status, b.barber_id,
              s.name_en AS service_name, br.name AS barber_name
       FROM bookings b
       LEFT JOIN services s ON s.id = b.base_service_id
       LEFT JOIN barbers br ON br.id = b.barber_id
       WHERE b.starts_at >= ? AND b.starts_at <= ? AND b.status != 'cancelled'
       ORDER BY b.starts_at ASC`
    )
      .bind(from, to)
      .all<CalBooking>(),
    listBarbers(platform.env.DB)
  ]);

  const byDay: Record<string, CalBooking[]> = {};
  for (const b of res.results) {
    (byDay[b.starts_at.slice(0, 10)] ??= []).push(b);
  }

  // month grid info
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();

  return {
    view,
    anchor,
    title,
    prev,
    next,
    today,
    total: res.results.length,
    barbers,
    byDay,
    weekDates,
    year: y,
    month: m,
    daysInMonth,
    firstWeekday
  };
};

export const actions: Actions = {
  setStatus: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const id = Number(f.get('id'));
    const status = String(f.get('status'));
    if (!['pending', 'confirmed', 'cancelled', 'no_show', 'completed'].includes(status)) return fail(400);
    const setConfirmed = status === 'confirmed' ? `, confirmed_at = datetime('now')` : '';
    await platform.env.DB.prepare(`UPDATE bookings SET status=?${setConfirmed} WHERE id=?`).bind(status, id).run();
    return { ok: true };
  },
  setBarber: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const id = Number(f.get('id'));
    const raw = f.get('barber_id');
    const barberId = raw && raw !== '' ? Number(raw) : null;
    await platform.env.DB.prepare(`UPDATE bookings SET barber_id=? WHERE id=?`).bind(barberId, id).run();
    return { ok: true };
  },
  setTime: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const id = Number(f.get('id'));
    const local = String(f.get('starts_local') ?? '');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return fail(400);
    const startsAt = `${local}:00+08:00`;
    const row = await platform.env.DB.prepare('SELECT duration_min_total FROM bookings WHERE id=?')
      .bind(id)
      .first<{ duration_min_total: number }>();
    const ends = witaEnd(startsAt, row?.duration_min_total ?? 30);
    await platform.env.DB.prepare('UPDATE bookings SET starts_at=?, ends_at=? WHERE id=?')
      .bind(startsAt, ends, id)
      .run();
    return { ok: true };
  }
};
