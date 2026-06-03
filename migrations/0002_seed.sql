-- Seed: services, barbers, working hours.
-- Idempotent re-seed: clear then insert.
DELETE FROM working_hours;
DELETE FROM barbers;
DELETE FROM services;

-- Packages
INSERT INTO services (id, category, name_en, name_id, description_en, description_id, price_idr, duration_min, sort_order) VALUES
  (1, 'package', 'Haircut & Shampoo', 'Potong & Cuci Rambut',
   'Haircut, Hair Wash / Shampoo, Eyebrow Trim',
   'Potong Rambut, Cuci / Sampo, Rapikan Alis',
   150000, 40, 10),
  (2, 'package', 'Haircut & Beard Trim', 'Potong & Rapikan Janggut',
   'Haircut, Beard Trim, Hair Wash / Shampoo, Neck Razor Shave',
   'Potong Rambut, Rapikan Janggut, Cuci / Sampo, Cukur Leher',
   250000, 50, 20),
  (3, 'package', 'Haircut & Clean Shave', 'Potong & Cukur Bersih',
   'Haircut, Hot Towel Shave, Hair Wash / Shampoo, Neck Razor Shave, Eyebrow Trim',
   'Potong Rambut, Cukur Handuk Panas, Cuci / Sampo, Cukur Leher, Rapikan Alis',
   300000, 50, 30);

-- On-Site
INSERT INTO services (id, category, name_en, name_id, price_idr, duration_min, male_only, sort_order) VALUES
  (4, 'onsite', 'Skin Fade / Long Hair', 'Skin Fade / Rambut Panjang', 200000, 40, 0, 110),
  (5, 'onsite', 'Buzz Cut / One Sized Clipper', 'Buzz Cut / Clipper Satu Ukuran', 100000, 30, 0, 120),
  (6, 'onsite', 'Kids Cut (under 8)', 'Potong Anak (di bawah 8)', 100000, 30, 0, 130),
  (7, 'onsite', 'Hot Towel Shave', 'Cukur Handuk Panas', 150000, 30, 1, 140),
  (8, 'onsite', 'Beard Trim & Shaping', 'Rapikan & Bentuk Janggut', 100000, 30, 1, 150);

-- Add-Ons
INSERT INTO services (id, category, name_en, name_id, price_idr, duration_min, price_from_only, sort_order) VALUES
  (9,  'addon', 'Shampoo',          'Sampo',          50000,  10, 0, 210),
  (10, 'addon', 'Neck Razor Shave', 'Cukur Leher',    50000,  10, 0, 220),
  (11, 'addon', 'Nostril Wax',      'Wax Hidung',     50000,  10, 0, 230),
  (12, 'addon', 'Ear Wax',          'Wax Telinga',    50000,  10, 0, 240),
  (13, 'addon', 'Hair Dye',         'Cat Rambut',     200000, 30, 1, 250),
  (14, 'addon', 'Beard Dye',        'Cat Janggut',    100000, 15, 1, 260);

-- On-Call
INSERT INTO services (id, category, name_en, name_id, description_en, description_id, price_idr, duration_min, requires_address, travel_buffer_min, sort_order) VALUES
  (15, 'oncall', 'Haircut at home', 'Potong di Rumah',
   'Professional barber comes to your location.',
   'Barber profesional datang ke tempat Anda.',
   250000, 60, 1, 30, 310);

-- Barbers
INSERT INTO barbers (id, name, sort_order) VALUES
  (1, 'Obet',    10),
  (2, 'Simon',   20),
  (3, 'Min Yun', 30);

-- Working hours: 09:00–19:00 every day (day_of_week 0=Sun..6=Sat) for all three barbers.
INSERT INTO working_hours (barber_id, day_of_week, open_time, close_time) VALUES
  (1, 0, '09:00', '19:00'), (1, 1, '09:00', '19:00'), (1, 2, '09:00', '19:00'),
  (1, 3, '09:00', '19:00'), (1, 4, '09:00', '19:00'), (1, 5, '09:00', '19:00'),
  (1, 6, '09:00', '19:00'),
  (2, 0, '09:00', '19:00'), (2, 1, '09:00', '19:00'), (2, 2, '09:00', '19:00'),
  (2, 3, '09:00', '19:00'), (2, 4, '09:00', '19:00'), (2, 5, '09:00', '19:00'),
  (2, 6, '09:00', '19:00'),
  (3, 0, '09:00', '19:00'), (3, 1, '09:00', '19:00'), (3, 2, '09:00', '19:00'),
  (3, 3, '09:00', '19:00'), (3, 4, '09:00', '19:00'), (3, 5, '09:00', '19:00'),
  (3, 6, '09:00', '19:00');
