// QR-Perks Cloudflare Worker
// Single file — handles all routes for qr-perks.com
// Env vars required: SUPABASE_URL, SUPABASE_PUBLISHABLE, SUPABASE_SECRET, ADMIN_PASSWORD

const FALLBACK_AFFILIATES = [
  {
    id: 'paypal-sweeps', name: 'Win $1000 PayPal Cash', category: 'sweepstakes',
    description_en: 'Enter to win $1,000 PayPal Cash. Free entry, instant prizes!',
    description_es: 'Participa para ganar $1,000 en efectivo PayPal. ¡Entrada gratis!',
    cta_en: 'Enter Free Now →', cta_es: 'Participar Gratis →',
    badge_en: '🎰 Win $1,000 Cash', badge_es: '🎰 Gana $1,000 en Efectivo',
    icon: '💵', color: '#009CDE', status: 'active'
  },
  {
    id: 'walmart-sweeps', name: 'Win $1000 Walmart Gift Card', category: 'sweepstakes',
    description_en: 'Enter to win a $1,000 Walmart Gift Card. Free entry, no purchase necessary!',
    description_es: '¡Participa para ganar una tarjeta de regalo Walmart de $1,000. Entrada gratis!',
    cta_en: 'Enter Free Now →', cta_es: 'Participar Gratis →',
    badge_en: '🎰 Win $1,000 Gift Card', badge_es: '🎰 Gana $1,000 en Tarjeta',
    icon: '🛒', color: '#0071CE', status: 'active'
  },
  {
    id: 'maybelline', name: 'Free Maybelline Set', category: 'sweepstakes',
    description_en: 'Claim your free Maybelline makeup set. Limited time offer!',
    description_es: '¡Reclama tu set de maquillaje Maybelline gratis. Oferta limitada!',
    cta_en: 'Claim Free Set →', cta_es: 'Reclamar Gratis →',
    badge_en: '🎁 Free Beauty Set', badge_es: '🎁 Set de Belleza Gratis',
    icon: '💄', color: '#FF69B4', status: 'active'
  },
  {
    id: 'slam-dunk-loans', name: 'Get Cash Fast — Up to $50K', category: 'loans',
    description_en: 'Need cash fast? Get personal loans up to $50,000. Quick approval, flexible terms.',
    description_es: '¿Necesitas dinero rápido? Préstamos hasta $50,000. Aprobación rápida.',
    cta_en: 'Get Cash Now →', cta_es: 'Obtener Dinero →',
    badge_en: '💰 Personal Loans Up to $50K', badge_es: '💰 Préstamos Hasta $50K',
    icon: '🏀', color: '#FF6B00', status: 'active'
  },
  {
    id: 'rok-financial', name: 'ROK Financial', category: 'business_funding',
    description_en: 'Get up to $500K in business funding. Fast approvals, flexible terms.',
    description_es: 'Obtén hasta $500K en financiamiento. Aprobaciones rápidas, términos flexibles.',
    cta_en: 'Apply Now — Free →', cta_es: 'Aplicar Ahora — Gratis →',
    badge_en: '💰 Business Funding', badge_es: '💰 Financiamiento',
    icon: '💼', color: '#F5C518', status: 'active'
  }
];

// ──────────────────────────────────────────────────────────────────
// MAIN FETCH HANDLER
// ──────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method;

    // QR truck routes: /t1 → /t50
    if (/^\/t([1-9]|[1-4]\d|50)$/.test(path)) {
      return handleTruck(request, env, path.slice(1));
    }

    switch (path) {
      case '/': return handleHome(request, env);
      case '/driver': return handleDriverPage(request, env);
      case '/driver/dashboard': return handleDriverDashboard(request, env);
      case '/admin': return handleAdminPage(request, env);
      case '/admin/dashboard': return handleAdminDashboard(request, env);
      case '/privacy': return staticPage('privacy');
      case '/terms': return staticPage('terms');
      case '/disclosure': return staticPage('disclosure');
      case '/contractor': return staticPage('contractor');
    }

    if (path.startsWith('/go/') && method === 'GET') return handleGo(request, env, path);
    if (path === '/api/affiliates') return handleApiAffiliates(request, env);
    if (path === '/api/driver/register' && method === 'POST') return handleDriverRegister(request, env);
    if (path === '/api/driver/login' && method === 'POST') return handleDriverLogin(request, env);
    if (path === '/api/admin/login' && method === 'POST') return handleAdminLogin(request, env);
    if (path === '/api/admin/data' && method === 'GET') return handleAdminData(request, env);
    if (path === '/api/driver/data' && method === 'GET') return handleDriverData(request, env);
    if (path === '/api/email/subscribe' && method === 'POST') return handleEmailSubscribe(request, env);

    return new Response('Not Found', { status: 404 });
  }
};

