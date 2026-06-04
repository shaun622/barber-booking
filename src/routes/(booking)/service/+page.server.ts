import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { listServices, type ServiceCategory } from '$lib/db';

const CATS: ServiceCategory[] = ['package', 'onsite', 'oncall'];

export const load: PageServerLoad = async ({ url, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const cat = url.searchParams.get('cat') as ServiceCategory | null;
  const initialCat = cat && CATS.includes(cat) ? cat : 'package';
  const all = await listServices(platform.env.DB);
  return {
    groups: {
      package: all.filter((s) => s.category === 'package'),
      onsite: all.filter((s) => s.category === 'onsite'),
      oncall: all.filter((s) => s.category === 'oncall')
    },
    initialCat
  };
};
