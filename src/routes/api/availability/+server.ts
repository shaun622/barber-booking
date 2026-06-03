import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  listBarbers,
  listServices,
  listWorkingHours,
  getBookingsForRange,
  getBlockedSlotsForRange
} from '$lib/db';
import { loadFlow } from '$lib/flow';
import { computeAvailability } from '$lib/availability';

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
  if (!platform) throw error(500, 'platform not bound');
  const body = (await request.json().catch(() => ({}))) as { date?: string };
  const date = body.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw error(400, 'date must be YYYY-MM-DD');
  }
  const flow = loadFlow(cookies);
  if (!flow.baseServiceId) throw error(400, 'No service selected');

  const db = platform.env.DB;
  const [allServices, barbers, workingHours] = await Promise.all([
    listServices(db),
    listBarbers(db),
    listWorkingHours(db)
  ]);
  const base = allServices.find((s) => s.id === flow.baseServiceId);
  if (!base) throw error(400, 'Unknown service');
  const addons = allServices.filter((s) => flow.addonIds.includes(s.id));

  const from = `${date}T00:00:00+08:00`;
  const to = `${date}T23:59:59+08:00`;
  const [existingBookings, blockedSlots] = await Promise.all([
    getBookingsForRange(db, from, to),
    getBlockedSlotsForRange(db, from, to)
  ]);

  const slots = computeAvailability({
    date,
    baseService: base,
    addons,
    barbers,
    workingHours,
    existingBookings,
    blockedSlots,
    filterBarberId: flow.barberId ?? null
  });

  return json({ slots });
};