// ──────────────────────────────────────────────────────────────────
// SUPABASE HELPERS
// ──────────────────────────────────────────────────────────────────
function sbHeaders(env) {
  return {
    'apikey': env.SUPABASE_SECRET,
    'Authorization': `Bearer ${env.SUPABASE_SECRET}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function sbGet(env, table, query = '') {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: sbHeaders(env)
  });
  if (!res.ok) return null;
  return res.json();
}

async function sbPost(env, table, data) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: sbHeaders(env),
    body: JSON.stringify(data)
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function sbRpc(env, fn, params = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: sbHeaders(env),
    body: JSON.stringify(params)
  });
  if (!res.ok) return null;
  return res.json();
}

// ──────────────────────────────────────────────────────────────────
// TRUCK QR HANDLER — /t1 through /t50
// ──────────────────────────────────────────────────────────────────
async function handleTruck(request, env, truckId) {
  // Log scan async (don't await — keep redirect fast)
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const country = request.headers.get('CF-IPCountry') || '';
  const ua = request.headers.get('User-Agent') || '';

  const scanPromise = sbPost(env, 'scans', {
    truck_id: truckId, ip, country, user_agent: ua
  }).catch(() => {});

  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': `/?t=${truckId}`,
      'Set-Cookie': `qrp_truck=${truckId}; Path=/; Max-Age=86400; SameSite=Lax`,
      'Cache-Control': 'no-store'
    }
  });

  // Use waitUntil if available (Cloudflare Workers pattern)
  if (typeof scanPromise !== 'undefined') {
    // Fire and forget — scan is logged without delaying redirect
  }

  return response;
}

// ──────────────────────────────────────────────────────────────────
// GO HANDLER — /go/{affiliate_id} — tracks click + redirects
// ──────────────────────────────────────────────────────────────────
async function handleGo(request, env, path) {
  const affiliateId = path.replace('/go/', '');
  const url = new URL(request.url);
  const truckId = url.searchParams.get('t') || getCookie(request, 'qrp_truck') || 'unknown';

  // Get affiliate URL from Supabase or fallback
  let destUrl = null;
  try {
    const rows = await sbGet(env, 'affiliates', `id=eq.${affiliateId}&select=url`);
    if (rows && rows[0]) destUrl = rows[0].url;
  } catch (e) {}

  if (!destUrl) {
    const fb = FALLBACK_AFFILIATES.find(a => a.id === affiliateId);
    destUrl = fb ? fb.url : 'https://qr-perks.com';
  }

  // Append truck attribution to URL
  const dest = new URL(destUrl);
  dest.searchParams.set('s2', `qrp_${truckId}`);
  dest.searchParams.set('utm_source', 'qrperks');
  dest.searchParams.set('utm_medium', 'qr');
  dest.searchParams.set('utm_campaign', truckId);

  return Response.redirect(dest.toString(), 302);
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

// ──────────────────────────────────────────────────────────────────
// API: AFFILIATES
// ──────────────────────────────────────────────────────────────────
async function handleApiAffiliates(request, env) {
  try {
    const rows = await sbGet(env, 'affiliates', 'select=*&order=sort_order.asc');
    if (rows) return jsonResponse(rows);
  } catch (e) {}
  return jsonResponse(FALLBACK_AFFILIATES);
}

// ──────────────────────────────────────────────────────────────────
// API: DRIVER REGISTER
// ──────────────────────────────────────────────────────────────────
// EMAIL SUBSCRIBE — POST /api/email/subscribe
async function handleEmailSubscribe(request, env) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: 'Valid email required' }, 400);
    }
    const truckId = body.truck_id || null;
    const lang = body.lang || 'en';
    await sbPost(env, 'email_signups', { email, truck_id: truckId, lang });
    return jsonResponse({ ok: true });
  } catch (e) {
    // Duplicate email — still return ok (idempotent)
    return jsonResponse({ ok: true });
  }
}

async function handleDriverRegister(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { name, phone, email, referred_by_truck } = body;
  if (!name || (!phone && !email)) {
    return jsonResponse({ error: 'Name and phone or email required' }, 400);
  }

  // Check if driver already exists
  const query = phone ? `phone=eq.${encodeURIComponent(phone)}` : `email=eq.${encodeURIComponent(email)}`;
  const existing = await sbGet(env, 'drivers', `${query}&select=id,token`);
  if (existing && existing[0]) {
    return jsonResponse({ token: existing[0].token, existing: true });
  }

  const driverData = { name };
  if (phone) driverData.phone = phone;
  if (email) driverData.email = email;

  const result = await sbPost(env, 'drivers', driverData);
  if (!result || !result[0]) return jsonResponse({ error: 'Registration failed' }, 500);

  return jsonResponse({ token: result[0].token, id: result[0].id });
}

// ──────────────────────────────────────────────────────────────────
// API: DRIVER LOGIN (by token)
// ──────────────────────────────────────────────────────────────────
async function handleDriverLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { token } = body;
  if (!token) return jsonResponse({ error: 'Token required' }, 400);

  const rows = await sbGet(env, 'drivers', `token=eq.${token}&select=id,name,token`);
  if (!rows || !rows[0]) return jsonResponse({ error: 'Invalid token' }, 401);

  return jsonResponse({ driver: rows[0] });
}

// ──────────────────────────────────────────────────────────────────
// API: ADMIN LOGIN
// ──────────────────────────────────────────────────────────────────
async function handleAdminLogin(request, env) {
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const { password } = body;
  if (!password || password !== env.ADMIN_PASSWORD) {
    return jsonResponse({ error: 'Invalid password' }, 401);
  }

  const sessionToken = crypto.randomUUID();
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `qrp_admin=${sessionToken}__${btoa(env.ADMIN_PASSWORD)}; Path=/; Max-Age=28800; HttpOnly; SameSite=Strict; Secure`
    }
  });
}

function isAdminAuthed(request, env) {
  const cookie = getCookie(request, 'qrp_admin');
  if (!cookie) return false;
  const parts = cookie.split('__');
  if (parts.length < 2) return false;
  try {
    return atob(parts[1]) === env.ADMIN_PASSWORD;
  } catch { return false; }
}

// ──────────────────────────────────────────────────────────────────
// API: ADMIN DATA
// ──────────────────────────────────────────────────────────────────
async function handleAdminData(request, env) {
  if (!isAdminAuthed(request, env)) return jsonResponse({ error: 'Unauthorized' }, 401);

  const [trucks, drivers, scans, conversions, affiliates] = await Promise.all([
    sbGet(env, 'trucks', 'select=*&order=id.asc'),
    sbGet(env, 'drivers', 'select=id,name,phone,email,status,created_at&order=created_at.desc'),
    sbGet(env, 'scans', 'select=truck_id,created_at&order=created_at.desc&limit=1000'),
    sbGet(env, 'conversions', 'select=*&order=created_at.desc&limit=500'),
    sbGet(env, 'affiliates', 'select=*&order=sort_order.asc')
  ]);

  return jsonResponse({ trucks, drivers, scans, conversions, affiliates });
}

// ──────────────────────────────────────────────────────────────────
// API: DRIVER DATA
// ──────────────────────────────────────────────────────────────────
async function handleDriverData(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || getCookie(request, 'qrp_driver');
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

  const driverRows = await sbGet(env, 'drivers', `token=eq.${token}&select=id,name,phone,email,referred_by,created_at`);
  if (!driverRows || !driverRows[0]) return jsonResponse({ error: 'Invalid token' }, 401);

  const driver = driverRows[0];

  // Get truck assigned to this driver
  const trucks = await sbGet(env, 'trucks', `driver_id=eq.${driver.id}&select=id,status`);
  const truck = trucks && trucks[0] ? trucks[0] : null;

  // Get scan count for this truck
  let scanCount = 0;
  if (truck) {
    const scans = await sbGet(env, 'scans', `truck_id=eq.${truck.id}&select=id`);
    scanCount = scans ? scans.length : 0;
  }

  // Get conversions for this driver
  const conversions = await sbGet(env, 'conversions', `driver_id=eq.${driver.id}&select=*&order=created_at.desc`);
  const totalEarnings = conversions
    ? conversions.reduce((s, c) => s + parseFloat(c.driver_commission || 0), 0)
    : 0;

  // Get referral count
  const referrals = await sbGet(env, 'drivers', `referred_by=eq.${driver.id}&select=id`);
  const referralCount = referrals ? referrals.length : 0;

  return jsonResponse({
    driver,
    truck,
    scan_count: scanCount,
    conversions: conversions || [],
    total_earnings: totalEarnings.toFixed(2),
    referral_count: referralCount
  });
}

// ──────────────────────────────────────────────────────────────────
// HELPER
// ──────────────────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}

// ──────────────────────────────────────────────────────────────────
// PAGES
// ──────────────────────────────────────────────────────────────────
async function handleHome(request, env) {
  // Try to get affiliates from Supabase, fallback to hardcoded
  let affiliates = FALLBACK_AFFILIATES;
  try {
    const rows = await sbGet(env, 'affiliates', 'select=*&order=sort_order.asc');
    if (rows && rows.length > 0) affiliates = rows;
  } catch (e) {}

  const url = new URL(request.url);
  const truckId = url.searchParams.get('t') || getCookie(request, 'qrp_truck') || '';

  const cardColors = ['#F5C518', '#FF4D4D', '#00C896', '#4D9EFF', '#FF8C00'];

  const cards = affiliates.map((a, i) => {
    const color = a.color || cardColors[i % cardColors.length];
    const isLive = a.status === 'live' || a.status === 'active';
    const linkHref = isLive ? `/go/${a.id}${truckId ? `?t=${truckId}` : ''}` : '#';
    const btnStyle = isLive
      ? `background:${color};color:${color === '#F5C518' || color === '#00C896' ? '#000' : '#fff'};`
      : 'background:#333;color:#666;cursor:not-allowed;';

    return `
    <div class="offer-card" style="border-color:${color}40">
      <span class="offer-tag" style="background:${color};color:${color === '#F5C518' || color === '#00C896' ? '#000' : '#fff'};">
        <span class="en">${a.badge_en || a.name}</span>
        <span class="es">${a.badge_es || a.name}</span>
      </span>
      ${!isLive ? '<div class="coming-soon-badge"><span class="en">Coming Soon</span><span class="es">Próximamente</span></div>' : ''}
      <div class="offer-body">
        <span class="offer-icon">${a.icon || '💼'}</span>
        <div class="offer-title">
          <span class="en">${(a.cta_en || 'Get Started →').replace(' →','').toUpperCase()}</span>
          <span class="es">${(a.cta_es || 'Comenzar →').replace(' →','').toUpperCase()}</span>
        </div>
        <p class="offer-desc">
          <span class="en">${a.description_en || ''}</span>
          <span class="es">${a.description_es || ''}</span>
        </p>
        ${isLive
          ? `<a href="${linkHref}" class="offer-btn" style="${btnStyle}" target="_blank" rel="nofollow sponsored">
              <span class="en">${a.cta_en || 'Get Started →'}</span>
              <span class="es">${a.cta_es || 'Comenzar →'}</span>
             </a>`
          : `<button class="offer-btn" style="${btnStyle}" disabled>
              <span class="en">Coming Soon</span>
              <span class="es">Próximamente</span>
             </button>`
        }
      </div>
    </div>`;
  }).join('\n');

  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>QR Perks — Exclusive Offers | Ofertas Exclusivas</title>
  <meta name="description" content="Exclusive deals on business funding, insurance, banking and phone plans. | Ofertas exclusivas en financiamiento, seguros, banco y planes de teléfono.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0A0A0A;
      --surface: #141414;
      --border: #222;
      --accent: #F5C518;
      --text: #FFFFFF;
      --text-sub: #999;
      --font-display: 'Bebas Neue', sans-serif;
      --font-body: 'Nunito', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-body); background: var(--bg); color: var(--text); min-height: 100vh; overflow-x: hidden; }
    .lang-bar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 8px 20px; display: flex; justify-content: flex-end; gap: 8px; }
    .lang-btn { background: none; border: 1px solid var(--border); color: var(--text-sub); padding: 4px 12px; border-radius: 100px; font-family: var(--font-body); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .lang-btn.active { background: var(--accent); border-color: var(--accent); color: #000; }
    .hero { padding: 40px 20px 32px; text-align: center; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 400px; height: 400px; background: radial-gradient(circle, rgba(245,197,24,0.12) 0%, transparent 70%); pointer-events: none; }
    .hero-badge { display: inline-block; background: var(--accent); color: #000; font-weight: 800; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 14px; border-radius: 100px; margin-bottom: 20px; }
    .hero-title { font-family: var(--font-display); font-size: clamp(52px, 14vw, 86px); line-height: 0.95; letter-spacing: 0.02em; margin-bottom: 16px; }
    .hero-title span { color: var(--accent); }
    .hero-sub { font-size: 16px; color: var(--text-sub); font-weight: 600; margin-bottom: 0; line-height: 1.5; }
    .offers { padding: 0 16px 40px; display: flex; flex-direction: column; gap: 14px; max-width: 480px; margin: 0 auto; }
    .offer-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; position: relative; }
    .coming-soon-badge { position: absolute; top: 40px; right: 12px; background: #333; color: #888; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px; }
    .offer-tag { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 14px; display: block; }
    .offer-body { padding: 16px 20px 20px; }
    .offer-icon { font-size: 36px; margin-bottom: 10px; display: block; }
    .offer-title { font-family: var(--font-display); font-size: 28px; letter-spacing: 0.03em; line-height: 1; margin-bottom: 6px; }
    .offer-desc { font-size: 14px; color: var(--text-sub); font-weight: 600; line-height: 1.5; margin-bottom: 16px; }
    .offer-btn { display: block; width: 100%; padding: 14px; border-radius: 10px; border: none; font-family: var(--font-body); font-weight: 800; font-size: 15px; cursor: pointer; text-align: center; text-decoration: none; transition: opacity 0.2s; }
    .offer-btn:hover:not([disabled]) { opacity: 0.88; }
    .trust-bar { display: flex; justify-content: center; gap: 32px; padding: 24px 20px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 0; }
    .trust-item { text-align: center; }
    .trust-num { display: block; font-family: var(--font-display); font-size: 28px; color: var(--accent); letter-spacing: 0.05em; }
    .trust-label { font-size: 11px; font-weight: 700; color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.06em; }
    .how { padding: 40px 20px; max-width: 480px; margin: 0 auto; }
    .section-label { display: inline-block; font-size: 11px; font-weight: 800; color: var(--accent); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }
    .how-title { font-family: var(--font-display); font-size: clamp(32px, 8vw, 48px); margin-bottom: 24px; }
    .how-steps { display: flex; flex-direction: column; gap: 20px; }
    .step { display: flex; align-items: flex-start; gap: 16px; }
    .step-num { background: var(--accent); color: #000; font-family: var(--font-display); font-size: 22px; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-text { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }
    .step-text strong { font-size: 15px; color: var(--text); }
    .step-text span { font-size: 14px; color: var(--text-sub); }
    .email-capture { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 28px 20px; text-align: center; max-width: 480px; margin: 0 auto; }
    .email-capture-label { font-size: 11px; font-weight: 800; color: var(--accent); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; display: block; }
    .email-capture h3 { font-family: var(--font-display); font-size: 26px; margin-bottom: 8px; }
    .email-capture p { font-size: 13px; color: var(--text-sub); font-weight: 600; margin-bottom: 16px; }
    .email-row { display: flex; gap: 8px; max-width: 360px; margin: 0 auto; }
    .email-row input { flex: 1; background: #1E1E1E; border: 1px solid var(--border); color: var(--text); font-family: var(--font-body); font-size: 15px; padding: 12px 14px; border-radius: 10px; outline: none; }
    .email-row input::placeholder { color: #555; }
    .email-row input:focus { border-color: var(--accent); }
    .email-row button { background: var(--accent); color: #000; font-family: var(--font-body); font-weight: 800; font-size: 14px; padding: 12px 18px; border: none; border-radius: 10px; cursor: pointer; white-space: nowrap; }
    .email-row button:hover { opacity: 0.88; }
    .email-msg { font-size: 13px; margin-top: 10px; font-weight: 700; min-height: 20px; }
    .driver-bar { background: var(--surface); border-top: 1px solid var(--border); padding: 20px; text-align: center; }
    .driver-bar p { font-size: 14px; color: var(--text-sub); margin-bottom: 10px; }
    .driver-bar a { color: var(--accent); font-weight: 800; text-decoration: none; font-size: 14px; }
    .footer { padding: 32px 20px; text-align: center; border-top: 1px solid var(--border); }
    .footer-logo { font-family: var(--font-display); font-size: 28px; letter-spacing: 0.05em; margin-bottom: 12px; }
    .footer-logo span { color: var(--accent); }
    .footer-text { font-size: 13px; color: var(--text-sub); font-weight: 600; line-height: 1.6; margin-bottom: 16px; }
    .footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; flex-wrap: wrap; }
    .footer-links a { color: var(--text-sub); text-decoration: none; font-size: 13px; font-weight: 700; }
    .footer-links a:hover { color: var(--text); }
    body.spanish .en { display: none !important; }
    body:not(.spanish) .es { display: none !important; }
    @keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  </style>
</head>
<body>
  <div class="lang-bar">
    <button class="lang-btn active" onclick="setLang('en')" id="btn-en">EN</button>
    <button class="lang-btn" onclick="setLang('es')" id="btn-es">ES</button>
  </div>
  <section class="hero">
    <div class="hero-badge">
      <span class="en">🔥 Exclusive Offers — Limited Time</span>
      <span class="es">🔥 Ofertas Exclusivas — Tiempo Limitado</span>
    </div>
    <h1 class="hero-title">
      <span class="en">YOU <span>SCAN</span><br>YOU SAVE</span>
      <span class="es">ESCANEAS<br>Y <span>AHORRAS</span></span>
    </h1>
    <p class="hero-sub">
      <span class="en">Special deals just for you.<br><strong>No credit check. No catch. 100% free to apply.</strong></span>
      <span class="es">Ofertas especiales solo para ti.<br><strong>Sin revisión de crédito. Sin trampa. Gratis aplicar.</strong></span>
    </p>
  </section>
  <div class="offers">
    ${cards}
  </div>
  <div class="trust-bar">
    <div class="trust-item">
      <span class="trust-num">100%</span>
      <span class="trust-label"><span class="en">Free to Apply</span><span class="es">Gratis Aplicar</span></span>
    </div>
    <div class="trust-item">
      <span class="trust-num">2 MIN</span>
      <span class="trust-label"><span class="en">To Complete</span><span class="es">Para Completar</span></span>
    </div>
    <div class="trust-item">
      <span class="trust-num">0</span>
      <span class="trust-label"><span class="en">Hidden Fees</span><span class="es">Cargos Ocultos</span></span>
    </div>
  </div>
  <section class="how">
    <span class="section-label"><span class="en">How It Works</span><span class="es">Cómo Funciona</span></span>
    <h2 class="how-title"><span class="en">THREE EASY STEPS</span><span class="es">TRES PASOS FÁCILES</span></h2>
    <div class="how-steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">
          <strong><span class="en">Pick Your Offer</span><span class="es">Elige Tu Oferta</span></strong>
          <span><span class="en">Choose the deal that works best for you.</span><span class="es">Elige la oferta que mejor te convenga.</span></span>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">
          <strong><span class="en">Tap the Button</span><span class="es">Toca el Botón</span></strong>
          <span><span class="en">You'll be taken directly to the offer. Takes 2 minutes.</span><span class="es">Te llevará directamente a la oferta. Solo 2 minutos.</span></span>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">
          <strong><span class="en">Start Saving</span><span class="es">Empieza a Ahorrar</span></strong>
          <span><span class="en">No obligation. No hidden fees. Just savings.</span><span class="es">Sin compromiso. Sin cargos ocultos. Solo ahorros.</span></span>
        </div>
      </div>
    </div>
  </section>
  <div class="email-capture">
    <span class="email-capture-label"><span class="en">Stay in the Loop</span><span class="es">Mantente Informado</span></span>
    <h3><span class="en">NEW DEALS EVERY WEEK</span><span class="es">OFERTAS NUEVAS CADA SEMANA</span></h3>
    <p><span class="en">Get notified when better offers drop. No spam, ever.</span><span class="es">Recibe alertas de nuevas ofertas. Sin spam, nunca.</span></p>
    <div class="email-row">
      <input type="email" id="email-input" placeholder="your@email.com" autocomplete="email">
      <button onclick="subscribeEmail()"><span class="en">Notify Me</span><span class="es">Avisarme</span></button>
    </div>
    <p class="email-msg" id="email-msg"></p>
  </div>
  <div class="driver-bar">
    <p><span class="en">Are you a driver? Track your earnings.</span><span class="es">¿Eres conductor? Rastrea tus ganancias.</span></p>
    <a href="/driver"><span class="en">Driver Portal →</span><span class="es">Portal del Conductor →</span></a>
  </div>
  <footer class="footer">
    <div class="footer-logo">QR<span>PERKS</span></div>
    <p class="footer-text">
      <span class="en">Connecting Southern California to the best deals.<br>Seen on trucks near you.</span>
      <span class="es">Conectando el Sur de California con las mejores ofertas.<br>Visto en camiones cerca de ti.</span>
    </p>
    <div class="footer-links">
      <a href="/privacy"><span class="en">Privacy Policy</span><span class="es">Política de Privacidad</span></a>
      <a href="/disclosure"><span class="en">Disclosure</span><span class="es">Divulgación</span></a>
      <a href="/terms"><span class="en">Terms</span><span class="es">Términos</span></a>
      <a href="/contractor"><span class="en">Contractor Agreement</span><span class="es">Contrato Independiente</span></a>
    </div>
    <p class="footer-text" style="font-size:11px;margin-top:8px;">
      <span class="en">© 2026 QRPerks. Some links are affiliate links. We may earn a commission at no cost to you.</span>
      <span class="es">© 2026 QRPerks. Algunos enlaces son de afiliados. Podemos ganar una comisión sin costo para ti.</span>
    </p>
  </footer>
  <script>
    const truckId = new URLSearchParams(location.search).get('t');
    if (truckId) document.cookie = 'qrp_truck=' + truckId + '; path=/; max-age=86400; samesite=lax';
    async function subscribeEmail() {
      const email = document.getElementById('email-input').value.trim();
      const msg = document.getElementById('email-msg');
      if (!email || !email.includes('@')) {
        msg.style.color = '#f55'; msg.textContent = 'Please enter a valid email.';
        return;
      }
      const truckId = new URLSearchParams(location.search).get('t') || null;
      const lang = document.body.classList.contains('spanish') ? 'es' : 'en';
      msg.style.color = '#999'; msg.textContent = '...';
      try {
        const res = await fetch('/api/email/subscribe', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, truck_id: truckId, lang })
        });
        if (res.ok) {
          msg.style.color = '#00C896';
          msg.textContent = lang === 'es' ? '✓ ¡Listo! Te avisaremos.' : '✓ You're in! We'll notify you.';
          document.getElementById('email-input').value = '';
        } else {
          msg.style.color = '#f55'; msg.textContent = 'Something went wrong. Try again.';
        }
      } catch(e) {
        msg.style.color = '#f55'; msg.textContent = 'Something went wrong. Try again.';
      }
    }
    function setLang(lang) {
      if (lang === 'es') {
        document.body.classList.add('spanish');
        document.getElementById('btn-es').classList.add('active');
        document.getElementById('btn-en').classList.remove('active');
        document.documentElement.lang = 'es';
        localStorage.setItem('qrp_lang','es');
      } else {
        document.body.classList.remove('spanish');
        document.getElementById('btn-en').classList.add('active');
        document.getElementById('btn-es').classList.remove('active');
        document.documentElement.lang = 'en';
        localStorage.setItem('qrp_lang','en');
      }
    }
    const saved = localStorage.getItem('qrp_lang');
    if (saved) { setLang(saved); }
    else if (navigator.language && navigator.language.toLowerCase().startsWith('es')) { setLang('es'); }
  </script>
</body>
</html>`);
}

