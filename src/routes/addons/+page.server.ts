import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { listServices } from '$lib/db';
import { loadFlow } from '$lib/flow';

export const load: PageServerLoad = async ({ cookies, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const flow = loadFlow(cookies);
  if (!flow.baseServiceId) throw redirect(302, '/');
  const all = await listServices(platform.env.DB);
  const base = all.find((s) => s.id === flow.baseServiceId);
  if (!base) throw redirect(302, '/');
  const addons = all.filter((s) => s.category === 'addon');
  return {
    base,
    addons,
    selectedAddonIds: flow.addonIds
  };
};
