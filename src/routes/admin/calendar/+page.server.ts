import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export interface CalBooking {
  id: number;
  starts_at: string;
  customer_name: string;
  status: string;
  service_name: string | null;
  barber_name: string | null;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export const load: PageServerLoad = async ({ url, platform }) => {
  if (!platform) throw error(500, 'platform not bound');

  // Current month in WITA (+08:00) as the default.
  const now = new Date();
  const wita = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000);
  let y = wita.getUTCFullYear();
  let m = wita.getUTCMonth() + 1; // 1-12

  const mParam = url.searchParams.get('m');
  if (mParam && /^\d{4}-\d{2}$/.test(mParam)) {
    y = +mParam.slice(0, 4);
    m = +mParam.slice(5, 7);
  }

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=Sun
  const todayStr = `${wita.getUTCFullYear()}-${pad(wita.getUTCMonth() + 1)}-${pad(wita.getUTCDate())}`;

  const from = `${y}-${pad(m)}-01T00:00:00+08:00`;
  const to = `${y}-${pad(m)}-${pad(daysInMonth)}T23:59:59+08:00`;

  const res = await platform.env.DB.prepare(
    `SELECT b.id, b.starts_at, b.customer_name, b.status,
            s.name_en AS service_name, br.name AS barber_name
     FROM bookings b
     LEFT JOIN services s ON s.id = b.base_service_id
     LEFT JOIN barbers br ON br.id = b.barber_id
     WHERE b.starts_at >= ? AND b.starts_at <= ? AND b.status != 'cancelled'
     ORDER BY b.starts_at ASC`
  )
    .bind(from, to)
    .all<CalBooking>();

  const byDay: Record<string, CalBooking[]> = {};
  for (const b of res.results) {
    const key = b.starts_at.slice(0, 10);
    (byDay[key] ??= []).push(b);
  }

  const prevM = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
  const nextM = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return {
    y,
    m,
    monthLabel: `${monthNames[m - 1]} ${y}`,
    daysInMonth,
    firstWeekday,
    byDay,
    todayStr,
    prevM,
    nextM,
    total: res.results.length
  };
};
