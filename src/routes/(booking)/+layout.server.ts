import type { LayoutServerLoad } from './$types';
import { listServices, listBarbers } from '$lib/db';
import { loadFlow } from '$lib/flow';

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
  const flow = loadFlow(cookies);
  const empty = {
    base: null,
    addons: [],
    barberId: flow.barberId,
    barberName: null as string | null,
    startsAt: flow.startsAt
  };
  if (!platform) return { summary: empty };

  const [services, barbers] = await Promise.all([
    listServices(platform.env.DB),
    listBarbers(platform.env.DB)
  ]);

  const base = services.find((s) => s.id === flow.baseServiceId) ?? null;
  const addons = services.filter((s) => s.category === 'addon' && flow.addonIds.includes(s.id));
  const barber =
    typeof flow.barberId === 'number' ? (barbers.find((b) => b.id === flow.barberId) ?? null) : null;

  return {
    summary: {
      base,
      addons,
      barberId: flow.barberId,
      barberName: barber?.name ?? null,
      startsAt: flow.startsAt
    }
  };
};
