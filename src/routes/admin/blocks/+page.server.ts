import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listBarbers } from '$lib/db';

export interface BlockRow {
  id: number;
  barber_id: number | null;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  barber_name: string | null;
}

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform) throw error(500);
  const barbers = await listBarbers(platform.env.DB, false);
  const blocksRes = await platform.env.DB.prepare(
    `SELECT bs.*, b.name AS barber_name
     FROM blocked_slots bs
     LEFT JOIN barbers b ON b.id = bs.barber_id
     WHERE bs.ends_at > datetime('now')
     ORDER BY bs.starts_at ASC`
  ).all<BlockRow>();
  return { barbers, blocks: blocksRes.results };
};

export const actions: Actions = {
  create: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const barberIdRaw = f.get('barber_id');
    const date = String(f.get('date'));
    const start = String(f.get('start'));
    const end = String(f.get('end'));
    const reason = String(f.get('reason') ?? '');
    const barber_id = barberIdRaw && barberIdRaw !== '' ? Number(barberIdRaw) : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(400);
    await platform.env.DB.prepare(
      `INSERT INTO blocked_slots (barber_id, starts_at, ends_at, reason) VALUES (?, ?, ?, ?)`
    )
      .bind(barber_id, `${date}T${start}:00+08:00`, `${date}T${end}:00+08:00`, reason)
      .run();
    return { ok: true };
  },
  delete: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const id = Number(f.get('id'));
    await platform.env.DB.prepare(`DELETE FROM blocked_slots WHERE id = ?`).bind(id).run();
    return { ok: true };
  }
};
