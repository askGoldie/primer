-- =============================================================================
-- Seed 02: Users
-- Depends on: migration 20260101000002_users.sql
--
-- Inserts five Meridian Construction characters and sixty-nine Primer Internal
-- personas into the public.users profile table.
--
-- Meridian users have real Supabase Auth accounts created separately via the
-- Admin API (not this file). Their password_hash is NULL — authentication is
-- delegated to Supabase Auth.
--
-- Primer Internal personas are fictional accounts used exclusively through the
-- primer_perspective cookie mechanism. They have no Supabase Auth accounts and
-- no password_hash. They are never used for direct login.
--
-- UUID conventions:
--   Meridian users: 00000000-0000-4000-a000-{12-digit index}
--   Primer Internal:  00000000-0000-4000-b000-{12-digit index}
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Meridian Construction — five demo characters
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, name, locale, email_verified, is_admin) VALUES
  ('00000000-0000-4000-a000-000000000001', 'demo@primer.company',        'Hans Ruber',    'en', TRUE, FALSE),
  ('00000000-0000-4000-a000-000000000002', 'marcus@demo.primer.company', 'Marcus Chen',   'en', TRUE, FALSE),
  ('00000000-0000-4000-a000-000000000003', 'rachel@demo.primer.company', 'Rachel Torres', 'en', TRUE, FALSE),
  ('00000000-0000-4000-a000-000000000004', 'james@demo.primer.company',  'James Park',    'en', TRUE, FALSE),
  ('00000000-0000-4000-a000-000000000005', 'nina@demo.primer.company',   'Nina Okafor',   'en', TRUE, FALSE);

