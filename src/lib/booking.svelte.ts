import type { Service } from './db';

export interface BookingState {
  base: Service | null;
  addons: Service[];
  barberId: number | null | undefined; // undefined = not chosen, null = any
  barberName: string | null;
  startsAt: string | undefined;
  lang: 'en' | 'id';
}

export interface PrimaryAction {
  label: string;
  disabled: boolean;
  run: () => void;
}

/** Live selection state — seeded from the server on each navigation,
 *  mutated optimistically by step pages so the summary panel updates instantly. */
export const booking: BookingState = $state({
  base: null,
  addons: [],
  barberId: undefined,
  barberName: null,
  startsAt: undefined,
  lang: 'en'
});

/** The current step's primary button, surfaced in the summary panel + mobile bar. */
export const ui: { action: PrimaryAction | null } = $state({ action: null });

export function seedBooking(s: Partial<BookingState>) {
  Object.assign(booking, s);
}

export function totalPrice(): number {
  return (booking.base?.price_idr ?? 0) + booking.addons.reduce((s, a) => s + a.price_idr, 0);
}

export function totalDuration(): number {
  return (
    (booking.base?.duration_min ?? 0) +
    (booking.base?.travel_buffer_min ?? 0) +
    booking.addons.reduce((s, a) => s + a.duration_min, 0)
  );
}

export function hasFromPrice(): boolean {
  if (booking.base?.price_from_only) return true;
  return booking.addons.some((a) => a.price_from_only);
}

export function idr(n: number): string {
  return 'IDR ' + n.toLocaleString('id-ID');
}

export function commitFlow(patch: Record<string, unknown>): Promise<Response> {
  return fetch('/api/flow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  });
}
