import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { loadFlow } from '$lib/flow';

export const load: PageServerLoad = async ({ cookies, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const flow = loadFlow(cookies);
  if (!flow.baseServiceId) throw redirect(302, '/');
  if (flow.barberId === undefined) throw redirect(302, '/barber');
  return {};
};
