import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { listServices } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  return { services: await listServices(platform.env.DB, false) };
};

function num(v: FormDataEntryValue | null, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function chk(v: FormDataEntryValue | null): number {
  return v === 'on' || v === '1' || v === 'true' ? 1 : 0;
}

const CATS = ['package', 'onsite', 'addon', 'oncall'];

export const actions: Actions = {
  update: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const id = num(f.get('id'));
    const category = String(f.get('category'));
    if (!CATS.includes(category)) return fail(400, { msg: 'Bad category' });
    await platform.env.DB.prepare(
      `UPDATE services SET category=?, name_en=?, name_id=?, description_en=?, description_id=?,
         price_idr=?, duration_min=?, male_only=?, price_from_only=?, requires_address=?,
         travel_buffer_min=?, sort_order=?, active=? WHERE id=?`
    )
      .bind(
        category,
        String(f.get('name_en') ?? '').trim(),
        String(f.get('name_id') ?? '').trim(),
        String(f.get('description_en') ?? '').trim() || null,
        String(f.get('description_id') ?? '').trim() || null,
        num(f.get('price_idr')),
        num(f.get('duration_min')),
        chk(f.get('male_only')),
        chk(f.get('price_from_only')),
        chk(f.get('requires_address')),
        num(f.get('travel_buffer_min')),
        num(f.get('sort_order')),
        chk(f.get('active')),
        id
      )
      .run();
    return { ok: true };
  },

  create: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const category = String(f.get('category') || 'onsite');
    if (!CATS.includes(category)) return fail(400, { msg: 'Bad category' });
    const name_en = String(f.get('name_en') ?? '').trim();
    if (!name_en) return fail(400, { msg: 'Name required' });
    await platform.env.DB.prepare(
      `INSERT INTO services (category, name_en, name_id, description_en, description_id,
         price_idr, duration_min, male_only, price_from_only, requires_address,
         travel_buffer_min, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        category,
        name_en,
        String(f.get('name_id') ?? '').trim() || name_en,
        String(f.get('description_en') ?? '').trim() || null,
        String(f.get('description_id') ?? '').trim() || null,
        num(f.get('price_idr')),
        num(f.get('duration_min'), 30),
        chk(f.get('male_only')),
        chk(f.get('price_from_only')),
        chk(f.get('requires_address')),
        num(f.get('travel_buffer_min')),
        num(f.get('sort_order'), 900)
      )
      .run();
    return { created: true };
  },

  remove: async ({ request, platform }) => {
    if (!platform) return fail(500);
    const f = await request.formData();
    const id = num(f.get('id'));
    try {
      await platform.env.DB.prepare('DELETE FROM services WHERE id=?').bind(id).run();
      return { ok: true };
    } catch {
      // Referenced by existing bookings — deactivate instead of breaking history.
      await platform.env.DB.prepare('UPDATE services SET active=0 WHERE id=?').bind(id).run();
      return { deactivated: true };
    }
  }
};
