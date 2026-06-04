import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { listBarbers } from '$lib/db';
import { loadFlow } from '$lib/flow';

export const load: PageServerLoad = async ({ cookies, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const flow = loadFlow(cookies);
  if (!flow.baseServiceId) throw redirect(302, '/');
  return { barbers: await listBarbers(platform.env.DB) };
};
