// Structural D1 types — avoids version skew between @cloudflare/workers-types
// imported here and the adapter-cloudflare-bundled types.
interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: { last_row_id: number; changes: number };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}

export type ServiceCategory = 'package' | 'onsite' | 'addon' | 'oncall';

export interface Service {
  id: number;
  category: ServiceCategory;
  name_en: string;
  name_id: string;
  description_en: string | null;
  description_id: string | null;
  price_idr: number;
  duration_min: number;
  male_only: number;
  price_from_only: number;
  requires_address: number;
  travel_buffer_min: number;
  sort_order: number;
  active: number;
}

export interface Barber {
  id: number;
  name: string;
  photo_url: string | null;
  sort_order: number;
  active: number;
}

export interface WorkingHour {
  barber_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface Booking {
  id: number;
  customer_name: string;
  whatsapp_phone: string;
  email: string | null;
  barber_id: number | null;
  base_service_id: number;
  addon_ids: string;
  starts_at: string;
  ends_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  notes: string | null;
  address: string | null;
  language: 'en' | 'id';
  price_idr_total: number;
  duration_min_total: number;
  created_at: string;
  confirmed_at: string | null;
}

export async function listServices(db: D1DatabaseLike, activeOnly = true): Promise<Service[]> {
  const where = activeOnly ? 'WHERE active = 1' : '';
  const r = await db
    .prepare(`SELECT * FROM services ${where} ORDER BY sort_order ASC`)
    .all<Service>();
  return r.results;
}

export async function getService(db: D1DatabaseLike, id: number): Promise<Service | null> {
  return await db.prepare('SELECT * FROM services WHERE id = ?').bind(id).first<Service>();
}

export async function listBarbers(db: D1DatabaseLike, activeOnly = true): Promise<Barber[]> {
  const where = activeOnly ? 'WHERE active = 1' : '';
  const r = await db
    .prepare(`SELECT * FROM barbers ${where} ORDER BY sort_order ASC`)
    .all<Barber>();
  return r.results;
}

export async function listWorkingHours(db: D1DatabaseLike): Promise<WorkingHour[]> {
  const r = await db.prepare('SELECT * FROM working_hours').all<WorkingHour>();
  return r.results;
}

export async function getBookingsForRange(
  db: D1DatabaseLike,
  startsAtFrom: string,
  startsAtTo: string
): Promise<Booking[]> {
  const r = await db
    .prepare(
      `SELECT * FROM bookings
       WHERE status IN ('pending','confirmed')
         AND starts_at < ?
         AND ends_at > ?
       ORDER BY starts_at ASC`
    )
    .bind(startsAtTo, startsAtFrom)
    .all<Booking>();
  return r.results;
}

export async function getBlockedSlotsForRange(
  db: D1DatabaseLike,
  from: string,
  to: string
): Promise<{ barber_id: number | null; starts_at: string; ends_at: string }[]> {
  const r = await db
    .prepare(
      `SELECT barber_id, starts_at, ends_at FROM blocked_slots
       WHERE starts_at < ? AND ends_at > ?`
    )
    .bind(to, from)
    .all<{ barber_id: number | null; starts_at: string; ends_at: string }>();
  return r.results;
}

export async function createBooking(
  db: D1DatabaseLike,
  b: Omit<Booking, 'id' | 'created_at' | 'confirmed_at' | 'status'> & { status?: Booking['status'] }
): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO bookings
        (customer_name, whatsapp_phone, email, barber_id, base_service_id, addon_ids,
         starts_at, ends_at, status, notes, address, language,
         price_idr_total, duration_min_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      b.customer_name,
      b.whatsapp_phone,
      b.email ?? null,
      b.barber_id,
      b.base_service_id,
      b.addon_ids,
      b.starts_at,
      b.ends_at,
      b.status ?? 'pending',
      b.notes ?? null,
      b.address ?? null,
      b.language,
      b.price_idr_total,
      b.duration_min_total
    )
    .run();
  return res.meta.last_row_id;
}
