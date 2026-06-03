import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listServices, type ServiceCategory } from '$lib/db';

const CATEGORIES: ServiceCategory[] = ['package', 'onsite', 'oncall'];

export const load: PageServerLoad = async ({ url, platform }) => {
  const cat = url.searchParams.get('cat') as ServiceCategory | null;
  if (!cat || !CATEGORIES.includes(cat)) throw error(400, 'Invalid category');
  if (!platform) throw error(500, 'platform not bound');
  const all = await listServices(platform.env.DB);
  const services = all.filter((s) => s.category === cat);
  return { category: cat, services };
};
