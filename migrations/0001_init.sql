-- Balis Barber booking app — initial schema.

CREATE TABLE services (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('package','onsite','addon','oncall')),
  name_en TEXT NOT NULL,
  name_id TEXT NOT NULL,
  description_en TEXT,
  description_id TEXT,
  price_idr INTEGER NOT NULL,
  duration_min INTEGER NOT NULL,
  male_only INTEGER NOT NULL DEFAULT 0,
  price_from_only INTEGER NOT NULL DEFAULT 0,
  requires_address INTEGER NOT NULL DEFAULT 0,
  travel_buffer_min INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_services_category ON services(category, active, sort_order);

CREATE TABLE barbers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE working_hours (
  id INTEGER PRIMARY KEY,
  barber_id INTEGER NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  UNIQUE (barber_id, day_of_week)
);

CREATE TABLE blocked_slots (
  id INTEGER PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  reason TEXT
);

CREATE INDEX idx_blocked_barber_time ON blocked_slots(barber_id, starts_at, ends_at);

CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  customer_name TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE SET NULL,
  base_service_id INTEGER NOT NULL REFERENCES services(id),
  addon_ids TEXT NOT NULL DEFAULT '[]',
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','no_show','completed')),
  notes TEXT,
  address TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  price_idr_total INTEGER NOT NULL,
  duration_min_total INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

CREATE INDEX idx_bookings_starts ON bookings(starts_at);
CREATE INDEX idx_bookings_barber_starts ON bookings(barber_id, starts_at);
CREATE INDEX idx_bookings_status ON bookings(status);
