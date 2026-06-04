import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listBarbers, listWorkingHours } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const [barbers, hours] = await Promise.all([
    listBarbers(platform.env.DB, false),
    listWorkingHours(platform.env.DB)
  ]);
  const hoursByBarber: Record<number, Record<number, { open_time: string; close_time: string }>> = {};
  for (const h of hours) {
    (hoursByBarber[h.barber_id] ??= {})[h.day_of_week] = {
      open_time: h.open_time,
      close_time: h.close_time
    };
  }
  return { barbers, hoursByBarber };
};

function num(v: FormDataEntryValue | null, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function chk(v: FormDataEntryValue | null): number {
  return v === 'on' || v === '1' ? 1 : 0;
}

export const actions: Actions = {
  updateBarber: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    await platform.env.DB.prepare(
      `UPDATE barbers SET name=?, photo_url=?, sort_order=?, active=? WHERE id=?`
    )
      .bind(
        String(f.get('name') ?? '').trim(),
        String(f.get('photo_url') ?? '').trim() || null,
        num(f.get('sort_order')),
        chk(f.get('active')),
        num(f.get('id'))
      )
      .run();
    return { ok: true };
  },

  createBarber: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const name = String(f.get('name') ?? '').trim();
    if (!name) return fail(400, { msg: 'Name required' });
    await platform.env.DB.prepare(
      `INSERT INTO barbers (name, photo_url, sort_order, active) VALUES (?, ?, ?, 1)`
    )
      .bind(name, String(f.get('photo_url') ?? '').trim() || null, num(f.get('sort_order'), 900))
      .run();
    return { created: true };
  },

  removeBarber: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    await platform.env.DB.prepare('DELETE FROM barbers WHERE id=?').bind(num(f.get('id'))).run();
    return { removed: true };
  },

  setHours: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const barberId = num(f.get('barber_id'));
    const db = platform.env.DB;
    await db.prepare('DELETE FROM working_hours WHERE barber_id=?').bind(barberId).run();
    for (let d = 0; d < 7; d++) {
      if (f.get('open_' + d) === 'on') {
        const open = String(f.get('from_' + d) || '09:00');
        const close = String(f.get('to_' + d) || '19:00');
        await db
          .prepare(
            'INSERT INTO working_hours (barber_id, day_of_week, open_time, close_time) VALUES (?,?,?,?)'
          )
          .bind(barberId, d, open, close)
          .run();
      }
    }
    return { hoursSaved: true };
  }
};
