import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getService } from '$lib/db';
import { loadFlow } from '$lib/flow';

export const load: PageServerLoad = async ({ cookies, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const flow = loadFlow(cookies);
  if (!flow.baseServiceId) throw redirect(302, '/');
  const base = await getService(platform.env.DB, flow.baseServiceId);
  if (!base) throw redirect(302, '/');
  return {
    base,
    barberId: flow.barberId ?? null,
    addonIds: flow.addonIds
  };
};
