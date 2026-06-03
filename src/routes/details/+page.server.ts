import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getService, listServices } from '$lib/db';
import { loadFlow } from '$lib/flow';

export const load: PageServerLoad = async ({ cookies, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const flow = loadFlow(cookies);
  if (!flow.baseServiceId || !flow.startsAt) throw redirect(302, '/');
  const base = await getService(platform.env.DB, flow.baseServiceId);
  if (!base) throw redirect(302, '/');
  const all = await listServices(platform.env.DB);
  const addons = all.filter((s) => flow.addonIds.includes(s.id));
  const total = {
    duration_min: base.duration_min + addons.reduce((s, a) => s + a.duration_min, 0),
    price_idr: base.price_idr + addons.reduce((s, a) => s + a.price_idr, 0)
  };
  return {
    base,
    addons,
    total,
    startsAt: flow.startsAt,
    turnstileSiteKey: platform.env.TURNSTILE_SITE_KEY ?? ''
  };
};
