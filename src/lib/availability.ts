import type { Barber, Booking, Service, WorkingHour } from './db';
import { dayOfWeek, formatHm, hmToMin, localMinToWitaIso, parseDateString } from './time';

const SLOT_GRANULARITY_MIN = 15;

interface BusyInterval {
  start: number; // minutes since midnight (local WITA)
  end: number;
}

interface BarberDayContext {
  barber: Barber;
  open: number;
  close: number;
  busy: BusyInterval[];
}

export interface SlotResult {
  /** ISO at +08:00, e.g. "2026-06-04T09:30:00+08:00" */
  starts_at: string;
  /** "HH:MM" wall-clock label */
  label: string;
  /** barbers that can take this slot at this time */
  available_barber_ids: number[];
}

export interface AvailabilityInput {
  date: string; // YYYY-MM-DD
  baseService: Service;
  addons: Service[];
  barbers: Barber[];
  workingHours: WorkingHour[];
  existingBookings: Booking[];
  blockedSlots: { barber_id: number | null; starts_at: string; ends_at: string }[];
  filterBarberId?: number | null; // null => any barber
}

function isoToLocalMinutes(iso: string): number {
  // The ISO has +08:00 — extract hh:mm directly.
  // Format: YYYY-MM-DDTHH:MM:SS+08:00
  const m = /T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return 0;
  return +m[1] * 60 + +m[2];
}

function isoDate(iso: string): string {
  return iso.slice(0, 10);
}

export function computeAvailability(input: AvailabilityInput): SlotResult[] {
  const { date, baseService, addons, barbers, workingHours, existingBookings, blockedSlots, filterBarberId } = input;
  const { y, mo, d } = parseDateString(date);
  const dow = dayOfWeek(y, mo, d);

  const totalDuration =
    baseService.duration_min + addons.reduce((s, a) => s + a.duration_min, 0);
  const travelBuffer = baseService.travel_buffer_min;
  const reservedSpan = totalDuration + travelBuffer;

  const selectableBarbers =
    filterBarberId == null
      ? barbers.filter((b) => b.active)
      : barbers.filter((b) => b.active && b.id === filterBarberId);

  const contexts: BarberDayContext[] = [];
  for (const barber of selectableBarbers) {
    const wh = workingHours.find((w) => w.barber_id === barber.id && w.day_of_week === dow);
    if (!wh) continue; // not working
    const open = hmToMin(wh.open_time);
    const close = hmToMin(wh.close_time);
    const busy: BusyInterval[] = [];

    for (const b of existingBookings) {
      if (b.barber_id !== null && b.barber_id !== barber.id) continue; // someone else's booking
      if (isoDate(b.starts_at) !== date && isoDate(b.ends_at) !== date) continue;
      const s = isoToLocalMinutes(b.starts_at);
      const e = isoToLocalMinutes(b.ends_at);
      busy.push({ start: s, end: e });
    }

    for (const block of blockedSlots) {
      if (block.barber_id !== null && block.barber_id !== barber.id) continue;
      if (isoDate(block.starts_at) !== date && isoDate(block.ends_at) !== date) continue;
      busy.push({
        start: isoToLocalMinutes(block.starts_at),
        end: isoToLocalMinutes(block.ends_at)
      });
    }

    busy.sort((a, b) => a.start - b.start);
    contexts.push({ barber, open, close, busy });
  }

  const candidateStarts: number[] = [];
  if (contexts.length > 0) {
    const earliestOpen = Math.min(...contexts.map((c) => c.open));
    const latestClose = Math.max(...contexts.map((c) => c.close));
    for (let t = earliestOpen; t + reservedSpan <= latestClose; t += SLOT_GRANULARITY_MIN) {
      candidateStarts.push(t);
    }
  }

  const slots: SlotResult[] = [];
  for (const start of candidateStarts) {
    const end = start + reservedSpan;
    const availableBarberIds: number[] = [];
    for (const ctx of contexts) {
      if (start < ctx.open || end > ctx.close) continue;
      const conflict = ctx.busy.some((b) => start < b.end && end > b.start);
      if (!conflict) availableBarberIds.push(ctx.barber.id);
    }
    if (availableBarberIds.length === 0) continue;
    slots.push({
      starts_at: localMinToWitaIso(y, mo, d, start),
      label: formatHm(start),
      available_barber_ids: availableBarberIds
    });
  }

  return slots;
}
