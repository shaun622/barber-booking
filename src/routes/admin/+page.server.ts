import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listBarbers, listServices, type Booking } from '$lib/db';

export interface BookingRow extends Booking {
  service_name: string | null;
  barber_name: string | null;
}

export const load: PageServerLoad = async ({ platform, url }) => {
  if (!platform) throw error(500, 'platform not bound');
  const view = url.searchParams.get('view') ?? 'today';
  const tz = platform.env.SHOP_TZ ?? 'Asia/Makassar';
  const now = new Date();
  const witaMs = now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000;
  const today = new Date(witaMs).toISOString().slice(0, 10);

  let from = `${today}T00:00:00+08:00`;
  let to = `${today}T23:59:59+08:00`;
  if (view === 'week') {
    const w = new Date(witaMs);
    w.setUTCDate(w.getUTCDate() + 7);
    to = `${w.toISOString().slice(0, 10)}T23:59:59+08:00`;
  }

  const bookingsRes = await platform.env.DB.prepare(
    `SELECT b.*, s.name_en AS service_name, br.name AS barber_name
     FROM bookings b
     LEFT JOIN services s ON s.id = b.base_service_id
     LEFT JOIN barbers br ON br.id = b.barber_id
     WHERE b.starts_at >= ? AND b.starts_at <= ?
     ORDER BY b.starts_at ASC`
  )
    .bind(from, to)
    .all<BookingRow>();
  const bookings = bookingsRes.results;

  const [services, barbers] = await Promise.all([
    listServices(platform.env.DB, false),
    listBarbers(platform.env.DB, false)
  ]);

  return { bookings, services, barbers, view, today, tz };
};

export const actions: Actions = {
  setStatus: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const form = await request.formData();
    const id = Number(form.get('id'));
    const status = String(form.get('status'));
    const allowed = ['pending', 'confirmed', 'cancelled', 'no_show', 'completed'];
    if (!allowed.includes(status)) return fail(400);
    const setConfirmed = status === 'confirmed' ? `, confirmed_at = datetime('now')` : '';
    await platform.env.DB.prepare(
      `UPDATE bookings SET status = ?${setConfirmed} WHERE id = ?`
    )
      .bind(status, id)
      .run();
    return { ok: true };
  },

  block: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const form = await request.formData();
    const barberIdRaw = form.get('barber_id');
    const starts_at = String(form.get('starts_at'));
    const ends_at = String(form.get('ends_at'));
    const reason = String(form.get('reason') ?? '');
    const barber_id = barberIdRaw && barberIdRaw !== '' ? Number(barberIdRaw) : null;
    await platform.env.DB.prepare(
      `INSERT INTO blocked_slots (barber_id, starts_at, ends_at, reason) VALUES (?, ?, ?, ?)`
    )
      .bind(barber_id, starts_at, ends_at, reason)
      .run();
    return { ok: true };
  }
};