-- ---------------------------------------------------------------------------
-- Primer Internal — sixty-nine fictional personas (public.users only)
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, name, locale, email_verified, is_admin) VALUES

  -- CEO (index 1)
  ('00000000-0000-4000-b000-000000000001', 'alex.rivera@primer.internal',     'Alex Rivera',     'en', TRUE, FALSE),

  -- VPs (indices 10, 20, 30, 40)
  ('00000000-0000-4000-b000-000000000010', 'jordan.lee@primer.internal',      'Jordan Lee',      'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000020', 'sam.patel@primer.internal',       'Sam Patel',       'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000030', 'morgan.kim@primer.internal',      'Morgan Kim',      'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000040', 'casey.chen@primer.internal',      'Casey Chen',      'en', TRUE, FALSE),

  -- Directors — Operations (indices 11–14)
  ('00000000-0000-4000-b000-000000000011', 'taylor.brooks@primer.internal',   'Taylor Brooks',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000012', 'reese.donovan@primer.internal',   'Reese Donovan',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000013', 'jamie.navarro@primer.internal',   'Jamie Navarro',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000014', 'quinn.mercer@primer.internal',    'Quinn Mercer',    'en', TRUE, FALSE),

  -- Directors — Engineering (indices 21–25)
  ('00000000-0000-4000-b000-000000000021', 'hayden.park@primer.internal',     'Hayden Park',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000022', 'drew.castillo@primer.internal',   'Drew Castillo',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000023', 'blake.andersen@primer.internal',  'Blake Andersen',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000024', 'shiloh.bergman@primer.internal',  'Shiloh Bergman',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000025', 'micah.romano@primer.internal',    'Micah Romano',    'en', TRUE, FALSE),

  -- Directors — Finance (indices 31–33)
  ('00000000-0000-4000-b000-000000000031', 'rory.langston@primer.internal',   'Rory Langston',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000032', 'frankie.novak@primer.internal',   'Frankie Novak',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000033', 'dakota.webb@primer.internal',     'Dakota Webb',     'en', TRUE, FALSE),

  -- Directors — Sales (indices 41–44)
  ('00000000-0000-4000-b000-000000000041', 'devon.hartley@primer.internal',   'Devon Hartley',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000042', 'avery.thornton@primer.internal',  'Avery Thornton',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000043', 'robin.caldwell@primer.internal',  'Robin Caldwell',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000044', 'parker.ellison@primer.internal',  'Parker Ellison',  'en', TRUE, FALSE),

  -- ICs — under Taylor Brooks / Logistics (indices 111–113)
  ('00000000-0000-4000-b000-000000000111', 'riley.adams@primer.internal',     'Riley Adams',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000112', 'emery.sullivan@primer.internal',  'Emery Sullivan',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000113', 'skyler.grant@primer.internal',    'Skyler Grant',    'en', TRUE, FALSE),

  -- ICs — under Reese Donovan / Quality (indices 121–123)
  ('00000000-0000-4000-b000-000000000121', 'finley.ward@primer.internal',     'Finley Ward',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000122', 'rowan.blake@primer.internal',     'Rowan Blake',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000123', 'jesse.mitchell@primer.internal',  'Jesse Mitchell',  'en', TRUE, FALSE),

  -- ICs — under Jamie Navarro / Facilities (indices 131–133)
  ('00000000-0000-4000-b000-000000000131', 'harper.ellis@primer.internal',    'Harper Ellis',    'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000132', 'kai.ramirez@primer.internal',     'Kai Ramirez',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000133', 'phoenix.torres@primer.internal',  'Phoenix Torres',  'en', TRUE, FALSE),

  -- ICs — under Quinn Mercer / Procurement (indices 141–143)
  ('00000000-0000-4000-b000-000000000141', 'lennox.sato@primer.internal',     'Lennox Sato',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000142', 'marley.okafor@primer.internal',   'Marley Okafor',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000143', 'river.chen@primer.internal',      'River Chen',      'en', TRUE, FALSE),

  -- ICs — under Hayden Park / Product (indices 211–213)
  ('00000000-0000-4000-b000-000000000211', 'cameron.vega@primer.internal',    'Cameron Vega',    'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000212', 'ashton.cruz@primer.internal',     'Ashton Cruz',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000213', 'peyton.lam@primer.internal',      'Peyton Lam',      'en', TRUE, FALSE),

  -- ICs — under Drew Castillo / Infrastructure (indices 221–223)
  ('00000000-0000-4000-b000-000000000221', 'logan.mueller@primer.internal',   'Logan Mueller',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000222', 'kendall.nair@primer.internal',    'Kendall Nair',    'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000223', 'tatum.kowalski@primer.internal',  'Tatum Kowalski',  'en', TRUE, FALSE),

  -- ICs — under Blake Andersen / QA (indices 231–233)
  ('00000000-0000-4000-b000-000000000231', 'marlowe.fischer@primer.internal', 'Marlowe Fischer', 'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000232', 'ellis.tanaka@primer.internal',    'Ellis Tanaka',    'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000233', 'arden.osei@primer.internal',      'Arden Osei',      'en', TRUE, FALSE),

  -- ICs — under Shiloh Bergman / Data (indices 241–243)
  ('00000000-0000-4000-b000-000000000241', 'jules.nakamura@primer.internal',  'Jules Nakamura',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000242', 'remy.dubois@primer.internal',     'Remy Dubois',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000243', 'sage.lindgren@primer.internal',   'Sage Lindgren',   'en', TRUE, FALSE),

  -- ICs — under Micah Romano / Security (indices 251–253)
  ('00000000-0000-4000-b000-000000000251', 'oakley.frazier@primer.internal',  'Oakley Frazier',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000252', 'briar.hoffman@primer.internal',   'Briar Hoffman',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000253', 'lane.prescott@primer.internal',   'Lane Prescott',   'en', TRUE, FALSE),

  -- ICs — under Rory Langston / Accounting (indices 311–313)
  ('00000000-0000-4000-b000-000000000311', 'wren.gallagher@primer.internal',  'Wren Gallagher',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000312', 'hollis.sinclair@primer.internal', 'Hollis Sinclair', 'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000313', 'noel.carmichael@primer.internal', 'Noel Carmichael', 'en', TRUE, FALSE),

  -- ICs — under Frankie Novak / FP&A (indices 321–323)
  ('00000000-0000-4000-b000-000000000321', 'sutton.price@primer.internal',    'Sutton Price',    'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000322', 'campbell.voss@primer.internal',   'Campbell Voss',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000323', 'bellamy.cross@primer.internal',   'Bellamy Cross',   'en', TRUE, FALSE),

  -- ICs — under Dakota Webb / Treasury (indices 331–333)
  ('00000000-0000-4000-b000-000000000331', 'harlow.keating@primer.internal',  'Harlow Keating',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000332', 'haven.brandt@primer.internal',    'Haven Brandt',    'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000333', 'sterling.marsh@primer.internal',  'Sterling Marsh',  'en', TRUE, FALSE),

  -- ICs — under Devon Hartley / Enterprise Sales (indices 411–413)
  ('00000000-0000-4000-b000-000000000411', 'shay.callahan@primer.internal',   'Shay Callahan',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000412', 'torin.mcbride@primer.internal',   'Torin McBride',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000413', 'corin.ashworth@primer.internal',  'Corin Ashworth',  'en', TRUE, FALSE),

  -- ICs — under Avery Thornton / SMB Sales (indices 421–423)
  ('00000000-0000-4000-b000-000000000421', 'scout.hensley@primer.internal',   'Scout Hensley',   'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000422', 'perry.cunningham@primer.internal','Perry Cunningham', 'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000423', 'dallas.wakefield@primer.internal','Dallas Wakefield', 'en', TRUE, FALSE),

  -- ICs — under Robin Caldwell / Partnerships (indices 431–433)
  ('00000000-0000-4000-b000-000000000431', 'wynne.beaumont@primer.internal',  'Wynne Beaumont',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000432', 'linden.chow@primer.internal',     'Linden Chow',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000433', 'arbor.delgado@primer.internal',   'Arbor Delgado',   'en', TRUE, FALSE),

  -- ICs — under Parker Ellison / Sales Ops (indices 441–443)
  ('00000000-0000-4000-b000-000000000441', 'kit.brennan@primer.internal',     'Kit Brennan',     'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000442', 'darcy.whitmore@primer.internal',  'Darcy Whitmore',  'en', TRUE, FALSE),
  ('00000000-0000-4000-b000-000000000443', 'sasha.volkov@primer.internal',    'Sasha Volkov',    'en', TRUE, FALSE);