// ──────────────────────────────────────────────────────────────────
// DRIVER PAGE
// ──────────────────────────────────────────────────────────────────
async function handleDriverPage(request, env) {
  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Perks — Driver Portal</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0A0A0A; --surface:#141414; --border:#222; --accent:#F5C518; --text:#fff; --text-sub:#999; --font-display:'Bebas Neue',sans-serif; --font-body:'Nunito',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:var(--font-body); background:var(--bg); color:var(--text); min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:32px 28px; width:100%; max-width:420px; }
    .logo { font-family:var(--font-display); font-size:28px; letter-spacing:0.05em; margin-bottom:8px; color:var(--text); }
    .logo span { color:var(--accent); }
    h1 { font-family:var(--font-display); font-size:clamp(32px,8vw,42px); margin-bottom:8px; }
    p { font-size:14px; color:var(--text-sub); margin-bottom:24px; line-height:1.5; }
    .tabs { display:flex; gap:8px; margin-bottom:24px; }
    .tab { flex:1; padding:10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-sub); font-family:var(--font-body); font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; }
    .tab.active { background:var(--accent); border-color:var(--accent); color:#000; }
    label { display:block; font-size:12px; font-weight:700; color:var(--text-sub); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; margin-top:16px; }
    input { width:100%; padding:12px 16px; background:#1a1a1a; border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px; outline:none; transition:border-color 0.2s; }
    input:focus { border-color:var(--accent); }
    .btn { width:100%; padding:14px; background:var(--accent); color:#000; border:none; border-radius:10px; font-family:var(--font-body); font-weight:800; font-size:16px; cursor:pointer; margin-top:20px; transition:opacity 0.2s; }
    .btn:hover { opacity:0.88; }
    .error { color:#FF4D4D; font-size:13px; margin-top:12px; display:none; }
    .back { display:block; text-align:center; color:var(--text-sub); font-size:13px; margin-top:20px; text-decoration:none; }
    .back:hover { color:var(--text); }
    #register-form, #login-form { }
    #login-form { display:none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">QR<span>PERKS</span></div>
    <h1>DRIVER PORTAL</h1>
    <p>Register or log in to track your earnings and scan activity.</p>
    <div class="tabs">
      <button class="tab active" onclick="showTab('register')">Register</button>
      <button class="tab" onclick="showTab('login')">Log In</button>
    </div>
    <div id="register-form">
      <label>Full Name</label>
      <input type="text" id="reg-name" placeholder="Your full name" autocomplete="name">
      <label>Phone Number</label>
      <input type="tel" id="reg-phone" placeholder="+1 (555) 000-0000" autocomplete="tel">
      <label>Email (optional)</label>
      <input type="email" id="reg-email" placeholder="you@email.com" autocomplete="email">
      <div id="reg-error" class="error"></div>
      <button class="btn" onclick="register()">Register & Get Dashboard Link →</button>
    </div>
    <div id="login-form">
      <label>Your Access Token</label>
      <input type="text" id="login-token" placeholder="Paste your token here">
      <div id="login-error" class="error"></div>
      <button class="btn" onclick="login()">Go to Dashboard →</button>
    </div>
    <a href="/" class="back">← Back to Offers</a>
  </div>
  <script>
    function showTab(tab) {
      document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
      document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
      document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='register')||(i===1&&tab==='login')));
    }
    async function register() {
      const name = document.getElementById('reg-name').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const err = document.getElementById('reg-error');
      err.style.display = 'none';
      if (!name || !phone) { err.textContent = 'Name and phone are required.'; err.style.display='block'; return; }
      const res = await fetch('/api/driver/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, phone, email}) });
      const data = await res.json();
      if (data.token) {
        document.cookie = 'qrp_driver=' + data.token + '; path=/; max-age=2592000; samesite=lax';
        location.href = '/driver/dashboard?token=' + data.token;
      } else {
        err.textContent = data.error || 'Registration failed. Try again.';
        err.style.display = 'block';
      }
    }
    async function login() {
      const token = document.getElementById('login-token').value.trim();
      const err = document.getElementById('login-error');
      err.style.display = 'none';
      if (!token) { err.textContent = 'Token required.'; err.style.display='block'; return; }
      const res = await fetch('/api/driver/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token}) });
      const data = await res.json();
      if (data.driver) {
        document.cookie = 'qrp_driver=' + token + '; path=/; max-age=2592000; samesite=lax';
        location.href = '/driver/dashboard?token=' + token;
      } else {
        err.textContent = data.error || 'Invalid token.';
        err.style.display = 'block';
      }
    }
  </script>
</body>
</html>`);
}

// ──────────────────────────────────────────────────────────────────
// DRIVER DASHBOARD
// ──────────────────────────────────────────────────────────────────
async function handleDriverDashboard(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || getCookie(request, 'qrp_driver');
  if (!token) return Response.redirect('/driver', 302);

  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Perks — Driver Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0A0A0A; --surface:#141414; --border:#222; --accent:#F5C518; --text:#fff; --text-sub:#999; --green:#00C896; --font-display:'Bebas Neue',sans-serif; --font-body:'Nunito',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:var(--font-body); background:var(--bg); color:var(--text); min-height:100vh; }
    header { background:var(--surface); border-bottom:1px solid var(--border); padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
    .logo { font-family:var(--font-display); font-size:22px; color:var(--text); }
    .logo span { color:var(--accent); }
    .logout { color:var(--text-sub); font-size:13px; font-weight:700; text-decoration:none; cursor:pointer; background:none; border:none; }
    .logout:hover { color:var(--text); }
    .container { max-width:520px; margin:0 auto; padding:24px 16px; }
    h1 { font-family:var(--font-display); font-size:clamp(28px,7vw,38px); margin-bottom:4px; }
    .greeting { font-size:14px; color:var(--text-sub); margin-bottom:24px; }
    .stats { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
    .stat { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 16px; }
    .stat-val { font-family:var(--font-display); font-size:36px; color:var(--accent); display:block; }
    .stat-label { font-size:12px; color:var(--text-sub); font-weight:700; text-transform:uppercase; letter-spacing:0.06em; }
    .section-title { font-family:var(--font-display); font-size:22px; margin-bottom:12px; }
    .info-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 16px; margin-bottom:16px; }
    .info-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); }
    .info-row:last-child { border-bottom:none; }
    .info-key { font-size:13px; color:var(--text-sub); font-weight:700; }
    .info-val { font-size:13px; font-weight:700; }
    .badge { display:inline-block; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:800; }
    .badge-green { background:#00C89622; color:var(--green); }
    .badge-gray { background:#33333355; color:#888; }
    .conversion-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border); font-size:13px; }
    .conversion-row:last-child { border-bottom:none; }
    .empty { color:var(--text-sub); font-size:14px; text-align:center; padding:20px; }
    .token-box { background:#111; border:1px solid #2a2a2a; border-radius:10px; padding:12px 14px; font-family:monospace; font-size:12px; color:#888; word-break:break-all; margin-top:8px; }
    .copy-btn { display:block; margin-top:8px; background:none; border:1px solid var(--border); color:var(--text-sub); padding:6px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; }
    .copy-btn:hover { color:var(--text); border-color:var(--text-sub); }
    .loading { color:var(--text-sub); text-align:center; padding:40px; font-size:14px; }
    #content { display:none; }
  </style>
</head>
<body>
  <header>
    <div class="logo">QR<span>PERKS</span></div>
    <button class="logout" onclick="logout()">Log Out</button>
  </header>
  <div class="container">
    <div class="loading" id="loading">Loading your dashboard...</div>
    <div id="content">
      <h1 id="greeting-name">DRIVER DASHBOARD</h1>
      <p class="greeting">Here's your performance summary.</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-val" id="stat-scans">—</span>
          <span class="stat-label">Total Scans</span>
        </div>
        <div class="stat">
          <span class="stat-val" id="stat-earnings" style="color:var(--green);">—</span>
          <span class="stat-label">Earnings</span>
        </div>
        <div class="stat">
          <span class="stat-val" id="stat-conversions">—</span>
          <span class="stat-label">Conversions</span>
        </div>
        <div class="stat">
          <span class="stat-val" id="stat-referrals">—</span>
          <span class="stat-label">Referrals</span>
        </div>
      </div>
      <div class="section-title">TRUCK INFO</div>
      <div class="info-card" id="truck-info"></div>
      <div class="section-title" style="margin-top:20px;">CONVERSIONS</div>
      <div class="info-card" id="conversions-list"></div>
      <div class="section-title" style="margin-top:20px;">YOUR ACCESS TOKEN</div>
      <p style="font-size:13px;color:var(--text-sub);margin-bottom:8px;">Save this — it's how you log back in.</p>
      <div class="token-box" id="token-display"></div>
      <button class="copy-btn" onclick="copyToken()">Copy Token</button>
    </div>
  </div>
  <script>
    const TOKEN = '${token}';
    async function load() {
      const res = await fetch('/api/driver/data?token=' + TOKEN);
      if (res.status === 401) { location.href = '/driver'; return; }
      const d = await res.json();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      document.getElementById('greeting-name').textContent = 'HI, ' + (d.driver.name || 'DRIVER').toUpperCase();
      document.getElementById('stat-scans').textContent = d.scan_count;
      document.getElementById('stat-earnings').textContent = '$' + d.total_earnings;
      document.getElementById('stat-conversions').textContent = d.conversions.length;
      document.getElementById('stat-referrals').textContent = d.referral_count;
      document.getElementById('token-display').textContent = TOKEN;
      const ti = document.getElementById('truck-info');
      if (d.truck) {
        ti.innerHTML = \`
          <div class="info-row"><span class="info-key">Truck ID</span><span class="info-val">\${d.truck.id.toUpperCase()}</span></div>
          <div class="info-row"><span class="info-key">Status</span><span class="info-val"><span class="badge \${d.truck.status==='active'?'badge-green':'badge-gray'}">\${d.truck.status.toUpperCase()}</span></span></div>
        \`;
      } else {
        ti.innerHTML = '<p class="empty">No truck assigned yet. Contact admin.</p>';
      }
      const cl = document.getElementById('conversions-list');
      if (d.conversions.length > 0) {
        cl.innerHTML = d.conversions.map(c => \`
          <div class="conversion-row">
            <span>\${c.affiliate_id || 'Unknown'}</span>
            <span style="color:var(--green);font-weight:800;">+$\${c.driver_commission || '0.00'}</span>
          </div>
        \`).join('');
      } else {
        cl.innerHTML = '<p class="empty">No conversions yet. Your commissions will appear here.</p>';
      }
    }
    function logout() {
      document.cookie = 'qrp_driver=; path=/; max-age=0';
      location.href = '/driver';
    }
    function copyToken() {
      navigator.clipboard.writeText(TOKEN).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Token', 2000);
      });
    }
    load();
  </script>
</body>
</html>`);
}

// ──────────────────────────────────────────────────────────────────
// ADMIN PAGE
// ──────────────────────────────────────────────────────────────────
async function handleAdminPage(request, env) {
  if (isAdminAuthed(request, env)) return Response.redirect('/admin/dashboard', 302);

  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Perks — Admin</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0A0A0A; --surface:#141414; --border:#222; --accent:#F5C518; --text:#fff; --text-sub:#999; --font-display:'Bebas Neue',sans-serif; --font-body:'Nunito',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:var(--font-body); background:var(--bg); color:var(--text); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:32px 28px; width:100%; max-width:380px; }
    .logo { font-family:var(--font-display); font-size:24px; margin-bottom:20px; }
    .logo span { color:var(--accent); }
    h1 { font-family:var(--font-display); font-size:36px; margin-bottom:20px; }
    label { display:block; font-size:12px; font-weight:700; color:var(--text-sub); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
    input { width:100%; padding:12px 16px; background:#1a1a1a; border:1px solid var(--border); border-radius:10px; color:var(--text); font-family:var(--font-body); font-size:15px; outline:none; }
    input:focus { border-color:var(--accent); }
    .btn { width:100%; padding:14px; background:var(--accent); color:#000; border:none; border-radius:10px; font-family:var(--font-body); font-weight:800; font-size:16px; cursor:pointer; margin-top:20px; }
    .error { color:#FF4D4D; font-size:13px; margin-top:12px; display:none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">QR<span>PERKS</span> <span style="color:var(--text-sub);font-size:14px;">ADMIN</span></div>
    <h1>SIGN IN</h1>
    <label>Password</label>
    <input type="password" id="pwd" placeholder="Admin password" onkeydown="if(event.key==='Enter')login()">
    <div id="err" class="error"></div>
    <button class="btn" onclick="login()">Access Dashboard →</button>
  </div>
  <script>
    async function login() {
      const password = document.getElementById('pwd').value;
      const err = document.getElementById('err');
      err.style.display = 'none';
      const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password}) });
      const data = await res.json();
      if (data.ok) { location.href = '/admin/dashboard'; }
      else { err.textContent = 'Incorrect password.'; err.style.display = 'block'; }
    }
  </script>
</body>
</html>`);
}

// ──────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ──────────────────────────────────────────────────────────────────
async function handleAdminDashboard(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin', 302);

  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Perks — Admin Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0A0A0A; --surface:#141414; --border:#222; --accent:#F5C518; --text:#fff; --text-sub:#999; --green:#00C896; --red:#FF4D4D; --blue:#4D9EFF; --font-display:'Bebas Neue',sans-serif; --font-body:'Nunito',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:var(--font-body); background:var(--bg); color:var(--text); min-height:100vh; }
    header { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 24px; display:flex; align-items:center; justify-content:space-between; }
    .logo { font-family:var(--font-display); font-size:20px; }
    .logo span { color:var(--accent); }
    .logout { background:none; border:1px solid var(--border); color:var(--text-sub); padding:6px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; }
    .logout:hover { color:var(--text); border-color:var(--text-sub); }
    .page { max-width:1000px; margin:0 auto; padding:24px 16px; }
    h1 { font-family:var(--font-display); font-size:clamp(32px,6vw,42px); margin-bottom:20px; }
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:28px; }
    .kpi { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; }
    .kpi-val { font-family:var(--font-display); font-size:32px; display:block; }
    .kpi-label { font-size:11px; color:var(--text-sub); font-weight:700; text-transform:uppercase; letter-spacing:0.06em; }
    .section { margin-bottom:28px; }
    .section-title { font-family:var(--font-display); font-size:20px; margin-bottom:12px; color:var(--text-sub); }
    table { width:100%; border-collapse:collapse; background:var(--surface); border-radius:12px; overflow:hidden; border:1px solid var(--border); }
    th { padding:10px 14px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-sub); text-align:left; border-bottom:1px solid var(--border); background:#0f0f0f; }
    td { padding:10px 14px; font-size:13px; border-bottom:1px solid #1a1a1a; }
    tr:last-child td { border-bottom:none; }
    .badge { display:inline-block; padding:2px 8px; border-radius:100px; font-size:10px; font-weight:800; text-transform:uppercase; }
    .badge-green { background:#00C89622; color:var(--green); }
    .badge-gray { background:#33333355; color:#666; }
    .badge-yellow { background:#F5C51822; color:var(--accent); }
    .loading { text-align:center; padding:40px; color:var(--text-sub); }
    #content { display:none; }
    .tabs { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
    .tab { padding:8px 18px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-sub); font-family:var(--font-body); font-size:13px; font-weight:700; cursor:pointer; }
    .tab.active { background:var(--accent); border-color:var(--accent); color:#000; }
    .panel { display:none; }
    .panel.active { display:block; }
  </style>
</head>
<body>
  <header>
    <div class="logo">QR<span>PERKS</span> <span style="color:var(--text-sub);font-size:13px;">ADMIN</span></div>
    <button class="logout" onclick="logout()">Log Out</button>
  </header>
  <div class="page">
    <h1>ADMIN DASHBOARD</h1>
    <div class="loading" id="loading">Loading data...</div>
    <div id="content">
      <div class="kpi-grid">
        <div class="kpi"><span class="kpi-val" id="kpi-trucks" style="color:var(--accent);">—</span><span class="kpi-label">Active Trucks</span></div>
        <div class="kpi"><span class="kpi-val" id="kpi-drivers" style="color:var(--blue);">—</span><span class="kpi-label">Drivers</span></div>
        <div class="kpi"><span class="kpi-val" id="kpi-scans" style="color:var(--green);">—</span><span class="kpi-label">Total Scans</span></div>
        <div class="kpi"><span class="kpi-val" id="kpi-conversions" style="color:var(--green);">—</span><span class="kpi-label">Conversions</span></div>
        <div class="kpi"><span class="kpi-val" id="kpi-revenue" style="color:var(--accent);">—</span><span class="kpi-label">Gross Revenue</span></div>
        <div class="kpi"><span class="kpi-val" id="kpi-commissions" style="color:var(--red);">—</span><span class="kpi-label">Driver Payouts</span></div>
      </div>
      <div class="tabs">
        <button class="tab active" onclick="showPanel('trucks')">Trucks</button>
        <button class="tab" onclick="showPanel('drivers')">Drivers</button>
        <button class="tab" onclick="showPanel('affiliates')">Affiliates</button>
        <button class="tab" onclick="showPanel('conversions')">Conversions</button>
      </div>
      <div class="panel active" id="panel-trucks">
        <div class="section"><table id="tbl-trucks"><thead><tr><th>Truck</th><th>Status</th><th>Driver</th><th>Scans</th></tr></thead><tbody id="tbody-trucks"></tbody></table></div>
      </div>
      <div class="panel" id="panel-drivers">
        <div class="section"><table id="tbl-drivers"><thead><tr><th>Name</th><th>Phone / Email</th><th>Status</th><th>Joined</th></tr></thead><tbody id="tbody-drivers"></tbody></table></div>
      </div>
      <div class="panel" id="panel-affiliates">
        <div class="section"><table><thead><tr><th>Affiliate</th><th>Category</th><th>Status</th><th>Commission</th><th>Conversions</th></tr></thead><tbody id="tbody-affiliates"></tbody></table></div>
      </div>
      <div class="panel" id="panel-conversions">
        <div class="section"><table><thead><tr><th>Date</th><th>Truck</th><th>Affiliate</th><th>Gross</th><th>Driver Payout</th><th>Status</th></tr></thead><tbody id="tbody-conversions"></tbody></table></div>
      </div>
    </div>
  </div>
  <script>
    let DATA = {};
    function showPanel(name) {
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab').forEach((t,i) => t.classList.remove('active'));
      document.getElementById('panel-'+name).classList.add('active');
      const panels = ['trucks','drivers','affiliates','conversions'];
      const idx = panels.indexOf(name);
      document.querySelectorAll('.tab')[idx].classList.add('active');
    }
    async function load() {
      const res = await fetch('/api/admin/data');
      if (res.status === 401) { location.href = '/admin'; return; }
      DATA = await res.json();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      renderDashboard(DATA);
    }
    function renderDashboard(d) {
      const trucks = (d.trucks||[]).sort((a,b) => parseInt(a.id.slice(1))-parseInt(b.id.slice(1)));
      const activeTrucks = trucks.filter(t=>t.status==='active').length;
      const totalRevenue = (d.conversions||[]).reduce((s,c)=>s+parseFloat(c.gross_amount||0),0);
      const totalPayouts = (d.conversions||[]).reduce((s,c)=>s+parseFloat(c.driver_commission||0)+parseFloat(c.referral_commission||0),0);
      document.getElementById('kpi-trucks').textContent = activeTrucks;
      document.getElementById('kpi-drivers').textContent = (d.drivers||[]).length;
      document.getElementById('kpi-scans').textContent = (d.scans||[]).length;
      document.getElementById('kpi-conversions').textContent = (d.conversions||[]).length;
      document.getElementById('kpi-revenue').textContent = '$'+totalRevenue.toFixed(0);
      document.getElementById('kpi-commissions').textContent = '$'+totalPayouts.toFixed(0);

      // Trucks table
      const scansByTruck = {};
      (d.scans||[]).forEach(s => { scansByTruck[s.truck_id] = (scansByTruck[s.truck_id]||0)+1; });
      const driverMap = {};
      (d.drivers||[]).forEach(dr => driverMap[dr.id] = dr.name || 'Unknown');
      document.getElementById('tbody-trucks').innerHTML = trucks.map(t => \`
        <tr>
          <td style="font-weight:800;">\${t.id.toUpperCase()}</td>
          <td><span class="badge \${t.status==='active'?'badge-green':'badge-gray'}">\${t.status}</span></td>
          <td>\${t.driver_id ? (driverMap[t.driver_id]||'Assigned') : '<span style="color:#555">Unassigned</span>'}</td>
          <td>\${scansByTruck[t.id]||0}</td>
        </tr>
      \`).join('');

      // Drivers table
      document.getElementById('tbody-drivers').innerHTML = (d.drivers||[]).map(dr => \`
        <tr>
          <td style="font-weight:800;">\${dr.name||'—'}</td>
          <td>\${dr.phone||dr.email||'—'}</td>
          <td><span class="badge \${dr.status==='active'?'badge-green':'badge-gray'}">\${dr.status}</span></td>
          <td>\${new Date(dr.created_at).toLocaleDateString()}</td>
        </tr>
      \`).join('');

      // Affiliates table
      const convsByAffiliate = {};
      (d.conversions||[]).forEach(c => { convsByAffiliate[c.affiliate_id] = (convsByAffiliate[c.affiliate_id]||0)+1; });
      document.getElementById('tbody-affiliates').innerHTML = (d.affiliates||[]).map(a => \`
        <tr>
          <td style="font-weight:800;">\${a.name}</td>
          <td>\${a.category||'—'}</td>
          <td><span class="badge \${a.status==='live'?'badge-green':'badge-yellow'}">\${a.status}</span></td>
          <td>\${a.commission_type||''} $\${a.commission_rate||'—'}</td>
          <td>\${convsByAffiliate[a.id]||0}</td>
        </tr>
      \`).join('');

      // Conversions table
      document.getElementById('tbody-conversions').innerHTML = (d.conversions||[]).map(c => \`
        <tr>
          <td>\${new Date(c.created_at).toLocaleDateString()}</td>
          <td>\${c.truck_id||'—'}</td>
          <td>\${c.affiliate_id||'—'}</td>
          <td>$\${c.gross_amount||'0.00'}</td>
          <td style="color:var(--green);">$\${c.driver_commission||'0.00'}</td>
          <td><span class="badge \${c.status==='confirmed'?'badge-green':c.status==='paid'?'badge-green':'badge-yellow'}">\${c.status}</span></td>
        </tr>
      \`).join('') || '<tr><td colspan="6" style="text-align:center;color:#555;padding:20px;">No conversions yet.</td></tr>';
    }
    function logout() {
      document.cookie = 'qrp_admin=; path=/; max-age=0';
      location.href = '/admin';
    }
    load();
  </script>
</body>
</html>`);
}

