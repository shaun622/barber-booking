import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  listServices,
  listBarbers,
  listWorkingHours,
  getBookingsForRange,
  getBlockedSlotsForRange,
  createBooking,
  getService
} from '$lib/db';
import { loadFlow, clearFlow } from '$lib/flow';
import { computeAvailability } from '$lib/availability';
import { acquireSlotLock, buildSlotKey, rateLimit } from '$lib/rateLimit';
import { sendBookingNotifications } from '$lib/notify';

async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<boolean> {
  if (!secret) return true; // not configured — skip in dev
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form
  });
  if (!res.ok) return false;
  const j: any = await res.json();
  return !!j.success;
}

export const POST: RequestHandler = async ({ request, cookies, platform, getClientAddress, locals }) => {
  if (!platform) throw error(500, 'platform not bound');
  const env = platform.env;
  const ip = getClientAddress();

  const allowed = await rateLimit(env.RATE_LIMIT, `bookings:${ip}`, 6, 60);
  if (!allowed) return new Response(JSON.stringify({ error: 'rate_limit' }), { status: 429 });

  const body = (await request.json().catch(() => ({}))) as {
    customer_name?: string;
    whatsapp_phone?: string;
    email?: string;
    address?: string | null;
    turnstileToken?: string;
    notes?: string;
  };

  const flow = loadFlow(cookies);
  if (!flow.baseServiceId || !flow.startsAt) throw error(400, 'Incomplete booking');
  const name = (body.customer_name ?? '').trim();
  const phone = (body.whatsapp_phone ?? '').replace(/\s/g, '');
  if (!name || name.length > 100) throw error(400, 'invalid_name');
  if (!/^\+?\d{8,15}$/.test(phone)) throw error(400, 'invalid_phone');
  const email = (body.email ?? '').trim() || null;
  if (email && (email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))
    throw error(400, 'invalid_email');

  if (env.TURNSTILE_SECRET) {
    const ok = await verifyTurnstile(body.turnstileToken ?? '', env.TURNSTILE_SECRET, ip);
    if (!ok) return new Response(JSON.stringify({ error: 'turnstile' }), { status: 400 });
  }

  const db = env.DB;
  const base = await getService(db, flow.baseServiceId);
  if (!base) throw error(400, 'unknown_service');

  if (base.requires_address && !body.address?.trim()) throw error(400, 'missing_address');

  const [allServices, barbers, workingHours] = await Promise.all([
    listServices(db),
    listBarbers(db),
    listWorkingHours(db)
  ]);
  const addons = allServices.filter(
    (s) => s.category === 'addon' && flow.addonIds.includes(s.id)
  );

  const date = flow.startsAt.slice(0, 10);
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
  const chosen = slots.find((s) => s.starts_at === flow.startsAt);
  if (!chosen) return new Response(JSON.stringify({ error: 'slot_taken' }), { status: 409 });

  const assignedBarberId =
    flow.barberId == null ? chosen.available_barber_ids[0] : flow.barberId;

  const lockKey = buildSlotKey(assignedBarberId, flow.startsAt);
  const locked = await acquireSlotLock(env.SLOT_LOCKS, lockKey, 600);
  if (!locked) return new Response(JSON.stringify({ error: 'slot_taken' }), { status: 409 });

  const totalDuration =
    base.duration_min + addons.reduce((s, a) => s + a.duration_min, 0) + base.travel_buffer_min;
  const totalPrice = base.price_idr + addons.reduce((s, a) => s + a.price_idr, 0);
  const endsAt = new Date(
    Date.parse(flow.startsAt) + totalDuration * 60_000
  )
    .toISOString()
    .replace('Z', '+00:00');

  const id = await createBooking(db, {
    customer_name: name,
    whatsapp_phone: phone,
    email,
    barber_id: assignedBarberId,
    base_service_id: base.id,
    addon_ids: JSON.stringify(addons.map((a) => a.id)),
    starts_at: flow.startsAt,
    ends_at: endsAt,
    notes: body.notes ?? null,
    address: base.requires_address ? (body.address ?? '').trim() : null,
    language: locals.lang ?? 'en',
    price_idr_total: totalPrice,
    duration_min_total: totalDuration
  });

  clearFlow(cookies);

  const booking = {
    id,
    customer_name: name,
    whatsapp_phone: phone,
    email,
    barber_id: assignedBarberId,
    base_service_id: base.id,
    addon_ids: JSON.stringify(addons.map((a) => a.id)),
    starts_at: flow.startsAt,
    ends_at: endsAt,
    status: 'pending' as const,
    notes: body.notes ?? null,
    address: base.requires_address ? (body.address ?? '').trim() : null,
    language: locals.lang ?? 'en',
    price_idr_total: totalPrice,
    duration_min_total: totalDuration,
    created_at: new Date().toISOString(),
    confirmed_at: null
  };

  const barber = barbers.find((b) => b.id === assignedBarberId) ?? null;
  platform.context.waitUntil(
    sendBookingNotifications({ booking, baseService: base, addons, barber, env })
  );

  return json({ id });
};
