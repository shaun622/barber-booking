import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadFlow, saveFlow, type FlowState } from '$lib/flow';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = (await request.json().catch(() => ({}))) as Partial<FlowState>;
  const current = loadFlow(cookies);
  const next: FlowState = {
    baseServiceId:
      typeof body.baseServiceId === 'number' ? body.baseServiceId : current.baseServiceId,
    addonIds: Array.isArray(body.addonIds) ? body.addonIds : current.addonIds,
    barberId:
      body.barberId === null
        ? null
        : typeof body.barberId === 'number'
          ? body.barberId
          : current.barberId,
    startsAt: typeof body.startsAt === 'string' ? body.startsAt : current.startsAt
  };
  saveFlow(cookies, next);
  return json({ ok: true });
};
