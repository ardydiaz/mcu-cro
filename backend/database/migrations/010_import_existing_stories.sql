-- The outreach stories already on cro.mcu.edu.ph, so the new site starts with
-- them. Their photos ship with the website (frontend/public/images/news).
INSERT INTO posts (kind, title, slug, summary, event_date, cover_url, status, published_at) VALUES
  ('activity', 'MCU x Caloocan City Health Dept: Malusog na Atay, Masayang Buhay', 'malusog-na-atay-masayang-buhay',
   'A liver health awareness activity with the Caloocan City Health Department.', '2026-04-08', '/images/news/malusog-na-atay.jpg', 'published', '2026-04-08'),
  ('activity', 'Lifeline 2026: A Blood Donation Initiative', 'lifeline-2026-blood-donation',
   'Centralinos and partners came together to donate blood.', '2026-04-08', '/images/news/lifeline-2026.jpg', 'published', '2026-04-08'),
  ('activity', 'Pusong Masigla, Ngiting Masaya', 'pusong-masigla-ngiting-masaya',
   'A community outreach activity.', '2026-04-08', '/images/news/pusong-masigla.jpg', 'published', '2026-04-08'),
  ('activity', 'A proud moment for community partnership efforts!', 'proud-moment-community-partnership',
   'Recognition for MCU''s community partnership efforts.', '2026-04-08', '/images/news/oca-awards.jpg', 'published', '2026-04-08'),
  ('activity', 'Welcome event for MCU students', 'welcome-event-mcu-students',
   'Welcoming MCU students to community engagement.', '2025-08-15', '/images/news/welcome-event.jpg', 'published', '2025-08-15'),
  ('activity', 'MCU Medical Mission', 'mcu-medical-mission',
   'Free medical services for partner communities.', '2025-03-06', '/images/news/medical-mission.jpg', 'published', '2025-03-06'),
  ('activity', 'Memorandum Signing', 'memorandum-signing',
   'Signing of a partnership memorandum.', '2025-03-04', '/images/news/memorandum-signing.jpg', 'published', '2025-03-04');