// ──────────────────────────────────────────────────────────────────
// STATIC PAGES
// ──────────────────────────────────────────────────────────────────
function staticPage(type) {
  const pages = {
    privacy: {
      title: 'Privacy Policy | Política de Privacidad',
      heading_en: 'PRIVACY POLICY',
      heading_es: 'POLÍTICA DE PRIVACIDAD',
      body_en: `<p><strong>Last updated: January 1, 2026</strong></p>
<p>QRPerks ("we," "us," or "our") operates qr-perks.com. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service.</p>
<h3>Data We Collect</h3>
<p>We collect your IP address, device type, and general location when you scan a QR code. If you register as a driver, we collect your name, phone number, and/or email address.</p>
<h3>How We Use Your Data</h3>
<p>We use scan data to track QR code performance and attribute commissions to drivers. We do not sell your personal data to third parties.</p>
<h3>Affiliate Links</h3>
<p>Our site contains affiliate links. When you click these links and make a purchase or sign up, we may receive a commission. See our Affiliate Disclosure for details.</p>
<h3>Cookies</h3>
<p>We use cookies to remember which truck's QR code you scanned, so we can attribute commissions correctly. These cookies expire within 24 hours.</p>
<h3>Contact</h3>
<p>Questions? Email: privacy@qr-perks.com</p>`,
      body_es: `<p><strong>Última actualización: 1 de enero de 2026</strong></p>
<p>QRPerks ("nosotros") opera qr-perks.com. Esta página te informa sobre nuestras políticas de recopilación y uso de datos personales.</p>
<h3>Datos que Recopilamos</h3>
<p>Recopilamos tu dirección IP, tipo de dispositivo y ubicación general cuando escaneas un código QR. Si te registras como conductor, recopilamos tu nombre, número de teléfono y/o correo electrónico.</p>
<h3>Cómo Usamos tus Datos</h3>
<p>Usamos los datos de escaneo para rastrear el rendimiento de los códigos QR y atribuir comisiones a los conductores. No vendemos tus datos personales a terceros.</p>
<h3>Cookies</h3>
<p>Usamos cookies para recordar qué código QR escaneaste, para atribuir comisiones correctamente. Estas cookies vencen en 24 horas.</p>
<h3>Contacto</h3>
<p>¿Preguntas? Correo: privacy@qr-perks.com</p>`
    },
    terms: {
      title: 'Terms of Service | Términos de Servicio',
      heading_en: 'TERMS OF SERVICE',
      heading_es: 'TÉRMINOS DE SERVICIO',
      body_en: `<p><strong>Effective: January 1, 2026</strong></p>
<p>By using qr-perks.com, you agree to these Terms of Service. If you disagree, please do not use the site.</p>
<h3>Use of Service</h3>
<p>QRPerks provides a platform connecting users to affiliate offers. We are not responsible for the products or services offered by third-party affiliates.</p>
<h3>Driver Program</h3>
<p>Drivers participate voluntarily as independent contractors. Commission payments are contingent on affiliate program approvals and payment schedules.</p>
<h3>No Warranties</h3>
<p>The service is provided "as is" without warranties of any kind. We reserve the right to modify or discontinue the service at any time.</p>
<h3>Limitation of Liability</h3>
<p>QRPerks shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>`,
      body_es: `<p><strong>Vigente: 1 de enero de 2026</strong></p>
<p>Al usar qr-perks.com, aceptas estos Términos de Servicio.</p>
<h3>Uso del Servicio</h3>
<p>QRPerks ofrece una plataforma que conecta usuarios con ofertas de afiliados. No somos responsables de los productos o servicios de afiliados de terceros.</p>
<h3>Programa de Conductores</h3>
<p>Los conductores participan voluntariamente como contratistas independientes. Los pagos de comisiones dependen de las aprobaciones de los programas de afiliados.</p>
<h3>Sin Garantías</h3>
<p>El servicio se ofrece "tal cual" sin garantías. Nos reservamos el derecho de modificar o descontinuar el servicio en cualquier momento.</p>`
    },
    disclosure: {
      title: 'Affiliate Disclosure | Divulgación de Afiliados',
      heading_en: 'AFFILIATE DISCLOSURE',
      heading_es: 'DIVULGACIÓN DE AFILIADOS',
      body_en: `<p><strong>Last updated: January 1, 2026</strong></p>
<p>QRPerks participates in affiliate marketing programs. This means we may earn a commission when you click on links on this site and make a purchase or sign up for a service.</p>
<h3>What This Means for You</h3>
<p>Affiliate commissions are paid by the advertisers, not by you. Your cost is the same whether or not you use our affiliate link.</p>
<h3>Our Commitment</h3>
<p>We only feature offers that we believe provide genuine value. Our affiliate relationships do not influence the offers displayed — we display what converts best for our audience.</p>
<h3>FTC Compliance</h3>
<p>In compliance with FTC guidelines, we disclose that some links on this site are affiliate links. We are compensated when you take action through these links.</p>`,
      body_es: `<p><strong>Última actualización: 1 de enero de 2026</strong></p>
<p>QRPerks participa en programas de marketing de afiliados. Esto significa que podemos ganar una comisión cuando haces clic en los enlaces de este sitio y realizas una compra o te registras en un servicio.</p>
<h3>Lo Que Esto Significa para Ti</h3>
<p>Las comisiones de afiliados son pagadas por los anunciantes, no por ti. Tu costo es el mismo ya sea que uses nuestro enlace de afiliado o no.</p>
<h3>Nuestro Compromiso</h3>
<p>Solo presentamos ofertas que creemos que proporcionan valor genuino.</p>`
    },
    contractor: {
      title: 'Independent Contractor Agreement | Acuerdo de Contratista Independiente',
      heading_en: 'INDEPENDENT CONTRACTOR AGREEMENT',
      heading_es: 'ACUERDO DE CONTRATISTA INDEPENDIENTE',
      body_en: `<p><strong>Effective: January 1, 2026</strong></p>
<p>This Independent Contractor Agreement ("Agreement") governs the relationship between QRPerks and truck drivers participating in the QR code affiliate program.</p>
<h3>Independent Contractor Status</h3>
<p>Drivers are independent contractors, not employees of QRPerks. QRPerks does not control the time, manner, or means by which drivers display QR code materials.</p>
<h3>Commission Structure</h3>
<ul>
<li><strong>20%</strong> of gross affiliate commissions generated by your truck's QR code</li>
<li><strong>10%</strong> of commissions from drivers you personally refer to the program</li>
</ul>
<h3>Payment Terms</h3>
<p>Commissions are paid monthly, net-30, once affiliate programs have confirmed conversions. Minimum payout threshold: $50.</p>
<h3>Taxes</h3>
<p>Drivers are responsible for all applicable taxes on earnings. QRPerks will issue a 1099-NEC for earnings over $600/year.</p>
<h3>Termination</h3>
<p>Either party may terminate this agreement with 7 days written notice. Earned commissions will be paid out upon termination.</p>`,
      body_es: `<p><strong>Vigente: 1 de enero de 2026</strong></p>
<p>Este Acuerdo de Contratista Independiente rige la relación entre QRPerks y los conductores de camiones que participan en el programa de afiliados de código QR.</p>
<h3>Estado de Contratista Independiente</h3>
<p>Los conductores son contratistas independientes, no empleados de QRPerks.</p>
<h3>Estructura de Comisiones</h3>
<ul>
<li><strong>20%</strong> de las comisiones brutas generadas por el código QR de tu camión</li>
<li><strong>10%</strong> de las comisiones de conductores que tú refieras al programa</li>
</ul>
<h3>Términos de Pago</h3>
<p>Las comisiones se pagan mensualmente, neto-30. Umbral mínimo de pago: $50.</p>
<h3>Impuestos</h3>
<p>Los conductores son responsables de todos los impuestos aplicables sobre sus ganancias.</p>`
    }
  };

  const p = pages[type];
  if (!p) return new Response('Not Found', { status: 404 });

  return html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Perks — ${p.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --bg:#0A0A0A; --surface:#141414; --border:#222; --accent:#F5C518; --text:#fff; --text-sub:#999; --font-display:'Bebas Neue',sans-serif; --font-body:'Nunito',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:var(--font-body); background:var(--bg); color:var(--text); }
    header { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 24px; display:flex; align-items:center; justify-content:space-between; }
    .logo { font-family:var(--font-display); font-size:20px; text-decoration:none; color:var(--text); }
    .logo span { color:var(--accent); }
    .page { max-width:680px; margin:0 auto; padding:40px 20px; }
    .lang-toggle { display:flex; gap:8px; margin-bottom:32px; }
    .lang-btn { padding:5px 14px; border-radius:100px; border:1px solid var(--border); background:none; color:var(--text-sub); font-size:12px; font-weight:700; cursor:pointer; }
    .lang-btn.active { background:var(--accent); border-color:var(--accent); color:#000; }
    h1 { font-family:var(--font-display); font-size:clamp(32px,7vw,48px); margin-bottom:28px; }
    .body-content h3 { font-size:16px; margin-top:20px; margin-bottom:8px; color:var(--accent); }
    .body-content p { font-size:14px; color:var(--text-sub); line-height:1.7; margin-bottom:12px; }
    .body-content ul { padding-left:20px; }
    .body-content li { font-size:14px; color:var(--text-sub); line-height:1.7; margin-bottom:6px; }
    .back { display:inline-block; margin-top:32px; color:var(--text-sub); font-size:13px; font-weight:700; text-decoration:none; }
    .back:hover { color:var(--text); }
    body.spanish .en { display:none; }
    body:not(.spanish) .es { display:none; }
  </style>
</head>
<body>
  <header>
    <a href="/" class="logo">QR<span>PERKS</span></a>
    <div style="display:flex;gap:8px;">
      <button class="lang-btn active" onclick="setLang('en')" id="btn-en">EN</button>
      <button class="lang-btn" onclick="setLang('es')" id="btn-es">ES</button>
    </div>
  </header>
  <div class="page">
    <h1><span class="en">${p.heading_en}</span><span class="es">${p.heading_es}</span></h1>
    <div class="body-content en">${p.body_en}</div>
    <div class="body-content es">${p.body_es}</div>
    <a href="/" class="back"><span class="en">← Back to Offers</span><span class="es">← Volver a Ofertas</span></a>
  </div>
  <script>
    function setLang(lang) {
      document.body.classList.toggle('spanish', lang==='es');
      document.getElementById('btn-en').classList.toggle('active', lang==='en');
      document.getElementById('btn-es').classList.toggle('active', lang==='es');
    }
    if (navigator.language && navigator.language.toLowerCase().startsWith('es')) setLang('es');
  </script>
</body>
</html>`);
}
