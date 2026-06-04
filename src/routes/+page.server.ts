import type { PageServerLoad } from './$types';
import { listServices, type ServiceCategory } from '$lib/db';

export const load: PageServerLoad = async ({ platform }) => {
  const fallback = { package: 150000, onsite: 100000, oncall: 250000 } as Record<string, number>;
  if (!platform) return { fromPrice: fallback };
  try {
    const services = await listServices(platform.env.DB);
    const fromPrice: Record<string, number> = {};
    for (const s of services) {
      const c = s.category as ServiceCategory;
      if (c === 'addon') continue;
      if (fromPrice[c] === undefined || s.price_idr < fromPrice[c]) fromPrice[c] = s.price_idr;
    }
    return { fromPrice: { ...fallback, ...fromPrice } };
  } catch {
    return { fromPrice: fallback };
  }
};
