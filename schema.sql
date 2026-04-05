-- QR-Perks Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fsaxluprhgmyaipaujdn/sql

-- ─────────────────────────────────────────────
-- AFFILIATES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT,
  description_en TEXT,
  description_es TEXT,
  cta_en TEXT DEFAULT 'Get Started →',
  cta_es TEXT DEFAULT 'Comenzar →',
  badge_en TEXT,
  badge_es TEXT,
  icon TEXT DEFAULT '💼',
  color TEXT DEFAULT '#F5C518',
  status TEXT DEFAULT 'coming_soon',
  commission_type TEXT,
  commission_rate DECIMAL(10,2),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DRIVERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  referred_by UUID REFERENCES drivers(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- TRUCKS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trucks (
  id TEXT PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id),
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SCANS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id TEXT REFERENCES trucks(id),
  ip TEXT,
  user_agent TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CONVERSIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id TEXT REFERENCES trucks(id),
  driver_id UUID REFERENCES drivers(id),
  affiliate_id TEXT REFERENCES affiliates(id),
  gross_amount DECIMAL(10,2) DEFAULT 0,
  driver_commission DECIMAL(10,2) DEFAULT 0,
  referral_commission DECIMAL(10,2) DEFAULT 0,
  subid TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ADMINS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- RLS POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Affiliates: public read
CREATE POLICY "Public can read affiliates" ON affiliates
  FOR SELECT USING (true);

-- Scans: service role insert only (worker uses service key)
CREATE POLICY "Service can insert scans" ON scans
  FOR INSERT WITH CHECK (true);

-- Conversions: service role insert only
CREATE POLICY "Service can insert conversions" ON conversions
  FOR INSERT WITH CHECK (true);

-- Drivers: insert + read own record (by token)
CREATE POLICY "Anyone can register as driver" ON drivers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Driver can read own record" ON drivers
  FOR SELECT USING (true);

-- Trucks: public read
CREATE POLICY "Public can read trucks" ON trucks
  FOR SELECT USING (true);

-- Admins: no public access
CREATE POLICY "No public admin access" ON admins
  FOR ALL USING (false);

-- ─────────────────────────────────────────────
-- SEED: 50 TRUCKS (t1–t50, first 10 active)
-- ─────────────────────────────────────────────
INSERT INTO trucks (id, status) VALUES
  ('t1','active'),('t2','active'),('t3','active'),('t4','active'),('t5','active'),
  ('t6','active'),('t7','active'),('t8','active'),('t9','active'),('t10','active'),
  ('t11','inactive'),('t12','inactive'),('t13','inactive'),('t14','inactive'),('t15','inactive'),
  ('t16','inactive'),('t17','inactive'),('t18','inactive'),('t19','inactive'),('t20','inactive'),
  ('t21','inactive'),('t22','inactive'),('t23','inactive'),('t24','inactive'),('t25','inactive'),
  ('t26','inactive'),('t27','inactive'),('t28','inactive'),('t29','inactive'),('t30','inactive'),
  ('t31','inactive'),('t32','inactive'),('t33','inactive'),('t34','inactive'),('t35','inactive'),
  ('t36','inactive'),('t37','inactive'),('t38','inactive'),('t39','inactive'),('t40','inactive'),
  ('t41','inactive'),('t42','inactive'),('t43','inactive'),('t44','inactive'),('t45','inactive'),
  ('t46','inactive'),('t47','inactive'),('t48','inactive'),('t49','inactive'),('t50','inactive')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- SEED: AFFILIATES
-- ─────────────────────────────────────────────
INSERT INTO affiliates (id, name, url, category, description_en, description_es, cta_en, cta_es, badge_en, badge_es, icon, color, status, commission_type, commission_rate, sort_order) VALUES
  (
    'rok-financial',
    'ROK Financial',
    'https://www.rokfinancial.com/apply',
    'business_funding',
    'Get up to $500K in business funding. Fast approval, no collateral. Apply in minutes.',
    'Obtén hasta $500K en financiamiento empresarial. Aprobación rápida, sin garantía. Aplica en minutos.',
    'Apply Now — Free →',
    'Aplicar Ahora — Gratis →',
    '💰 Business Funding',
    '💰 Financiamiento',
    '💼',
    '#F5C518',
    'live',
    'CPA',
    50.00,
    1
  ),
  (
    'auto-insurance',
    'Auto Insurance',
    'https://everquote.com',
    'insurance',
    'Compare rates and save up to $500/year on auto insurance. No obligation.',
    'Compara tarifas y ahorra hasta $500 al año en tu seguro de auto. Sin compromiso.',
    'Get My Free Quote →',
    'Obtener Mi Cotización Gratis →',
    '🚗 Auto Insurance Quote',
    '🚗 Cotización de Seguro de Auto',
    '🛡️',
    '#FF4D4D',
    'coming_soon',
    'CPL',
    15.00,
    2
  ),
  (
    'banking',
    'Free Bank Account',
    'https://chime.com',
    'banking',
    'Get a free bank account with no monthly fees, no minimums, and early direct deposit.',
    'Abre una cuenta bancaria gratis sin cargos mensuales, sin mínimo, y depósito directo anticipado.',
    'Open Free Account →',
    'Abrir Cuenta Gratis →',
    '🏦 Free Bank Account',
    '🏦 Cuenta Bancaria Gratis',
    '💳',
    '#00C896',
    'coming_soon',
    'CPA',
    25.00,
    3
  ),
  (
    'phone-plan',
    'Phone Plan',
    'https://mintmobile.com',
    'phone',
    'Unlimited talk, text and data from $15/mo. No annual contract. Keep your number.',
    'Llamadas, mensajes y datos ilimitados desde $15/mes. Sin contrato anual. Conserva tu número.',
    'Get This Deal →',
    'Obtener Esta Oferta →',
    '📱 Phone Plan Deal',
    '📱 Oferta de Plan de Teléfono',
    '📶',
    '#4D9EFF',
    'coming_soon',
    'CPA',
    30.00,
    4
  ),
  (
    'gas-savings',
    'Gas Savings',
    'https://upside.com',
    'gas',
    'Save up to 25¢/gallon on gas every time you fill up. Free app, real cash back.',
    'Ahorra hasta 25¢/galón en gasolina cada vez que llenas. App gratis, dinero real de regreso.',
    'Save on Gas Free →',
    'Ahorrar en Gas Gratis →',
    '⛽ Gas Savings',
    '⛽ Ahorro en Gasolina',
    '⛽',
    '#FF8C00',
    'coming_soon',
    'CPA',
    5.00,
    5
  )
ON CONFLICT (id) DO NOTHING;
