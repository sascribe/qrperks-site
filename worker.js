// QR-Perks Cloudflare Worker — Full Platform Build
// Env vars: SUPABASE_URL, SUPABASE_SECRET, ADMIN_PASSWORD,
//           RESEND_API_KEY, DRIVER_JWT_SECRET, W9_ENCRYPTION_KEY

// ─── FALLBACK AFFILIATES (no tracking URLs — Supabase is source of truth) ───
const FALLBACK_AFFILIATES = [
  { id:'paypal-sweeps',   name:'Win $1000 PayPal Cash',        category:'sweepstakes', offer_type:'sweepstakes', display_order:1, is_featured:true,
    icon:'💵', color:'#009CDE', status:'active', prize_description:'Win $1,000 PayPal Cash', prize_description_es:'Gana $1,000 en Efectivo PayPal',
    cta_text:'Enter Free Now', cta_text_es:'Participar Gratis', badge_en:'🎰 Win $1,000 Cash', badge_es:'🎰 Gana $1,000 en Efectivo',
    description_en:'Free entry — no purchase necessary. Takes 30 seconds.', description_es:'Entrada gratis — sin compra. Solo 30 segundos.' },
  { id:'walmart-sweeps',  name:'Win $1000 Walmart Gift Card',  category:'sweepstakes', offer_type:'sweepstakes', display_order:2, is_featured:false,
    icon:'🛒', color:'#0071CE', status:'active', prize_description:'Win $1,000 Walmart Gift Card', prize_description_es:'Gana $1,000 en Tarjeta Walmart',
    cta_text:'Enter Free Now', cta_text_es:'Participar Gratis', badge_en:'🎰 Win $1,000 Gift Card', badge_es:'🎰 Gana $1,000 en Tarjeta',
    description_en:'Free entry — no purchase necessary. Takes 30 seconds.', description_es:'Entrada gratis — sin compra. Solo 30 segundos.' },
  { id:'maybelline',      name:'Free Maybelline Set',           category:'sweepstakes', offer_type:'sweepstakes', display_order:3, is_featured:false,
    icon:'💄', color:'#FF69B4', status:'active', prize_description:'Free Maybelline Beauty Set', prize_description_es:'Set de Belleza Maybelline Gratis',
    cta_text:'Claim Free Set', cta_text_es:'Reclamar Gratis', badge_en:'🎁 Free Beauty Set', badge_es:'🎁 Set de Belleza Gratis',
    description_en:'Claim your free makeup set. Limited quantities.', description_es:'Reclama tu set gratis. Cantidades limitadas.' },
  { id:'slam-dunk-loans', name:'Get Cash Fast — Up to $50K',   category:'loans',       offer_type:'loan',        display_order:10, is_featured:false,
    icon:'🏀', color:'#FF6B00', status:'active', prize_description:'Personal Loans Up to $50K', prize_description_es:'Préstamos Hasta $50K',
    cta_text:'Get Cash Now', cta_text_es:'Obtener Dinero', badge_en:'💰 Loans Up to $50K', badge_es:'💰 Préstamos Hasta $50K',
    description_en:'Quick approval, flexible terms. Apply in minutes.', description_es:'Aprobación rápida, términos flexibles.' },
  { id:'rok-financial',   name:'ROK Financial',                 category:'business_funding', offer_type:'loan', display_order:11, is_featured:false,
    icon:'💼', color:'#F5C518', status:'active', prize_description:'Business Funding Up to $500K', prize_description_es:'Financiamiento Hasta $500K',
    cta_text:'Apply Free', cta_text_es:'Aplicar Gratis', badge_en:'💰 Business Funding', badge_es:'💰 Financiamiento',
    description_en:'Get up to $500K for your business. Fast approvals.', description_es:'Hasta $500K para tu negocio. Aprobaciones rápidas.' },
];

const T = {
  en: {
    tagline: 'Exclusive Deals for Truck Drivers',
    trust: 'Free to enter · No purchase required · Takes 30 seconds',
    more_deals: 'More Deals',
    cash_section: 'Need Cash?',
    bridge_title: (name) => `You're headed to ${name}...`,
    bridge_sub: 'Get alerts when new deals drop:',
    email_ph: 'Your email (optional)',
    phone_ph: 'Phone for SMS alerts (optional)',
    alert_btn: 'Alert Me + Continue →',
    skip_btn: 'No thanks, take me to the offer →',
    free_badge: 'FREE ENTRY',
    apply_badge: 'FREE TO APPLY',
    lang_toggle: 'ES',
  },
  es: {
    tagline: 'Ofertas Exclusivas para Conductores',
    trust: 'Gratis · Sin compra necesaria · Solo 30 segundos',
    more_deals: 'Más Ofertas',
    cash_section: '¿Necesitas Dinero?',
    bridge_title: (name) => `Te estamos redirigiendo a ${name}...`,
    bridge_sub: 'Recibe alertas cuando lleguen nuevas ofertas:',
    email_ph: 'Tu correo (opcional)',
    phone_ph: 'Teléfono para SMS (opcional)',
    alert_btn: 'Notifícarme + Continuar →',
    skip_btn: 'No gracias, ir a la oferta →',
    free_badge: 'ENTRADA GRATIS',
    apply_badge: 'APLICAR GRATIS',
    lang_toggle: 'EN',
  }
};

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

// ─── MAIN FETCH HANDLER ───
export default {
  async fetch(request, env, ctx) {
    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method;

    try {
      // Truck QR routes /t1-/t50
      if (/^\/t([1-9]|[1-4]\d|50)$/.test(path)) return handleTruck(request, env, ctx, path.slice(1));

      // /join referral route
      if (path === '/join') return handleJoin(request, env);

      // /go/ affiliate redirect
      if (path.startsWith('/go/') && method === 'GET') return handleGo(request, env, path);

      // Driver routes
      const driverRoutes = {
        'GET /driver':              () => Response.redirect(new URL('/driver/login', request.url).toString(), 302),
        'GET /driver/login':        () => handleDriverLoginPage(request, env),
        'POST /driver/login':       () => handleDriverLoginPost(request, env),
        'GET /driver/signup':       () => handleDriverSignupPage(request, env),
        'POST /driver/signup':      () => handleDriverSignupPost(request, env),
        'GET /driver/verify-email': () => handleDriverVerifyEmail(request, env),
        'GET /driver/forgot':       () => handleDriverForgotPage(request, env),
        'POST /driver/forgot':      () => handleDriverForgotPost(request, env),
        'GET /driver/reset':        () => handleDriverResetPage(request, env),
        'POST /driver/reset':       () => handleDriverResetPost(request, env),
        'POST /driver/logout':      () => handleDriverLogout(request, env),
        'GET /driver/dashboard':    () => requireDriver(request, env, handleDriverDashboard),
        'GET /driver/qr-codes':     () => requireDriver(request, env, handleDriverQrCodes),
        'POST /driver/qr-codes':    () => requireDriver(request, env, handleDriverQrCodesPost),
        'GET /driver/w9':           () => requireDriver(request, env, handleDriverW9Page),
        'POST /driver/w9':          () => requireDriver(request, env, handleDriverW9Post),
        'GET /driver/referrals':    () => requireDriver(request, env, handleDriverReferrals),
        'GET /driver/earnings':     () => requireDriver(request, env, handleDriverEarnings),
        'GET /driver/settings':     () => requireDriver(request, env, handleDriverSettings),
        'POST /driver/settings':    () => requireDriver(request, env, handleDriverSettingsPost),
      };
      const dKey = `${method} ${path}`;
      if (driverRoutes[dKey]) return driverRoutes[dKey]();

      // Admin routes
      if (path === '/admin' || path === '/admin/login') return handleAdminLoginPage(request, env);
      if (path === '/admin/dashboard' && method === 'GET') return handleAdminDashboard(request, env);
      if (path === '/admin/approve-driver' && method === 'POST') return handleAdminApproveDriver(request, env);
      if (path === '/admin/deny-driver' && method === 'POST') return handleAdminDenyDriver(request, env);
      if (path === '/admin/commissions/calculate' && method === 'POST') return handleAdminCalcCommissions(request, env);
      if (path === '/admin/commissions/mark-paid' && method === 'POST') return handleAdminMarkPaid(request, env);
      if (path === '/admin/offers' && method === 'POST') return handleAdminUpdateOffer(request, env);
      if (path === '/admin/email-campaign' && method === 'POST') return handleAdminEmailCampaign(request, env);
      if (path === '/admin/w9/review' && method === 'POST') return handleAdminW9Review(request, env);
      if (path === '/admin/logout' && method === 'POST') return handleAdminLogout(request, env);

      // API routes
      if (path === '/api/affiliates') return handleApiAffiliates(request, env);
      if (path === '/api/email/subscribe' && method === 'POST') return handleEmailSubscribe(request, env);
      if (path === '/api/capture' && method === 'POST') return handleCapture(request, env);

      // Landing page
      if (path === '/') return handleHome(request, env, ctx);

      // Static pages
      if (path === '/privacy')     return staticPage('privacy');
      if (path === '/terms')       return staticPage('terms');
      if (path === '/disclosure')  return staticPage('disclosure');
      if (path === '/contractor')  return staticPage('contractor');

      return html404();
    } catch (err) {
      console.error('Worker error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  // Monthly cron: 0 0 1 * *
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runMonthlyCommissions(env));
  }
};

// ═══════════════════════════════════════════════════════════════
// CRYPTO HELPERS — SubtleCrypto (CF Workers Web Crypto API)
// ═══════════════════════════════════════════════════════════════

// ─── Password Hashing (PBKDF2-SHA256, 100k iterations) ───
async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b=>b.toString(16).padStart(2,'0')).join('');
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name:'PBKDF2', hash:'SHA-256', salt, iterations:100000 }, key, 256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return `pbkdf2:sha256:100000:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const parts = stored.split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;
  const [, , iters, saltHex, storedHash] = parts;
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h=>parseInt(h,16)));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name:'PBKDF2', hash:'SHA-256', salt, iterations:parseInt(iters) }, key, 256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return hashHex === storedHash;
}

// ─── JWT (HMAC-SHA256) ───
async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const header = b64url(JSON.stringify({alg:'HS256',typ:'JWT'}));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigStr = b64url(new Uint8Array(sig));
  return `${data}.${sigStr}`;
}

async function verifyJwt(token, secret) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const enc = new TextEncoder();
  const data = `${parts[0]}.${parts[1]}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
  const sig = b64urlDecode(parts[2]);
  const valid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(data));
  if (!valid) return null;
  const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

function b64url(input) {
  const str = typeof input === 'string' ? input : String.fromCharCode(...input);
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

function b64urlDecode(str) {
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  return new Uint8Array([...bin].map(c=>c.charCodeAt(0)));
}

// ─── AES-256-GCM Encryption (W9 Tax ID) ───
async function encryptTaxId(plaintext, keyHex) {
  const key = await crypto.subtle.importKey(
    'raw', hexToBytes(keyHex), {name:'AES-GCM'}, false, ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(plaintext));
  const ivHex = bytesToHex(iv);
  const ctHex = bytesToHex(new Uint8Array(ciphertext));
  return `${ivHex}:${ctHex}`;
}

function hexToBytes(hex) { return new Uint8Array(hex.match(/.{2}/g).map(h=>parseInt(h,16))); }
function bytesToHex(bytes) { return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join(''); }

// ─── Secure token generation ───
function genToken(bytes = 32) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

// ─── 8-char alphanumeric referral code ───
function genReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(rand).map(b => chars[b % chars.length]).join('');
}

// ─── IP hash (SHA-256) ───
async function hashIp(ip) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(ip));
  return bytesToHex(new Uint8Array(hash)).slice(0, 16);
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════

function sbHeaders(env) {
  return {
    'apikey': env.SUPABASE_SECRET,
    'Authorization': `Bearer ${env.SUPABASE_SECRET}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function sbGet(env, table, query = '') {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHeaders(env) });
  if (!res.ok) return null;
  return res.json();
}

async function sbPost(env, table, data) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: sbHeaders(env), body: JSON.stringify(data)
  });
  if (!res.ok) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function sbPatch(env, table, filter, data) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH', headers: sbHeaders(env), body: JSON.stringify(data)
  });
  return res.ok;
}

async function sbDelete(env, table, filter) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE', headers: sbHeaders(env)
  });
  return res.ok;
}

// ═══════════════════════════════════════════════════════════════
// RESEND EMAIL HELPER
// ═══════════════════════════════════════════════════════════════

async function sendEmail(env, { to, subject, html, template_name }) {
  const fromAddr = 'noreply@qr-perks.com';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `QR Perks <${fromAddr}>`, to: [to], subject, html })
    });
    const result = await res.json();
    // Log to email_logs (fire and forget)
    sbPost(env, 'email_logs', {
      recipient: to, template_name, status: res.ok ? 'sent' : 'failed',
      error_message: res.ok ? null : JSON.stringify(result),
      resend_id: result.id || null
    }).catch(() => {});
    return res.ok ? result : null;
  } catch (err) {
    sbPost(env, 'email_logs', { recipient: to, template_name, status: 'error', error_message: String(err) }).catch(() => {});
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES (HTML, dark theme, mobile-first)
// ═══════════════════════════════════════════════════════════════

const emailBase = (content) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff}
.wrap{max-width:600px;margin:0 auto;padding:32px 24px}
.logo{text-align:center;font-size:22px;font-weight:800;letter-spacing:2px;color:#F5C518;margin-bottom:32px}
.card{background:#141414;border:1px solid #222;border-radius:12px;padding:28px 24px;margin-bottom:20px}
h1{margin:0 0 16px;font-size:22px;font-weight:700;color:#fff}
p{margin:0 0 14px;font-size:15px;line-height:1.6;color:#ccc}
.btn{display:block;background:#F5C518;color:#000;text-decoration:none;text-align:center;padding:14px 24px;border-radius:8px;font-weight:700;font-size:16px;margin:20px 0}
.btn-outline{background:transparent;border:2px solid #F5C518;color:#F5C518}
.dim{color:#666;font-size:13px}
.tag{display:inline-block;background:#F5C518;color:#000;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:700;margin-bottom:12px}
a{color:#F5C518}
hr{border:none;border-top:1px solid #222;margin:20px 0}
</style></head><body><div class="wrap">
<div class="logo">QR PERKS</div>
${content}
<hr>
<p class="dim" style="text-align:center">
  QR Perks · qr-perks.com<br>
  <a href="https://qr-perks.com/unsubscribe" style="color:#555">Unsubscribe</a>
</p>
</div></body></html>`;

function emailWelcome(driver) {
  return emailBase(`<div class="card">
<div class="tag">WELCOME</div>
<h1>Welcome to QR Perks, ${driver.name}!</h1>
<p>Your account is now active. Here's how to get started earning:</p>
<p><strong>How you earn:</strong></p>
<p>💰 <strong>20%</strong> of commissions from every conversion your truck QR code generates<br>
👥 <strong>10%</strong> of commissions from every driver you refer, forever</p>
<a href="https://qr-perks.com/driver/dashboard" class="btn">Go to Your Dashboard →</a>
<a href="https://qr-perks.com/driver/qr-codes" class="btn btn-outline">Download Your QR Code →</a>
<p><strong>Your referral link:</strong><br>
<code style="background:#1e1e1e;padding:8px 12px;border-radius:4px;display:block;margin:8px 0;color:#F5C518;font-size:13px">https://qr-perks.com/join?ref=${driver.referral_code}</code></p>
<p>Share this link to recruit other drivers and earn 10% of their commissions.</p>
<hr>
<p style="color:#999;font-size:13px"><strong>DOS AND DON'TS:</strong> Place the QR on your truck only. Do not post the truck QR online. Do not scan your own code. Full rules at: <a href="https://qr-perks.com/driver/qr-codes">qr-perks.com/driver/qr-codes</a></p>
<p class="dim">Questions? Email us at support@qr-perks.com</p>
</div>`);
}

function emailVerification(driver, token) {
  const link = `https://qr-perks.com/driver/verify-email?token=${token}`;
  return emailBase(`<div class="card">
<div class="tag">VERIFY EMAIL</div>
<h1>Confirm your email address</h1>
<p>Hi ${driver.name}, thanks for signing up for QR Perks.</p>
<p>Click below to verify your email. After verification, an admin will review and activate your account.</p>
<a href="${link}" class="btn">Verify My Email →</a>
<p class="dim">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
</div>`);
}

function emailPasswordReset(token) {
  const link = `https://qr-perks.com/driver/reset?token=${token}`;
  return emailBase(`<div class="card">
<div class="tag">PASSWORD RESET</div>
<h1>Reset your password</h1>
<p>We received a request to reset your QR Perks password.</p>
<a href="${link}" class="btn">Reset My Password →</a>
<p class="dim">This link expires in 1 hour. If you didn't request this, you can safely ignore this email. Your password won't change until you click the link above.</p>
</div>`);
}

function emailW9Confirmation(driver) {
  return emailBase(`<div class="card">
<div class="tag">W9 RECEIVED</div>
<h1>W9 Received — Thank You</h1>
<p>Hi ${driver.name}, we've received your W9 tax information.</p>
<p>Our team will review it within 2-3 business days. You'll receive payouts on the 1st of each month once your W9 is on file and your earnings meet the $25 minimum.</p>
<p>If you need to make corrections, contact us at <a href="mailto:support@qr-perks.com">support@qr-perks.com</a> before your first payout.</p>
<a href="https://qr-perks.com/driver/earnings" class="btn">View Your Earnings →</a>
</div>`);
}

function emailReferralSignup(referrer, newDriverName) {
  return emailBase(`<div class="card">
<div class="tag">NEW REFERRAL</div>
<h1>Someone joined using your link!</h1>
<p>Hi ${referrer.name}, <strong>${newDriverName}</strong> just signed up using your referral link.</p>
<p>Once their account is activated and they start generating conversions, you'll earn <strong>10%</strong> of their commissions automatically — no action needed.</p>
<a href="https://qr-perks.com/driver/referrals" class="btn">View Your Referrals →</a>
</div>`);
}

function emailNewDeal(offer) {
  return emailBase(`<div class="card">
<div class="tag">NEW DEAL</div>
<h1>New deal just dropped on QR Perks!</h1>
<p style="font-size:28px;text-align:center;margin:16px 0">${offer.icon || '🎰'}</p>
<h2 style="text-align:center;color:#F5C518;margin:0 0 8px">${offer.prize_description}</h2>
<p style="text-align:center">${offer.description_en}</p>
<a href="https://qr-perks.com" class="btn">${offer.cta_text || 'Claim Now'} →</a>
<p class="dim" style="text-align:center">Free to enter · No purchase required</p>
</div>`);
}

// ═══════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

async function getDriverFromCookie(request, env) {
  const cookie = getCookie(request, 'qrp_driver_session');
  if (!cookie) return null;
  try {
    const payload = await verifyJwt(cookie, env.DRIVER_JWT_SECRET);
    if (!payload || !payload.driver_id) return null;
    return payload;
  } catch { return null; }
}

async function requireDriver(request, env, handler) {
  const session = await getDriverFromCookie(request, env);
  if (!session) return Response.redirect(new URL('/driver/login', request.url).toString(), 302);
  // Fetch fresh driver data
  const drivers = await sbGet(env, 'drivers', `id=eq.${session.driver_id}&select=*`);
  if (!drivers || !drivers[0]) return Response.redirect(new URL('/driver/login', request.url).toString(), 302);
  const driver = drivers[0];
  if (driver.status !== 'active') {
    return html('<p style="color:#F5C518;text-align:center;margin-top:100px">Your account is pending approval.</p>', 403);
  }
  // Refresh session cookie
  const newToken = await signJwt(
    { driver_id: driver.id, referral_code: driver.referral_code, status: driver.status, exp: Math.floor(Date.now()/1000) + 604800 },
    env.DRIVER_JWT_SECRET
  );
  const response = await handler(request, env, driver);
  // Clone response and add refreshed cookie
  const resp = new Response(response.body, response);
  resp.headers.set('Set-Cookie', sessionCookie(newToken));
  return resp;
}

function sessionCookie(token, clear = false) {
  if (clear) return `qrp_driver_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  return `qrp_driver_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

function isAdminAuthed(request, env) {
  const cookie = getCookie(request, 'qrp_admin_session');
  return cookie && cookie === env.ADMIN_PASSWORD;
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE — INSTANT DEAL MODEL
// ═══════════════════════════════════════════════════════════════

async function handleHome(request, env, ctx) {
  return handleTruckPage(request, env, ctx, null);
}

async function handleTruck(request, env, ctx, truckId) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const country = request.headers.get('CF-IPCountry') || '';
  const ua = request.headers.get('User-Agent') || '';
  ctx.waitUntil(sbPost(env, 'scans', { truck_id: truckId, ip, country, user_agent: ua }).catch(() => {}));
  const resp = await handleTruckPage(request, env, ctx, truckId);
  const r = new Response(resp.body, resp);
  r.headers.set('Set-Cookie', `qrp_truck=${truckId}; Path=/; Max-Age=86400; SameSite=Lax`);
  return r;
}

async function handleTruckPage(request, env, ctx, truckId) {
  let affiliates = FALLBACK_AFFILIATES;
  try {
    const rows = await sbGet(env, 'affiliates', 'select=*&status=eq.active&order=display_order.asc');
    if (rows && rows.length > 0) affiliates = rows;
  } catch {}

  const featured = affiliates.find(a => a.is_featured) || affiliates[0];
  const sweepstakes = affiliates.filter(a => a.offer_type === 'sweepstakes' && a.id !== featured.id);
  const loans = affiliates.filter(a => a.offer_type === 'loan');
  const subId = truckId ? `qrp_${truckId}` : 'qrp_web';

  return html(`<!DOCTYPE html>
<html lang="en" id="qrp-root">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="description" content="Exclusive deals for QR Perks visitors — free sweepstakes, cash offers, and more.">
<title>QR Perks — Exclusive Deals</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0a;--surface:#141414;--border:#222;--accent:#F5C518;--text:#fff;--sub:#999;--radius:12px}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;min-height:100vh;overflow-x:hidden}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)}
.logo{font-size:20px;font-weight:800;letter-spacing:2px;color:var(--accent)}
.lang-btn{background:none;border:1px solid var(--border);color:var(--sub);padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer;font-weight:600}
.hero{padding:24px 20px 0}
.tagline{font-size:13px;color:var(--sub);text-align:center;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px}
.tagline .en,.tagline .es{display:none}
.featured-card{background:linear-gradient(145deg,#1a1a1a,var(--surface));border:2px solid var(--accent);border-radius:16px;padding:24px 20px;text-align:center;margin-bottom:16px}
.fc-badge{display:inline-block;background:var(--accent);color:#000;font-size:11px;font-weight:800;letter-spacing:1.5px;padding:4px 10px;border-radius:4px;margin-bottom:12px}
.fc-icon{font-size:48px;margin:8px 0}
.fc-title{font-size:24px;font-weight:800;margin:8px 0;line-height:1.2}
.fc-desc{color:var(--sub);font-size:14px;margin:8px 0 20px}
.cta-btn{display:block;width:100%;min-height:56px;background:var(--accent);color:#000;border:none;border-radius:10px;font-size:18px;font-weight:800;cursor:pointer;letter-spacing:0.5px;line-height:56px;text-decoration:none}
.cta-btn:active{transform:scale(0.98)}
.trust-strip{text-align:center;font-size:12px;color:var(--sub);margin:10px 0 4px;letter-spacing:0.3px}
.trust-strip .en,.trust-strip .es{display:none}
.section-hdr{padding:24px 20px 12px;font-size:13px;font-weight:700;color:var(--sub);letter-spacing:1.5px;text-transform:uppercase}
.section-hdr .en,.section-hdr .es{display:none}
.deal-grid{padding:0 20px;display:flex;flex-direction:column;gap:12px}
.deal-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;display:flex;align-items:center;gap:14px}
.dc-icon{font-size:32px;flex-shrink:0}
.dc-body{flex:1;min-width:0}
.dc-name{font-size:15px;font-weight:700;margin-bottom:4px}
.dc-desc{font-size:13px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-btn{flex-shrink:0;background:transparent;border:1.5px solid var(--border);color:var(--text);padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap}
.loan-card{background:linear-gradient(135deg,#1a1200,var(--surface));border-color:#F5C51855}
.loan-badge{display:inline-block;background:#F5C518;color:#000;font-size:10px;font-weight:800;padding:2px 8px;border-radius:3px;margin-bottom:6px}
.spacer{height:40px}

/* Bridge overlay */
#bridge{display:none;position:fixed;inset:0;background:#0a0a0a;z-index:9999;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px}
#bridge.show{display:flex}
.bridge-title{font-size:22px;font-weight:800;text-align:center;margin-bottom:8px}
.bridge-sub{font-size:14px;color:var(--sub);text-align:center;margin-bottom:28px}
.bridge-sub .en,.bridge-sub .es{display:none}
.progress-bar{width:100%;max-width:320px;height:4px;background:#222;border-radius:2px;overflow:hidden;margin-bottom:32px}
.progress-fill{height:100%;background:var(--accent);width:0%;transition:width 1.5s ease-out}
.bridge-form{width:100%;max-width:360px}
.bridge-input{width:100%;background:#141414;border:1px solid #333;color:#fff;padding:14px 16px;border-radius:8px;font-size:16px;margin-bottom:10px;-webkit-appearance:none}
.bridge-input:focus{outline:none;border-color:var(--accent)}
.bridge-btn{width:100%;background:var(--accent);color:#000;border:none;padding:16px;border-radius:8px;font-size:16px;font-weight:800;cursor:pointer;margin-bottom:12px}
.bridge-skip{background:none;border:none;color:var(--sub);font-size:13px;text-decoration:underline;cursor:pointer;width:100%;text-align:center}
.bridge-skip .en,.bridge-skip .es{display:none}
</style>
</head>
<body>

<div id="bridge">
  <div class="bridge-title" id="bridge-title"></div>
  <div class="progress-bar"><div class="progress-fill" id="bridge-bar"></div></div>
  <div class="bridge-sub"><span class="en">Get alerts when new deals drop:</span><span class="es">Recibe alertas cuando lleguen nuevas ofertas:</span></div>
  <div class="bridge-form">
    <input class="bridge-input" type="email" id="bridge-email" placeholder="Your email (optional)" autocomplete="email">
    <input class="bridge-input" type="tel" id="bridge-phone" placeholder="Phone for SMS alerts (optional)" autocomplete="tel">
    <button class="bridge-btn" id="bridge-alert-btn">Alert Me + Continue →</button>
    <button class="bridge-skip"><span class="en">No thanks, take me to the offer →</span><span class="es">No gracias, ir a la oferta →</span></button>
  </div>
</div>

<header class="hdr">
  <div class="logo">QR PERKS</div>
  <button class="lang-btn" id="lang-btn">ES</button>
</header>

<div class="hero">
  <div class="tagline"><span class="en">Exclusive Deals for Truck Drivers</span><span class="es">Ofertas Exclusivas para Conductores</span></div>
  <div class="featured-card">
    <div class="fc-badge en">${featured.offer_type === 'sweepstakes' ? 'FREE ENTRY' : 'FREE TO APPLY'}</div>
    <div class="fc-badge es" style="display:none">${featured.offer_type === 'sweepstakes' ? 'ENTRADA GRATIS' : 'APLICAR GRATIS'}</div>
    <div class="fc-icon">${featured.icon || '🎰'}</div>
    <div class="fc-title"><span class="en">${featured.prize_description || featured.name}</span><span class="es">${featured.prize_description_es || featured.name}</span></div>
    <div class="fc-desc"><span class="en">${featured.description_en || ''}</span><span class="es">${featured.description_es || ''}</span></div>
    <button class="cta-btn" onclick="openBridge('${featured.id}','${subId}','${featured.prize_description || featured.name}','${featured.prize_description_es || featured.name}')">
      <span class="en">${featured.cta_text || 'Enter Free Now'} →</span>
      <span class="es">${featured.cta_text_es || 'Participar Gratis'} →</span>
    </button>
  </div>
  <div class="trust-strip"><span class="en">Free to enter · No purchase required · Takes 30 seconds</span><span class="es">Gratis · Sin compra necesaria · Solo 30 segundos</span></div>
</div>

${sweepstakes.length > 0 ? `
<div class="section-hdr"><span class="en">More Deals</span><span class="es">Más Ofertas</span></div>
<div class="deal-grid">
${sweepstakes.map(a => `
<div class="deal-card">
  <div class="dc-icon">${a.icon || '🎰'}</div>
  <div class="dc-body">
    <div class="dc-name"><span class="en">${a.prize_description || a.name}</span><span class="es">${a.prize_description_es || a.name}</span></div>
    <div class="dc-desc"><span class="en">${a.description_en || ''}</span><span class="es">${a.description_es || ''}</span></div>
  </div>
  <button class="dc-btn" onclick="openBridge('${a.id}','${subId}','${a.prize_description || a.name}','${a.prize_description_es || a.name}')">
    <span class="en">${a.cta_text || 'Enter'}</span><span class="es">${a.cta_text_es || 'Entrar'}</span>
  </button>
</div>`).join('')}
</div>` : ''}

${loans.length > 0 ? `
<div class="section-hdr"><span class="en">Need Cash?</span><span class="es">¿Necesitas Dinero?</span></div>
<div class="deal-grid">
${loans.map(a => `
<div class="deal-card loan-card">
  <div class="dc-icon">${a.icon || '💰'}</div>
  <div class="dc-body">
    <div class="loan-badge"><span class="en">FREE TO APPLY</span><span class="es">APLICAR GRATIS</span></div>
    <div class="dc-name"><span class="en">${a.prize_description || a.name}</span><span class="es">${a.prize_description_es || a.name}</span></div>
    <div class="dc-desc"><span class="en">${a.description_en || ''}</span><span class="es">${a.description_es || ''}</span></div>
  </div>
  <button class="dc-btn" onclick="openBridge('${a.id}','${subId}','${a.prize_description || a.name}','${a.prize_description_es || a.name}')">
    <span class="en">${a.cta_text || 'Apply'}</span><span class="es">${a.cta_text_es || 'Aplicar'}</span>
  </button>
</div>`).join('')}
</div>` : ''}

<div class="spacer"></div>

<script>
const TRUCK_ID = ${JSON.stringify(truckId)};
const SUB_ID   = ${JSON.stringify(subId)};
let bridgeUrl  = null;

// Language
function getLang() { return localStorage.getItem('qrp_lang') || (navigator.language.startsWith('es') ? 'es' : 'en'); }
function setLang(l) {
  localStorage.setItem('qrp_lang', l);
  document.getElementById('lang-btn').textContent = l === 'en' ? 'ES' : 'EN';
  document.querySelectorAll('.en').forEach(el => el.style.display = l === 'en' ? '' : 'none');
  document.querySelectorAll('.es').forEach(el => el.style.display = l === 'es' ? '' : 'none');
  document.getElementById('bridge-email').placeholder = l === 'en' ? 'Your email (optional)' : 'Tu correo (opcional)';
  document.getElementById('bridge-phone').placeholder = l === 'en' ? 'Phone for SMS alerts (optional)' : 'Teléfono para SMS (opcional)';
}
document.getElementById('lang-btn').addEventListener('click', () => setLang(getLang() === 'en' ? 'es' : 'en'));
setLang(getLang());

// Bridge
function openBridge(affiliateId, subId, nameEn, nameEs) {
  const l = getLang();
  bridgeUrl = '/go/' + affiliateId + '?t=' + (TRUCK_ID || 'web');
  document.getElementById('bridge-title').textContent = l === 'en'
    ? 'You\'re headed to ' + nameEn + '...'
    : 'Te dirigimos a ' + nameEs + '...';
  const bridge = document.getElementById('bridge');
  bridge.classList.add('show');
  // Animate progress bar
  setTimeout(() => { document.getElementById('bridge-bar').style.width = '100%'; }, 50);
  // Auto-redirect after 5 seconds if no action
  let autoTimer = setTimeout(() => doRedirect(), 5000);

  document.getElementById('bridge-alert-btn').onclick = async () => {
    clearTimeout(autoTimer);
    const email = document.getElementById('bridge-email').value.trim();
    const phone = document.getElementById('bridge-phone').value.trim();
    if (email || phone) {
      await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, source: TRUCK_ID || 'web', offer_clicked: affiliateId })
      }).catch(() => {});
    }
    doRedirect();
  };
  bridge.querySelectorAll('.bridge-skip').forEach(btn => {
    btn.onclick = () => { clearTimeout(autoTimer); doRedirect(); };
  });
}
function doRedirect() { if (bridgeUrl) window.location.href = bridgeUrl; }
</script>
</body></html>`);
}

// ═══════════════════════════════════════════════════════════════
// TRUCK SCAN + GO HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleGo(request, env, path) {
  const affiliateId = path.replace('/go/', '').split('?')[0];
  const url = new URL(request.url);
  const truckId = url.searchParams.get('t') || getCookie(request, 'qrp_truck') || 'web';
  let destUrl = null;
  try {
    const rows = await sbGet(env, 'affiliates', `id=eq.${affiliateId}&select=url`);
    if (rows && rows[0]) destUrl = rows[0].url;
  } catch {}
  if (!destUrl) {
    const fb = FALLBACK_AFFILIATES.find(a => a.id === affiliateId);
    destUrl = fb ? 'https://qr-perks.com' : 'https://qr-perks.com';
  }
  const dest = new URL(destUrl);
  dest.searchParams.set('s2', `qrp_${truckId}`);
  dest.searchParams.set('utm_source', 'qrperks');
  dest.searchParams.set('utm_medium', 'qr');
  dest.searchParams.set('utm_campaign', truckId);
  return Response.redirect(dest.toString(), 302);
}

async function handleJoin(request, env) {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref') || '';
  return Response.redirect(`/driver/signup?ref=${encodeURIComponent(ref)}`, 302);
}

async function handleCapture(request, env) {
  try {
    const body = await request.json();
    const { email, phone, source, offer_clicked } = body;
    if (!email && !phone) return jsonResponse({ ok: false });
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ip_hash = await hashIp(ip);
    await sbPost(env, 'email_captures', { email: email || null, phone: phone || null, source, offer_clicked, ip_hash });
    return jsonResponse({ ok: true });
  } catch { return jsonResponse({ ok: false }); }
}

async function handleEmailSubscribe(request, env) {
  try {
    const body = await request.json();
    await sbPost(env, 'email_signups', { email: body.email, truck_id: body.truck_id || null, lang: body.lang || 'en' });
    return jsonResponse({ ok: true });
  } catch { return jsonResponse({ ok: false }); }
}

async function handleApiAffiliates(request, env) {
  try {
    const rows = await sbGet(env, 'affiliates', 'select=id,name,icon,color,status,offer_type,display_order,cta_text,prize_description&order=display_order.asc');
    return jsonResponse(rows || FALLBACK_AFFILIATES.map(a => ({ id:a.id, name:a.name, icon:a.icon, color:a.color, status:a.status, offer_type:a.offer_type, display_order:a.display_order, cta_text:a.cta_text, prize_description:a.prize_description })));
  } catch { return jsonResponse([]); }
}

// ═══════════════════════════════════════════════════════════════
// DRIVER AUTH PAGES
// ═══════════════════════════════════════════════════════════════

const driverLayout = (title, content, extraScript = '') => html(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — QR Perks</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#141414;border:1px solid #222;border-radius:16px;padding:36px 28px;width:100%;max-width:420px}
.logo{text-align:center;font-size:20px;font-weight:800;letter-spacing:2px;color:#F5C518;margin-bottom:28px}
h1{font-size:22px;font-weight:700;margin-bottom:6px}
.sub{color:#999;font-size:14px;margin-bottom:24px}
label{display:block;font-size:13px;color:#aaa;margin-bottom:6px;font-weight:500}
input,select,textarea{width:100%;background:#0a0a0a;border:1px solid #333;color:#fff;padding:13px 14px;border-radius:8px;font-size:15px;margin-bottom:16px;-webkit-appearance:none}
input:focus,select:focus{outline:none;border-color:#F5C518}
.btn{width:100%;background:#F5C518;color:#000;border:none;padding:14px;border-radius:8px;font-size:16px;font-weight:800;cursor:pointer;margin-top:4px}
.btn:hover{background:#e6b800}
.btn-ghost{background:transparent;border:1px solid #333;color:#aaa;margin-top:10px}
.err{background:#3a0000;border:1px solid #7a0000;color:#ff6b6b;padding:12px;border-radius:8px;font-size:14px;margin-bottom:16px;display:none}
.err.show{display:block}
.ok{background:#0a2e0a;border:1px solid #0a5a0a;color:#4ade80;padding:12px;border-radius:8px;font-size:14px;margin-bottom:16px;display:none}
.ok.show{display:block}
.links{text-align:center;margin-top:16px;font-size:13px;color:#666}
.links a{color:#F5C518;text-decoration:none}
</style></head><body>
<div class="card">
<div class="logo">QR PERKS</div>
${content}
</div>
${extraScript}
</body></html>`);

async function handleDriverLoginPage(request, env) {
  const url = new URL(request.url);
  const msg = url.searchParams.get('msg') || '';
  return driverLayout('Driver Login', `
<h1>Driver Login</h1>
<p class="sub">Access your QR Perks dashboard</p>
${msg === 'verified' ? '<div class="ok show">Email verified! Your account is pending admin approval.</div>' : ''}
${msg === 'reset' ? '<div class="ok show">Password updated. You can now log in.</div>' : ''}
<div class="err" id="err"></div>
<form id="lform">
  <label>Email</label>
  <input type="email" name="email" required autocomplete="email">
  <label>Password</label>
  <input type="password" name="password" required autocomplete="current-password">
  <button class="btn" type="submit">Log In →</button>
</form>
<div class="links"><a href="/driver/forgot">Forgot password?</a> · <a href="/driver/signup">Sign up</a></div>`,
`<script>
document.getElementById('lform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const r = await fetch('/driver/login', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }) });
  const d = await r.json();
  if (d.ok) { window.location.href = '/driver/dashboard'; }
  else { const el = document.getElementById('err'); el.textContent = d.error || 'Login failed'; el.classList.add('show'); }
});
</script>`);
}

async function handleDriverLoginPost(request, env) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return jsonResponse({ ok: false, error: 'Email and password required' }, 400);
    const rows = await sbGet(env, 'drivers', `email=eq.${encodeURIComponent(email)}&select=*`);
    const driver = rows && rows[0];
    if (!driver) return jsonResponse({ ok: false, error: 'Invalid email or password' }, 401);
    if (!driver.password_hash) return jsonResponse({ ok: false, error: 'Account not set up. Use forgot password.' }, 401);
    const ok = await verifyPassword(password, driver.password_hash);
    if (!ok) return jsonResponse({ ok: false, error: 'Invalid email or password' }, 401);
    if (!driver.email_verified) return jsonResponse({ ok: false, error: 'Please verify your email first. Check your inbox.' }, 403);
    if (driver.status === 'pending') return jsonResponse({ ok: false, error: 'Your account is pending admin approval.' }, 403);
    if (driver.status === 'suspended') return jsonResponse({ ok: false, error: 'Account suspended. Contact support@qr-perks.com' }, 403);
    if (driver.status !== 'active') return jsonResponse({ ok: false, error: 'Account inactive. Contact support.' }, 403);
    const token = await signJwt(
      { driver_id: driver.id, referral_code: driver.referral_code, status: driver.status, exp: Math.floor(Date.now()/1000) + 604800 },
      env.DRIVER_JWT_SECRET
    );
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(token) }
    });
  } catch (err) { return jsonResponse({ ok: false, error: 'Server error' }, 500); }
}

async function handleDriverSignupPage(request, env) {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref') || '';
  return driverLayout('Driver Signup', `
<h1>Join QR Perks</h1>
<p class="sub">Apply to become a QR Perks driver and earn passive income</p>
<div class="err" id="err"></div>
<form id="sform">
  <label>Full Name</label>
  <input type="text" name="name" required autocomplete="name">
  <label>Email</label>
  <input type="email" name="email" required autocomplete="email">
  <label>Phone (optional)</label>
  <input type="tel" name="phone" autocomplete="tel">
  <label>Password (min 8 characters)</label>
  <input type="password" name="password" required minlength="8" autocomplete="new-password">
  <label>Confirm Password</label>
  <input type="password" name="confirm" required minlength="8" autocomplete="new-password">
  <label>Referral Code (optional)</label>
  <input type="text" name="ref_code" value="${ref}" ${ref ? 'readonly style="color:#F5C518;background:#0f0a00"' : ''}>
  <button class="btn" type="submit">Apply Now →</button>
</form>
<div class="links">Already have an account? <a href="/driver/login">Log in</a></div>`,
`<script>
document.getElementById('sform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (fd.get('password') !== fd.get('confirm')) {
    const el = document.getElementById('err'); el.textContent = 'Passwords do not match'; el.classList.add('show'); return;
  }
  const r = await fetch('/driver/signup', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ name:fd.get('name'), email:fd.get('email'), phone:fd.get('phone'), password:fd.get('password'), ref_code:fd.get('ref_code') }) });
  const d = await r.json();
  if (d.ok) { document.getElementById('sform').innerHTML = '<div class="ok show">'+d.message+'</div>'; }
  else { const el = document.getElementById('err'); el.textContent = d.error; el.classList.add('show'); }
});
</script>`);
}

async function handleDriverSignupPost(request, env) {
  try {
    const { name, email, phone, password, ref_code } = await request.json();
    if (!name || !email || !password) return jsonResponse({ ok: false, error: 'Name, email, and password are required' }, 400);
    if (password.length < 8) return jsonResponse({ ok: false, error: 'Password must be at least 8 characters' }, 400);
    // Check email not already registered
    const existing = await sbGet(env, 'drivers', `email=eq.${encodeURIComponent(email)}&select=id`);
    if (existing && existing.length > 0) return jsonResponse({ ok: false, error: 'Email already registered. Try logging in.' }, 409);
    // Look up referral code
    let referred_by = null;
    let referrerDriver = null;
    if (ref_code) {
      const refRows = await sbGet(env, 'drivers', `referral_code=eq.${encodeURIComponent(ref_code)}&select=id,name`);
      if (refRows && refRows[0]) { referred_by = refRows[0].id; referrerDriver = refRows[0]; }
    }
    const password_hash = await hashPassword(password);
    // Generate unique referral code
    let referral_code, attempts = 0;
    do {
      referral_code = genReferralCode();
      const check = await sbGet(env, 'drivers', `referral_code=eq.${referral_code}&select=id`);
      if (!check || check.length === 0) break;
    } while (++attempts < 5);
    // Create driver
    const newDriverRows = await sbPost(env, 'drivers', {
      name, email, phone: phone || null, password_hash, referral_code,
      referred_by: referred_by || null, status: 'pending', email_verified: false
    });
    const newDriver = newDriverRows && newDriverRows[0];
    if (!newDriver) return jsonResponse({ ok: false, error: 'Failed to create account. Try again.' }, 500);
    // Create referral record
    if (referred_by) {
      await sbPost(env, 'referrals', { referrer_driver_id: referred_by, referred_driver_id: newDriver.id });
    }
    // Send verification email
    const verifyToken = genToken(32);
    await sbPost(env, 'email_verifications', {
      driver_id: newDriver.id, token: verifyToken,
      expires_at: new Date(Date.now() + 86400000).toISOString()
    });
    await sendEmail(env, { to: email, subject: 'Verify your QR Perks email', html: emailVerification(newDriver, verifyToken), template_name: 'email_verification' });
    // Notify referrer
    if (referrerDriver) {
      await sendEmail(env, { to: referrerDriver.email, subject: 'Someone joined QR Perks using your referral link', html: emailReferralSignup(referrerDriver, name), template_name: 'referral_signup' });
    }
    return jsonResponse({ ok: true, message: 'Check your email to verify your account. An admin will activate it after verification.' });
  } catch (err) { return jsonResponse({ ok: false, error: 'Server error. Try again.' }, 500); }
}

async function handleDriverVerifyEmail(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return driverLayout('Verify Email', '<h1>Invalid Link</h1><p class="sub">Missing verification token.</p>');
  const rows = await sbGet(env, 'email_verifications', `token=eq.${token}&select=*`);
  const rec = rows && rows[0];
  if (!rec) return driverLayout('Verify Email', '<h1>Invalid Link</h1><p class="sub">This verification link is invalid or has already been used.</p>');
  if (rec.verified) return driverLayout('Verify Email', '<h1>Already Verified</h1><p class="sub">Your email is already verified. <a href="/driver/login">Log in</a></p>');
  if (new Date(rec.expires_at) < new Date()) return driverLayout('Verify Email', '<h1>Link Expired</h1><p class="sub">This link expired. <a href="/driver/signup">Sign up again</a> or contact support.</p>');
  await sbPatch(env, 'email_verifications', `id=eq.${rec.id}`, { verified: true });
  await sbPatch(env, 'drivers', `id=eq.${rec.driver_id}`, { email_verified: true, email_verified_at: new Date().toISOString() });
  return Response.redirect('/driver/login?msg=verified', 302);
}

async function handleDriverForgotPage(request, env) {
  return driverLayout('Forgot Password', `
<h1>Forgot Password</h1>
<p class="sub">Enter your email and we'll send a reset link</p>
<div class="ok" id="ok"></div>
<div class="err" id="err"></div>
<form id="fform">
  <label>Email</label>
  <input type="email" name="email" required autocomplete="email">
  <button class="btn" type="submit">Send Reset Link →</button>
</form>
<div class="links"><a href="/driver/login">Back to login</a></div>`,
`<script>
document.getElementById('fform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const r = await fetch('/driver/forgot', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email: fd.get('email') }) });
  const d = await r.json();
  document.getElementById('ok').textContent = "If that email exists, a reset link has been sent.";
  document.getElementById('ok').classList.add('show');
  document.getElementById('fform').style.display='none';
});
</script>`);
}

async function handleDriverForgotPost(request, env) {
  try {
    const { email } = await request.json();
    if (!email) return jsonResponse({ ok: true }); // Prevent enumeration
    const rows = await sbGet(env, 'drivers', `email=eq.${encodeURIComponent(email)}&select=id,name`);
    const driver = rows && rows[0];
    if (driver) {
      const token = genToken(32);
      await sbPost(env, 'password_resets', { driver_id: driver.id, token, expires_at: new Date(Date.now() + 3600000).toISOString() });
      await sendEmail(env, { to: email, subject: 'Reset your QR Perks password', html: emailPasswordReset(token), template_name: 'password_reset' });
    }
    return jsonResponse({ ok: true });
  } catch { return jsonResponse({ ok: true }); }
}

async function handleDriverResetPage(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const rows = token ? await sbGet(env, 'password_resets', `token=eq.${token}&used=eq.false&select=*`) : null;
  const rec = rows && rows[0];
  if (!rec || new Date(rec.expires_at) < new Date()) {
    return driverLayout('Reset Password', '<h1>Link Expired</h1><p class="sub">This reset link is invalid or expired. <a href="/driver/forgot">Request a new one</a>.</p>');
  }
  return driverLayout('Reset Password', `
<h1>Set New Password</h1>
<p class="sub">Choose a strong password (min 8 characters)</p>
<div class="err" id="err"></div>
<form id="rform">
  <input type="hidden" name="token" value="${token}">
  <label>New Password</label>
  <input type="password" name="password" required minlength="8" autocomplete="new-password">
  <label>Confirm Password</label>
  <input type="password" name="confirm" required minlength="8" autocomplete="new-password">
  <button class="btn" type="submit">Update Password →</button>
</form>`,
`<script>
document.getElementById('rform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (fd.get('password') !== fd.get('confirm')) {
    const el = document.getElementById('err'); el.textContent='Passwords do not match'; el.classList.add('show'); return;
  }
  const r = await fetch('/driver/reset', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ token: fd.get('token'), password: fd.get('password') }) });
  const d = await r.json();
  if (d.ok) window.location.href = '/driver/login?msg=reset';
  else { const el = document.getElementById('err'); el.textContent = d.error; el.classList.add('show'); }
});
</script>`);
}

async function handleDriverResetPost(request, env) {
  try {
    const { token, password } = await request.json();
    if (!token || !password || password.length < 8) return jsonResponse({ ok: false, error: 'Invalid request' }, 400);
    const rows = await sbGet(env, 'password_resets', `token=eq.${token}&used=eq.false&select=*`);
    const rec = rows && rows[0];
    if (!rec || new Date(rec.expires_at) < new Date()) return jsonResponse({ ok: false, error: 'Link expired. Request a new one.' }, 400);
    const hash = await hashPassword(password);
    await sbPatch(env, 'drivers', `id=eq.${rec.driver_id}`, { password_hash: hash });
    await sbPatch(env, 'password_resets', `id=eq.${rec.id}`, { used: true });
    return jsonResponse({ ok: true });
  } catch { return jsonResponse({ ok: false, error: 'Server error' }, 500); }
}

async function handleDriverLogout(request, env) {
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/driver/login', 'Set-Cookie': sessionCookie('', true) }
  });
}

// ═══════════════════════════════════════════════════════════════
// DRIVER DASHBOARD PAGES
// ═══════════════════════════════════════════════════════════════

const driverNav = (active) => `
<nav style="background:#141414;border-bottom:1px solid #222;padding:0 20px;overflow-x:auto;white-space:nowrap;display:flex;align-items:center;min-height:50px;gap:4px">
<span style="font-weight:800;color:#F5C518;margin-right:12px;font-size:16px;letter-spacing:1px">QRP</span>
${[['dashboard','Dashboard'],['qr-codes','QR Codes'],['earnings','Earnings'],['referrals','Referrals'],['w9','W9'],['settings','Settings']].map(([p,l])=>
  `<a href="/driver/${p}" style="color:${active===p?'#F5C518':'#aaa'};text-decoration:none;padding:8px 10px;font-size:13px;font-weight:${active===p?'700':'400'};border-bottom:${active===p?'2px solid #F5C518':'2px solid transparent'}">${l}</a>`
).join('')}
<form action="/driver/logout" method="POST" style="margin-left:auto">
<button type="submit" style="background:none;border:none;color:#666;cursor:pointer;font-size:13px;padding:8px">Logout</button>
</form>
</nav>`;

const dashLayout = (title, active, content) => html(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — QR Perks</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
.page{padding:24px 20px;max-width:800px;margin:0 auto}
h1{font-size:22px;font-weight:700;margin-bottom:4px}
.sub{color:#999;font-size:14px;margin-bottom:24px}
.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
@media(min-width:500px){.cards{grid-template-columns:repeat(4,1fr)}}
.stat-card{background:#141414;border:1px solid #222;border-radius:12px;padding:16px;text-align:center}
.stat-num{font-size:24px;font-weight:800;color:#F5C518;margin-bottom:4px}
.stat-lbl{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px}
.section{background:#141414;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px}
.section h2{font-size:16px;font-weight:700;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{color:#666;font-weight:600;text-align:left;padding:8px 0;border-bottom:1px solid #222}
td{padding:10px 0;border-bottom:1px solid #1a1a1a;color:#ccc}
td:last-child,th:last-child{text-align:right}
.badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700}
.badge-active{background:#0a2e0a;color:#4ade80}
.badge-pending{background:#2e2000;color:#F5C518}
.badge-suspended{background:#3a0000;color:#f87171}
.banner{background:#2e2000;border:1px solid #F5C51855;color:#F5C518;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:14px}
.btn{display:inline-block;background:#F5C518;color:#000;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;border:none;cursor:pointer}
.btn-sm{padding:6px 12px;font-size:13px}
.copy-btn{background:#141414;border:1px solid #333;color:#aaa;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px;margin-left:8px}
code{background:#0f0f0f;padding:8px 12px;border-radius:6px;display:block;margin:8px 0;font-size:13px;color:#F5C518;word-break:break-all}
label{display:block;font-size:13px;color:#aaa;margin-bottom:6px;margin-top:14px;font-weight:500}
input,select,textarea{width:100%;background:#0a0a0a;border:1px solid #333;color:#fff;padding:12px 14px;border-radius:8px;font-size:15px;margin-bottom:4px}
input:focus,select:focus,textarea:focus{outline:none;border-color:#F5C518}
.err{background:#3a0000;border:1px solid #7a0000;color:#ff6b6b;padding:12px;border-radius:8px;font-size:14px;margin:10px 0;display:none}
.err.show{display:block}
.ok{background:#0a2e0a;border:1px solid #0a5a0a;color:#4ade80;padding:12px;border-radius:8px;font-size:14px;margin:10px 0;display:none}
.ok.show{display:block}
</style></head><body>
${driverNav(active)}
<div class="page">
${content}
</div></body></html>`);

async function handleDriverDashboard(request, env, driver) {
  // Fetch stats
  const trucks = await sbGet(env, 'trucks', `driver_id=eq.${driver.id}&select=id,status`) || [];
  const truckIds = trucks.map(t => t.id);
  const totalScans = truckIds.length ? (await sbGet(env, 'scans', `truck_id=in.(${truckIds.join(',')})&select=id`) || []).length : 0;
  const commissions = await sbGet(env, 'commissions', `driver_id=eq.${driver.id}&select=*`) || [];
  const pendingCents = commissions.filter(c=>c.status==='pending').reduce((s,c)=>s+c.driver_amount_cents,0);
  const paidCents = commissions.filter(c=>c.status==='paid').reduce((s,c)=>s+c.driver_amount_cents,0);
  const referrals = await sbGet(env, 'referrals', `referrer_driver_id=eq.${driver.id}&select=referred_driver_id`) || [];
  const recentCommissions = commissions.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10);

  const statusBadge = {active:'badge-active',pending:'badge-pending',suspended:'badge-suspended'}[driver.status]||'badge-pending';
  const fmt = (cents) => '$' + (cents/100).toFixed(2);

  return dashLayout('Dashboard', 'dashboard', `
<h1>Dashboard</h1>
<p class="sub">Welcome back, ${driver.name}</p>

${!driver.w9_submitted ? '<div class="banner">⚠️ <a href="/driver/w9" style="color:#F5C518">Submit your W9</a> to receive payouts. Required before your first payment.</div>' : ''}

<div class="cards">
  <div class="stat-card"><div class="stat-num">${totalScans}</div><div class="stat-lbl">Total Scans</div></div>
  <div class="stat-card"><div class="stat-num">${commissions.filter(c=>c.conversion_id).length}</div><div class="stat-lbl">Conversions</div></div>
  <div class="stat-card"><div class="stat-num">${fmt(pendingCents)}</div><div class="stat-lbl">Pending</div></div>
  <div class="stat-card"><div class="stat-num">${fmt(paidCents)}</div><div class="stat-lbl">Lifetime Paid</div></div>
</div>

<div class="section">
  <h2>Your Trucks <span class="badge ${statusBadge}" style="margin-left:8px">${driver.status.toUpperCase()}</span></h2>
  ${trucks.length ? `<table><tr><th>Truck</th><th>Status</th><th>QR Code</th></tr>
  ${trucks.map(t=>`<tr><td>T${t.id.replace('t','')}</td><td><span class="badge ${t.status==='active'?'badge-active':'badge-pending'}">${t.status}</span></td><td><a href="/driver/qr-codes" style="color:#F5C518;font-size:13px">Download →</a></td></tr>`).join('')}
  </table>` : '<p style="color:#666;font-size:14px">No trucks assigned yet. Contact support.</p>'}
</div>

<div class="section">
  <h2>Recent Commissions</h2>
  ${recentCommissions.length ? `<table>
  <tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr>
  ${recentCommissions.map(c=>`<tr>
    <td>${new Date(c.created_at).toLocaleDateString()}</td>
    <td>${c.type==='truck_conversion'?'Truck Sale':'Referral'}</td>
    <td>${fmt(c.driver_amount_cents)}</td>
    <td><span class="badge ${c.status==='paid'?'badge-active':c.status==='pending'?'badge-pending':'badge-suspended'}">${c.status}</span></td>
  </tr>`).join('')}
  </table>` : '<p style="color:#666;font-size:14px">No commissions yet. Keep those QR codes out there!</p>'}
</div>

<div class="section">
  <h2>Referrals</h2>
  <p style="color:#ccc;font-size:14px">Drivers referred: <strong style="color:#F5C518">${referrals.length}</strong></p>
  <p style="color:#999;margin-top:8px;font-size:13px">Share your referral link to earn 10% of their commissions forever.</p>
  <a href="/driver/referrals" class="btn btn-sm" style="margin-top:12px">View Referrals →</a>
</div>`);
}

async function handleDriverQrCodes(request, env, driver) {
  const trucks = await sbGet(env, 'trucks', `driver_id=eq.${driver.id}&select=id,status`) || [];
  const needsAck = !driver.accepted_qr_rules_at;

  const rulesHtml = `
<div id="rules-modal" style="display:${needsAck?'flex':'none'};position:fixed;inset:0;background:#000000dd;z-index:999;align-items:center;justify-content:center;padding:20px">
<div style="background:#141414;border:1px solid #333;border-radius:16px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;padding:28px">
<h2 style="margin-bottom:16px;color:#F5C518">QR Code Usage Rules</h2>
<p style="color:#0a2e0a;background:#0a2e0a;border:1px solid #165516;padding:10px;border-radius:6px;color:#4ade80;font-size:13px;margin-bottom:14px">Read before downloading your QR code.</p>
<p style="color:#4ade80;font-weight:700;margin:12px 0 6px">✅ ALLOWED:</p>
<ul style="color:#ccc;font-size:13px;padding-left:18px;line-height:2">
<li>Place QR code on your assigned vehicle(s) only</li>
<li>Use on vehicle magnets, wraps, or decals</li>
<li>Print at any size as long as it remains scannable</li>
<li>Share your personal <em>referral link</em> on social media to recruit drivers</li>
<li>Use referral link in texts/emails to recruit drivers</li>
<li>Display the QR-Perks.com domain name alongside the code</li>
</ul>
<p style="color:#f87171;font-weight:700;margin:16px 0 6px">❌ NOT ALLOWED:</p>
<ul style="color:#ccc;font-size:13px;padding-left:18px;line-height:2">
<li>Do not place QR codes on vehicles you don't own or aren't authorized to use</li>
<li>Do not share or post truck QR codes on social media or any digital channel</li>
<li>Do not modify, distort, or redesign the QR code image</li>
<li>Do not add text, claims, or promises alongside the QR code</li>
<li>Do not use the QR code in paid advertising</li>
<li>Do not represent yourself as a QR Perks employee</li>
<li>Do not make earnings claims to potential recruits</li>
<li>Do not scan your own QR code or instruct others to scan artificially</li>
<li>Do not operate QR codes on vehicles not actively on the road</li>
</ul>
<div style="background:#1a0a00;border:1px solid #F5C51855;padding:12px;border-radius:8px;margin:16px 0;color:#F5C518;font-size:13px">
⚠️ Violations may result in account suspension and forfeiture of pending earnings.
</div>
<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:14px;color:#ccc">
<input type="checkbox" id="rules-ack" style="width:auto;margin-top:2px">
I have read and agree to the QR Code Usage Rules
</label>
<button id="rules-btn" onclick="ackRules()" style="width:100%;background:#F5C518;color:#000;border:none;padding:14px;border-radius:8px;font-weight:800;font-size:15px;margin-top:16px;cursor:pointer" disabled>
Download My QR Code →
</button>
</div></div>`;

  return dashLayout('QR Codes', 'qr-codes', `
${rulesHtml}
<h1>QR Code Downloads</h1>
<p class="sub">Download and print your truck QR codes</p>

${trucks.length === 0 ? '<div class="section"><p style="color:#666">No trucks assigned. Contact support to get started.</p></div>' :
  trucks.map(t => {
    const n = t.id.replace('t','');
    const qrUrl = `https://qr-perks.com/${t.id}`;
    const svgData = generateQrSvg(qrUrl, n);
    return `<div class="section">
<h2>Truck T${n} <span class="badge ${t.status==='active'?'badge-active':'badge-pending'}">${t.status}</span></h2>
<div style="text-align:center;margin:16px 0">
${svgData}
</div>
<p style="text-align:center;color:#666;font-size:12px;margin-bottom:16px">URL: ${qrUrl}</p>
<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
<a href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}" download="QRPerks_Truck${n}_QRCode.svg" class="btn btn-sm">Download SVG →</a>
</div>
</div>`;
  }).join('')
}

<script>
document.getElementById('rules-ack') && document.getElementById('rules-ack').addEventListener('change', function() {
  document.getElementById('rules-btn').disabled = !this.checked;
});
async function ackRules() {
  await fetch('/driver/qr-codes', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
  document.getElementById('rules-modal').style.display = 'none';
}
</script>`);
}

// Minimal QR SVG generator (placeholder — real QR generated via qr-perks URL pattern)
function generateQrSvg(url, truckNum) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="160" height="160" style="border:2px solid #009CDE;border-radius:8px;background:#fff;padding:8px">
<text x="100" y="90" text-anchor="middle" font-family="monospace" font-size="12" fill="#000">QR CODE</text>
<text x="100" y="110" text-anchor="middle" font-family="monospace" font-size="14" fill="#009CDE" font-weight="bold">TRUCK T${truckNum}</text>
<text x="100" y="130" text-anchor="middle" font-family="monospace" font-size="9" fill="#666">qr-perks.com/t${truckNum}</text>
</svg>`;
}

async function handleDriverQrCodesPost(request, env, driver) {
  await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { accepted_qr_rules_at: new Date().toISOString() });
  return jsonResponse({ ok: true });
}

async function handleDriverW9Page(request, env, driver) {
  if (driver.w9_submitted) {
    return dashLayout('W9 Form', 'w9', `
<h1>W9 Tax Form</h1>
<p class="sub">Already on file</p>
<div class="section">
<p style="color:#4ade80;margin-bottom:12px">✅ Your W9 has been received and is on file.</p>
<p style="color:#ccc;font-size:14px">Need to make a correction? Email <a href="mailto:support@qr-perks.com" style="color:#F5C518">support@qr-perks.com</a> before your next payout.</p>
</div>`);
  }

  const stateOptions = US_STATES.map(s=>`<option value="${s}">${s}</option>`).join('');
  return dashLayout('W9 Form', 'w9', `
<h1>W9 Tax Form</h1>
<p class="sub">Required by IRS for earnings over $600/year. Your information is encrypted and never shared.</p>
<div class="section">
<p style="color:#aaa;font-size:13px;margin-bottom:16px">Why we collect this: Federal law requires us to issue 1099 forms for payments exceeding $600/year. We encrypt your Tax ID before storing it. <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" style="color:#F5C518">View IRS W9 PDF</a></p>
<div class="err" id="err"></div>
<form id="w9form">
<label>Legal Name (as on tax return)</label>
<input type="text" name="legal_name" required>
<label>Business Name (if different — optional)</label>
<input type="text" name="business_name">
<label>Tax ID Type</label>
<div style="display:flex;gap:16px;margin-bottom:16px">
<label style="margin:0;display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="tax_id_type" value="ssn" required style="width:auto"> Individual (SSN)</label>
<label style="margin:0;display:flex;align-items:center;gap:6px;cursor:pointer"><input type="radio" name="tax_id_type" value="ein" style="width:auto"> Business (EIN)</label>
</div>
<label>Tax ID Number (SSN or EIN)</label>
<input type="text" name="tax_id" required placeholder="XXX-XX-XXXX" maxlength="11" autocomplete="off">
<label>Address Line 1</label>
<input type="text" name="address_line1" required autocomplete="address-line1">
<label>Address Line 2 (optional)</label>
<input type="text" name="address_line2" autocomplete="address-line2">
<label>City</label>
<input type="text" name="city" required autocomplete="address-level2">
<label>State</label>
<select name="state" required><option value="">Select state</option>${stateOptions}</select>
<label>ZIP Code</label>
<input type="text" name="zip" required maxlength="10" autocomplete="postal-code">
<label>Signature (draw with finger or mouse)</label>
<canvas id="sig-canvas" style="width:100%;height:120px;background:#0f0f0f;border:1px solid #333;border-radius:8px;cursor:crosshair;display:block;touch-action:none"></canvas>
<button type="button" onclick="clearSig()" style="background:none;border:none;color:#666;font-size:12px;cursor:pointer;margin-top:4px">Clear signature</button>
<input type="hidden" name="signature_data" id="sig-data">
<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-top:12px;color:#ccc;font-size:14px">
<input type="checkbox" name="perjury_cert" required style="width:auto;margin-top:2px">
Under penalties of perjury, I certify the information above is accurate and complete.
</label>
<button class="btn" type="submit" style="margin-top:16px;width:100%">Submit W9 →</button>
</form>
</div>`,
`<script>
const canvas = document.getElementById('sig-canvas');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth * window.devicePixelRatio;
canvas.height = canvas.offsetHeight * window.devicePixelRatio;
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
ctx.strokeStyle = '#F5C518'; ctx.lineWidth = 2; ctx.lineCap = 'round';
let drawing = false, lastX = 0, lastY = 0;
function getPos(e) {
  const r = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  return [src.clientX - r.left, src.clientY - r.top];
}
canvas.addEventListener('mousedown', e => { drawing=true; [lastX,lastY]=getPos(e); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing=true; [lastX,lastY]=getPos(e); });
canvas.addEventListener('mousemove', e => { if(!drawing) return; const [x,y]=getPos(e); ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); [lastX,lastY]=[x,y]; });
canvas.addEventListener('touchmove', e => { e.preventDefault(); if(!drawing) return; const [x,y]=getPos(e); ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke(); [lastX,lastY]=[x,y]; });
['mouseup','mouseleave','touchend'].forEach(ev => canvas.addEventListener(ev, () => drawing=false));
function clearSig() { ctx.clearRect(0,0,canvas.width,canvas.height); }
document.getElementById('w9form').addEventListener('submit', async e => {
  e.preventDefault();
  document.getElementById('sig-data').value = canvas.toDataURL();
  const fd = new FormData(e.target);
  if (!document.getElementById('sig-data').value || document.getElementById('sig-data').value.length < 1000) {
    const el = document.getElementById('err'); el.textContent = 'Please provide your signature.'; el.classList.add('show'); return;
  }
  const r = await fetch('/driver/w9', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.fromEntries(fd)) });
  const d = await r.json();
  if (d.ok) window.location.reload();
  else { const el = document.getElementById('err'); el.textContent = d.error; el.classList.add('show'); }
});
</script>`);
}

async function handleDriverW9Post(request, env, driver) {
  try {
    if (driver.w9_submitted) return jsonResponse({ ok: false, error: 'W9 already submitted' }, 409);
    const body = await request.json();
    const { legal_name, business_name, tax_id_type, tax_id, address_line1, address_line2, city, state, zip, signature_data } = body;
    if (!legal_name || !tax_id_type || !tax_id || !address_line1 || !city || !state || !zip || !signature_data) {
      return jsonResponse({ ok: false, error: 'All required fields must be filled' }, 400);
    }
    if (!env.W9_ENCRYPTION_KEY) return jsonResponse({ ok: false, error: 'Encryption not configured. Contact support.' }, 500);
    const taxIdClean = tax_id.replace(/\D/g, '');
    if (taxIdClean.length < 9) return jsonResponse({ ok: false, error: 'Invalid Tax ID number' }, 400);
    const tax_id_last4 = taxIdClean.slice(-4);
    const tax_id_encrypted = await encryptTaxId(taxIdClean, env.W9_ENCRYPTION_KEY);
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ip_hash = await hashIp(ip);
    await sbPost(env, 'w9_submissions', {
      driver_id: driver.id, legal_name, business_name: business_name || null, tax_id_type, tax_id_encrypted,
      tax_id_last4, address_line1, address_line2: address_line2 || null, city, state, zip,
      signature_data, signed_at: new Date().toISOString(), ip_hash
    });
    await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { w9_submitted: true, w9_submitted_at: new Date().toISOString() });
    await sendEmail(env, { to: driver.email, subject: 'QR Perks — W9 received', html: emailW9Confirmation(driver), template_name: 'w9_confirmation' });
    return jsonResponse({ ok: true });
  } catch (err) { return jsonResponse({ ok: false, error: 'Server error. Try again.' }, 500); }
}

async function handleDriverReferrals(request, env, driver) {
  const referrals = await sbGet(env, 'referrals', `referrer_driver_id=eq.${driver.id}&select=referred_driver_id,status,created_at`) || [];
  const refLink = `https://qr-perks.com/join?ref=${driver.referral_code || ''}`;
  const shareText = `I'm earning passive income with QR Perks by placing QR codes on my truck. Join using my link and we both earn more: ${refLink}`;
  const refEarnings = await sbGet(env, 'commissions', `driver_id=eq.${driver.id}&type=eq.referral_override&select=driver_amount_cents,status`) || [];
  const totalRefEarnings = refEarnings.reduce((s,c) => s + c.driver_amount_cents, 0);

  return dashLayout('Referrals', 'referrals', `
<h1>Referral Dashboard</h1>
<p class="sub">Earn 10% of commissions from every driver you refer — forever.</p>
<div class="section">
<h2>Your Referral Link</h2>
<code id="ref-link">${refLink}</code>
<button class="btn btn-sm" onclick="navigator.clipboard.writeText('${refLink}');this.textContent='Copied!'">Copy Link</button>
<h2 style="margin-top:20px">Share Message</h2>
<textarea style="height:90px;resize:none;color:#aaa;font-size:13px" readonly>${shareText}</textarea>
<button class="btn btn-sm" onclick="navigator.clipboard.writeText(this.previousElementSibling.value);this.textContent='Copied!'">Copy Message</button>
</div>
<div class="section">
<h2>How It Works</h2>
<p style="color:#ccc;font-size:14px;line-height:1.8">You earn <strong style="color:#F5C518">10%</strong> of the commissions generated by every driver you refer, for as long as their account is active. There is no cap on how many drivers you can refer or how long you earn.</p>
</div>
<div class="section">
<h2>Referred Drivers (${referrals.length})</h2>
<p style="color:#ccc;font-size:14px">Referral earnings: <strong style="color:#F5C518">$${(totalRefEarnings/100).toFixed(2)}</strong></p>
${referrals.length ? `<table style="margin-top:12px"><tr><th>Joined</th><th>Status</th></tr>
${referrals.map(r=>`<tr><td>${new Date(r.created_at).toLocaleDateString()}</td><td><span class="badge badge-active">${r.status}</span></td></tr>`).join('')}
</table>` : '<p style="color:#666;font-size:13px;margin-top:10px">No referrals yet. Share your link to get started.</p>'}
</div>`);
}

async function handleDriverEarnings(request, env, driver) {
  const commissions = await sbGet(env, 'commissions', `driver_id=eq.${driver.id}&select=*&order=created_at.desc`) || [];
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentPeriod = commissions.filter(c => new Date(c.created_at) >= periodStart);
  const pendingTotal = commissions.filter(c=>c.status==='pending').reduce((s,c)=>s+c.driver_amount_cents,0);
  const paidTotal = commissions.filter(c=>c.status==='paid').reduce((s,c)=>s+c.driver_amount_cents,0);
  const fmt = (c) => '$' + (c/100).toFixed(2);

  return dashLayout('Earnings', 'earnings', `
<h1>Earnings</h1>
<p class="sub">Commission breakdown and payout status</p>
<div class="cards" style="grid-template-columns:repeat(3,1fr)">
<div class="stat-card"><div class="stat-num">${fmt(currentPeriod.reduce((s,c)=>s+c.driver_amount_cents,0))}</div><div class="stat-lbl">This Month</div></div>
<div class="stat-card"><div class="stat-num">${fmt(pendingTotal)}</div><div class="stat-lbl">Pending Payout</div></div>
<div class="stat-card"><div class="stat-num">${fmt(paidTotal)}</div><div class="stat-lbl">Lifetime Paid</div></div>
</div>
<div class="section">
<p style="color:#aaa;font-size:13px;margin-bottom:16px">📅 Payouts processed on the <strong>1st of each month</strong> for the prior month. Minimum payout: <strong>$25.00</strong>. W9 required before first payout. ${!driver.w9_submitted ? '<a href="/driver/w9" style="color:#F5C518">Submit your W9 →</a>' : '✅ W9 on file'}</p>
</div>
<div class="section">
<h2>Commission History</h2>
${commissions.length ? `<table>
<tr><th>Date</th><th>Type</th><th>Gross</th><th>Your %</th><th>Your Earnings</th><th>Status</th></tr>
${commissions.map(c=>`<tr>
<td>${new Date(c.created_at).toLocaleDateString()}</td>
<td>${c.type==='truck_conversion'?'Truck':'Referral'}</td>
<td>${fmt(c.gross_amount_cents)}</td>
<td>${c.rate_percent}%</td>
<td>${fmt(c.driver_amount_cents)}</td>
<td><span class="badge ${c.status==='paid'?'badge-active':c.status==='pending'?'badge-pending':'badge-suspended'}">${c.status}</span></td>
</tr>`).join('')}
</table>` : '<p style="color:#666;font-size:13px">No commissions yet.</p>'}
</div>`);
}

async function handleDriverSettings(request, env, driver) {
  return dashLayout('Settings', 'settings', `
<h1>Account Settings</h1>
<p class="sub">Update your profile and preferences</p>
<div class="section">
<h2>Profile</h2>
<div class="ok" id="ok"></div>
<div class="err" id="err"></div>
<form id="pform">
<label>Display Name</label>
<input type="text" name="name" value="${driver.name || ''}" required>
<label>Phone</label>
<input type="tel" name="phone" value="${driver.phone || ''}">
<label>Bio (optional)</label>
<textarea name="bio" style="height:70px">${driver.bio || ''}</textarea>
<button class="btn" type="submit">Save Changes →</button>
</form>
</div>
<div class="section">
<h2>Change Password</h2>
<form id="pwform">
<label>Current Password</label>
<input type="password" name="current_password" required>
<label>New Password (min 8 characters)</label>
<input type="password" name="new_password" required minlength="8">
<label>Confirm New Password</label>
<input type="password" name="confirm_password" required minlength="8">
<button class="btn" type="submit">Update Password →</button>
</form>
</div>
<div class="section">
<h2>Notifications</h2>
<form id="notifform">
<label style="display:flex;align-items:center;gap:10px;cursor:pointer;color:#ccc;font-weight:normal;margin-bottom:12px">
<input type="checkbox" name="notify_conversions" ${driver.notify_conversions?'checked':''} style="width:auto">
Email me when a conversion is recorded
</label>
<label style="display:flex;align-items:center;gap:10px;cursor:pointer;color:#ccc;font-weight:normal">
<input type="checkbox" name="notify_referrals" ${driver.notify_referrals?'checked':''} style="width:auto">
Email me when a referred driver earns
</label>
<button class="btn btn-sm" type="submit" style="margin-top:14px">Save Notifications →</button>
</form>
</div>
<div class="section" style="border-color:#3a0000">
<h2 style="color:#f87171">Account Info</h2>
<p style="color:#999;font-size:13px">Email: <strong style="color:#ccc">${driver.email}</strong> (cannot change — contact support)</p>
<p style="color:#999;font-size:13px;margin-top:8px">Referral Code: <strong style="color:#F5C518">${driver.referral_code || 'N/A'}</strong> (permanent)</p>
<p style="color:#999;font-size:13px;margin-top:8px">Member since: ${new Date(driver.created_at).toLocaleDateString()}</p>
</div>`,
`<script>
document.getElementById('pform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const r = await fetch('/driver/settings', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'profile', name:fd.get('name'), phone:fd.get('phone'), bio:fd.get('bio') }) });
  const d = await r.json();
  const el = document.getElementById(d.ok?'ok':'err');
  el.textContent = d.ok ? 'Saved!' : d.error; el.classList.add('show');
});
document.getElementById('pwform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (fd.get('new_password') !== fd.get('confirm_password')) { document.getElementById('err').textContent='Passwords do not match'; document.getElementById('err').classList.add('show'); return; }
  const r = await fetch('/driver/settings', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'password', current_password:fd.get('current_password'), new_password:fd.get('new_password') }) });
  const d = await r.json();
  const el = document.getElementById(d.ok?'ok':'err');
  el.textContent = d.ok ? 'Password updated!' : d.error; el.classList.add('show');
});
document.getElementById('notifform').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  await fetch('/driver/settings', { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'notifications', notify_conversions:fd.has('notify_conversions'), notify_referrals:fd.has('notify_referrals') }) });
  document.getElementById('ok').textContent='Saved!'; document.getElementById('ok').classList.add('show');
});
</script>`);
}

async function handleDriverSettingsPost(request, env, driver) {
  try {
    const body = await request.json();
    const { action } = body;
    if (action === 'profile') {
      const { name, phone, bio } = body;
      if (!name) return jsonResponse({ ok: false, error: 'Name is required' }, 400);
      await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { name, phone: phone || null, bio: bio || null, profile_updated_at: new Date().toISOString() });
      return jsonResponse({ ok: true });
    }
    if (action === 'password') {
      const { current_password, new_password } = body;
      if (!current_password || !new_password || new_password.length < 8) return jsonResponse({ ok: false, error: 'Invalid request' }, 400);
      const rows = await sbGet(env, 'drivers', `id=eq.${driver.id}&select=password_hash`);
      const ok = await verifyPassword(current_password, rows[0].password_hash);
      if (!ok) return jsonResponse({ ok: false, error: 'Current password is incorrect' }, 401);
      const hash = await hashPassword(new_password);
      await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { password_hash: hash });
      return jsonResponse({ ok: true });
    }
    if (action === 'notifications') {
      const { notify_conversions, notify_referrals } = body;
      await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { notify_conversions: !!notify_conversions, notify_referrals: !!notify_referrals });
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ ok: false, error: 'Unknown action' }, 400);
  } catch { return jsonResponse({ ok: false, error: 'Server error' }, 500); }
}

// ═══════════════════════════════════════════════════════════════
// COMMISSION CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════

async function calculateCommissions(env) {
  // Fetch all unpaid conversions that haven't been calculated
  const conversions = await sbGet(env, 'conversions',
    'commission_calculated=eq.false&select=*') || [];

  for (const conv of conversions) {
    if (!conv.gross_amount_cents || !conv.driver_id) continue;
    const driverAmt = Math.floor(conv.gross_amount_cents * 0.20); // 20% truck

    // Insert truck commission
    const commRow = await sbPost(env, 'commissions', {
      driver_id: conv.driver_id,
      conversion_id: conv.id,
      type: 'truck_conversion',
      gross_amount_cents: conv.gross_amount_cents,
      driver_amount_cents: driverAmt,
      status: 'pending'
    });
    const commId = commRow && commRow[0] && commRow[0].id;

    // Mark conversion as calculated
    await sbPatch(env, 'conversions', `id=eq.${conv.id}`, {
      commission_calculated: true,
      commission_id: commId || null
    });

    // Referral override — find if this driver was referred by someone
    const referrals = await sbGet(env, 'referrals',
      `referred_driver_id=eq.${conv.driver_id}&select=referrer_driver_id`) || [];
    if (referrals[0]) {
      const referrerId = referrals[0].referrer_driver_id;
      const referralAmt = Math.floor(conv.gross_amount_cents * 0.10); // 10% referral
      await sbPost(env, 'commissions', {
        driver_id: referrerId,
        conversion_id: conv.id,
        type: 'referral_override',
        gross_amount_cents: conv.gross_amount_cents,
        driver_amount_cents: referralAmt,
        status: 'pending'
      });
    }
  }
}

async function runMonthlyCommissions(env) {
  try {
    await calculateCommissions(env);
    console.log('Monthly commission run complete');
  } catch (err) {
    console.error('Monthly commission run error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════

const adminLayout = (title, content) => html(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — QR Perks Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh}
nav{background:#111;border-bottom:1px solid #222;padding:0 24px;display:flex;align-items:center;min-height:50px;gap:16px}
.nav-logo{font-weight:800;color:#F5C518;letter-spacing:2px;font-size:15px}
nav a{color:#aaa;text-decoration:none;font-size:13px;padding:4px 0}
nav a:hover{color:#fff}
.page{padding:28px 24px;max-width:1000px;margin:0 auto}
h1{font-size:22px;font-weight:700;margin-bottom:20px}
h2{font-size:16px;font-weight:700;margin-bottom:12px}
.section{background:#141414;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{color:#666;font-weight:600;text-align:left;padding:8px 0;border-bottom:1px solid #222}
td{padding:10px 0;border-bottom:1px solid #1a1a1a;color:#ccc}
.badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700}
.badge-active{background:#0a2e0a;color:#4ade80}
.badge-pending{background:#2e2000;color:#F5C518}
.badge-suspended{background:#3a0000;color:#f87171}
.badge-paid{background:#0a1e2e;color:#60a5fa}
.btn{display:inline-block;background:#F5C518;color:#000;padding:7px 14px;border-radius:6px;font-weight:700;font-size:12px;border:none;cursor:pointer;text-decoration:none}
.btn-red{background:#7a0000;color:#fff}
.btn-blue{background:#1e3a5f;color:#60a5fa;border:1px solid #2a4a7f}
.btn-ghost{background:transparent;border:1px solid #333;color:#aaa}
input,select,textarea{background:#0a0a0a;border:1px solid #333;color:#fff;padding:8px 12px;border-radius:6px;font-size:14px;margin-right:8px;margin-bottom:8px}
input:focus,select:focus{outline:none;border-color:#F5C518}
label{font-size:12px;color:#888;display:block;margin-bottom:4px;margin-top:10px}
.stat-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.stat{background:#141414;border:1px solid #222;border-radius:10px;padding:14px 20px;min-width:120px;text-align:center}
.stat-num{font-size:22px;font-weight:800;color:#F5C518}
.stat-lbl{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;margin-top:2px}
.ok{background:#0a2e0a;border:1px solid #0a5a0a;color:#4ade80;padding:10px;border-radius:6px;font-size:13px;margin:10px 0;display:none}
.ok.show{display:block}
.err{background:#3a0000;border:1px solid #7a0000;color:#ff6b6b;padding:10px;border-radius:6px;font-size:13px;margin:10px 0;display:none}
.err.show{display:block}
form{display:inline}
</style></head><body>
<nav>
  <span class="nav-logo">QRP ADMIN</span>
  <a href="/admin/dashboard">Overview</a>
  <a href="/admin/dashboard#drivers">Drivers</a>
  <a href="/admin/dashboard#w9">W9</a>
  <a href="/admin/dashboard#commissions">Commissions</a>
  <a href="/admin/dashboard#offers">Offers</a>
  <a href="/admin/dashboard#captures">Leads</a>
  <form action="/admin/logout" method="POST" style="margin-left:auto">
    <button type="submit" style="background:none;border:none;color:#555;cursor:pointer;font-size:12px">Logout</button>
  </form>
</nav>
<div class="page">
${content}
</div></body></html>`);

async function handleAdminLoginPage(request, env) {
  const url = new URL(request.url);
  if (request.method === 'POST') {
    const form = await request.formData();
    const pw = form.get('password');
    if (pw === env.ADMIN_PASSWORD) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/admin/dashboard',
          'Set-Cookie': `qrp_admin_session=${env.ADMIN_PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
        }
      });
    }
    return html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Admin Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#141414;border:1px solid #222;border-radius:16px;padding:36px 28px;width:100%;max-width:360px;text-align:center}
h1{font-size:20px;font-weight:800;color:#F5C518;margin-bottom:24px;letter-spacing:2px}
input{width:100%;background:#0a0a0a;border:1px solid #333;color:#fff;padding:13px 14px;border-radius:8px;font-size:15px;margin-bottom:14px}
.btn{width:100%;background:#F5C518;color:#000;border:none;padding:14px;border-radius:8px;font-size:16px;font-weight:800;cursor:pointer}
.err{color:#f87171;font-size:13px;margin-bottom:12px}</style></head>
<body><div class="card"><h1>QRP ADMIN</h1>
<p class="err">Invalid password</p>
<form method="POST" action="/admin/login">
<input type="password" name="password" placeholder="Admin password" autofocus>
<button class="btn">Enter →</button></form></div></body></html>`);
  }

  if (isAdminAuthed(request, env)) return Response.redirect('/admin/dashboard', 302);

  return html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Admin Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:#141414;border:1px solid #222;border-radius:16px;padding:36px 28px;width:100%;max-width:360px;text-align:center}
h1{font-size:20px;font-weight:800;color:#F5C518;margin-bottom:24px;letter-spacing:2px}
input{width:100%;background:#0a0a0a;border:1px solid #333;color:#fff;padding:13px 14px;border-radius:8px;font-size:15px;margin-bottom:14px}
.btn{width:100%;background:#F5C518;color:#000;border:none;padding:14px;border-radius:8px;font-size:16px;font-weight:800;cursor:pointer}</style></head>
<body><div class="card"><h1>QRP ADMIN</h1>
<form method="POST" action="/admin/login">
<input type="password" name="password" placeholder="Admin password" autofocus>
<button class="btn">Enter →</button></form></div></body></html>`);
}

async function handleAdminDashboard(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);

  const [drivers, conversions, commissions, affiliates, captures, w9s] = await Promise.all([
    sbGet(env, 'drivers', 'select=*&order=created_at.desc') || [],
    sbGet(env, 'conversions', 'select=*&order=created_at.desc&limit=50') || [],
    sbGet(env, 'commissions', 'select=*&order=created_at.desc') || [],
    sbGet(env, 'affiliates', 'select=*&order=display_order.asc') || [],
    sbGet(env, 'email_captures', 'select=*&order=created_at.desc&limit=100') || [],
    sbGet(env, 'w9_submissions', 'select=id,driver_id,created_at,reviewed,reviewed_at&order=created_at.desc') || [],
  ].map(p => p.catch ? p.catch(() => []) : Promise.resolve(p)));

  const pendingDrivers = (drivers || []).filter(d => d.status === 'pending');
  const activeDrivers = (drivers || []).filter(d => d.status === 'active');
  const totalPendingCents = (commissions || []).filter(c => c.status === 'pending').reduce((s,c) => s+c.driver_amount_cents, 0);
  const totalPaidCents = (commissions || []).filter(c => c.status === 'paid').reduce((s,c) => s+c.driver_amount_cents, 0);
  const fmt = (cents) => '$' + ((cents||0)/100).toFixed(2);

  const driversHTML = (drivers || []).map(d => `
<tr>
  <td>${d.name}</td>
  <td style="color:#888;font-size:12px">${d.email}</td>
  <td><span class="badge badge-${d.status}">${d.status}</span></td>
  <td>${d.w9_submitted ? '<span style="color:#4ade80">✓</span>' : '<span style="color:#666">—</span>'}</td>
  <td>${d.referral_code || '—'}</td>
  <td>
    ${d.status === 'pending' ? `
    <form action="/admin/approve-driver" method="POST" style="display:inline">
      <input type="hidden" name="driver_id" value="${d.id}">
      <button class="btn btn-sm" style="font-size:11px;padding:5px 10px">Approve</button>
    </form>
    <form action="/admin/deny-driver" method="POST" style="display:inline;margin-left:4px">
      <input type="hidden" name="driver_id" value="${d.id}">
      <button class="btn btn-red btn-sm" style="font-size:11px;padding:5px 10px">Deny</button>
    </form>` : ''}
    ${d.status === 'active' ? `
    <form action="/admin/deny-driver" method="POST" style="display:inline">
      <input type="hidden" name="driver_id" value="${d.id}">
      <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:5px 10px">Suspend</button>
    </form>` : ''}
  </td>
</tr>`).join('');

  const commPendingRows = (commissions || []).filter(c => c.status === 'pending').slice(0, 50).map(c => `
<tr>
  <td>${new Date(c.created_at).toLocaleDateString()}</td>
  <td>${c.driver_id ? c.driver_id.slice(0,8) : '—'}</td>
  <td>${c.type === 'truck_conversion' ? 'Truck' : 'Referral'}</td>
  <td>${fmt(c.driver_amount_cents)}</td>
  <td>
    <form action="/admin/commissions/mark-paid" method="POST" style="display:inline">
      <input type="hidden" name="commission_id" value="${c.id}">
      <button class="btn btn-blue" style="font-size:11px;padding:4px 10px">Mark Paid</button>
    </form>
  </td>
</tr>`).join('');

  const offersHTML = (affiliates || []).map(a => `
<tr>
  <td>${a.name}</td>
  <td>${a.offer_type || '—'}</td>
  <td>${a.display_order}</td>
  <td>${a.is_featured ? '<span style="color:#F5C518">★ Featured</span>' : '—'}</td>
  <td><span class="badge badge-${a.status}">${a.status}</span></td>
  <td>
    <form action="/admin/offers" method="POST" style="display:inline">
      <input type="hidden" name="affiliate_id" value="${a.id}">
      <input type="hidden" name="action" value="${a.status === 'active' ? 'deactivate' : 'activate'}">
      <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px">${a.status === 'active' ? 'Deactivate' : 'Activate'}</button>
    </form>
    <form action="/admin/offers" method="POST" style="display:inline;margin-left:4px">
      <input type="hidden" name="affiliate_id" value="${a.id}">
      <input type="hidden" name="action" value="${a.is_featured ? 'unfeature' : 'feature'}">
      <button class="btn ${a.is_featured ? 'btn-ghost' : ''}" style="font-size:11px;padding:4px 10px">${a.is_featured ? 'Unfeature' : 'Feature'}</button>
    </form>
  </td>
</tr>`).join('');

  const capturesHTML = (captures || []).slice(0, 50).map(c => `
<tr>
  <td style="font-size:12px">${new Date(c.created_at).toLocaleDateString()}</td>
  <td>${c.email || '—'}</td>
  <td>${c.phone || '—'}</td>
  <td>${c.source || '—'}</td>
  <td style="font-size:12px;color:#666">${c.offer_clicked || '—'}</td>
</tr>`).join('');

  const w9HTML = (w9s || []).map(w => `
<tr>
  <td style="font-size:12px">${new Date(w.created_at).toLocaleDateString()}</td>
  <td style="font-size:12px;color:#888">${w.driver_id ? w.driver_id.slice(0,8) : '—'}</td>
  <td>${w.reviewed ? '<span style="color:#4ade80">Reviewed</span>' : '<span style="color:#F5C518">Pending</span>'}</td>
  <td>
    ${!w.reviewed ? `<form action="/admin/w9/review" method="POST" style="display:inline">
      <input type="hidden" name="w9_id" value="${w.id}">
      <button class="btn btn-blue" style="font-size:11px;padding:4px 10px">Mark Reviewed</button>
    </form>` : '—'}
  </td>
</tr>`).join('');

  return adminLayout('Dashboard', `
<h1>QR Perks Admin</h1>

<div class="stat-row">
  <div class="stat"><div class="stat-num">${(drivers||[]).length}</div><div class="stat-lbl">Total Drivers</div></div>
  <div class="stat"><div class="stat-num">${pendingDrivers.length}</div><div class="stat-lbl">Pending</div></div>
  <div class="stat"><div class="stat-num">${activeDrivers.length}</div><div class="stat-lbl">Active</div></div>
  <div class="stat"><div class="stat-num">${fmt(totalPendingCents)}</div><div class="stat-lbl">Owed</div></div>
  <div class="stat"><div class="stat-num">${fmt(totalPaidCents)}</div><div class="stat-lbl">Paid Out</div></div>
  <div class="stat"><div class="stat-num">${(captures||[]).length}</div><div class="stat-lbl">Leads</div></div>
</div>

<div class="section" id="drivers">
<h2>Drivers</h2>
<table>
<tr><th>Name</th><th>Email</th><th>Status</th><th>W9</th><th>Ref Code</th><th>Actions</th></tr>
${driversHTML || '<tr><td colspan="6" style="color:#666;padding:12px 0">No drivers yet</td></tr>'}
</table>
</div>

<div class="section" id="w9">
<h2>W9 Submissions</h2>
<table>
<tr><th>Date</th><th>Driver ID</th><th>Status</th><th>Action</th></tr>
${w9HTML || '<tr><td colspan="4" style="color:#666;padding:12px 0">No W9 submissions yet</td></tr>'}
</table>
</div>

<div class="section" id="commissions">
<h2>Pending Commissions</h2>
<div style="margin-bottom:12px">
  <form action="/admin/commissions/calculate" method="POST" style="display:inline">
    <button class="btn" style="margin-right:8px">▶ Run Commission Calculation</button>
  </form>
</div>
<table>
<tr><th>Date</th><th>Driver</th><th>Type</th><th>Amount</th><th>Action</th></tr>
${commPendingRows || '<tr><td colspan="5" style="color:#666;padding:12px 0">No pending commissions</td></tr>'}
</table>
</div>

<div class="section" id="offers">
<h2>Affiliate Offers</h2>
<div style="margin-bottom:12px">
  <form action="/admin/offers" method="POST" style="display:inline;margin-right:8px">
    <input type="hidden" name="action" value="reorder">
    <label style="display:inline;margin-right:4px;font-size:12px">Affiliate ID:</label>
    <input type="text" name="affiliate_id" placeholder="affiliate-id" style="width:160px">
    <label style="display:inline;margin-right:4px;font-size:12px">New Order:</label>
    <input type="number" name="display_order" placeholder="1" style="width:60px">
    <button class="btn btn-ghost" style="font-size:12px">Reorder</button>
  </form>
</div>
<table>
<tr><th>Name</th><th>Type</th><th>Order</th><th>Featured</th><th>Status</th><th>Actions</th></tr>
${offersHTML || '<tr><td colspan="6" style="color:#666;padding:12px 0">No offers</td></tr>'}
</table>
</div>

<div class="section" id="captures">
<h2>Email / Lead Captures (last 50)</h2>
<table>
<tr><th>Date</th><th>Email</th><th>Phone</th><th>Source</th><th>Offer</th></tr>
${capturesHTML || '<tr><td colspan="5" style="color:#666;padding:12px 0">No leads yet</td></tr>'}
</table>
</div>

<div class="section" id="email-campaign">
<h2>Send Email Campaign</h2>
<form action="/admin/email-campaign" method="POST">
  <label>Subject</label>
  <input type="text" name="subject" style="width:100%;margin-bottom:10px" placeholder="Email subject">
  <label>Body (HTML)</label>
  <textarea name="body_html" rows="5" style="width:100%;margin-bottom:10px;font-size:13px" placeholder="<p>Your email HTML...</p>"></textarea>
  <label>Audience</label>
  <select name="audience" style="width:200px">
    <option value="all_active">All active drivers</option>
    <option value="email_captures">Lead captures</option>
  </select>
  <br><br>
  <button class="btn" type="submit">Send Campaign</button>
</form>
</div>
`);
}

async function handleAdminApproveDriver(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  const form = await request.formData();
  const driver_id = form.get('driver_id');
  if (!driver_id) return Response.redirect('/admin/dashboard', 302);

  const rows = await sbGet(env, 'drivers', `id=eq.${driver_id}&select=*`);
  const driver = rows && rows[0];
  if (driver) {
    await sbPatch(env, 'drivers', `id=eq.${driver_id}`, { status: 'active' });
    // Send welcome email
    await sendEmail(env, {
      to: driver.email,
      subject: 'Your QR Perks account is approved!',
      html: emailWelcome(driver),
      template_name: 'welcome'
    });
  }
  return Response.redirect('/admin/dashboard#drivers', 302);
}

async function handleAdminDenyDriver(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  const form = await request.formData();
  const driver_id = form.get('driver_id');
  if (!driver_id) return Response.redirect('/admin/dashboard', 302);
  await sbPatch(env, 'drivers', `id=eq.${driver_id}`, { status: 'suspended' });
  return Response.redirect('/admin/dashboard#drivers', 302);
}

async function handleAdminCalcCommissions(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  await calculateCommissions(env);
  return Response.redirect('/admin/dashboard#commissions', 302);
}

async function handleAdminMarkPaid(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  const form = await request.formData();
  const commission_id = form.get('commission_id');
  if (!commission_id) return Response.redirect('/admin/dashboard', 302);
  await sbPatch(env, 'commissions', `id=eq.${commission_id}`, {
    status: 'paid',
    paid_at: new Date().toISOString()
  });
  return Response.redirect('/admin/dashboard#commissions', 302);
}

async function handleAdminUpdateOffer(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  const form = await request.formData();
  const affiliate_id = form.get('affiliate_id');
  const action = form.get('action');
  if (!affiliate_id || !action) return Response.redirect('/admin/dashboard', 302);

  if (action === 'activate') await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { status: 'active' });
  else if (action === 'deactivate') await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { status: 'inactive' });
  else if (action === 'feature') {
    await sbPatch(env, 'affiliates', 'is_featured=eq.true', { is_featured: false }); // unfeature all
    await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { is_featured: true });
  } else if (action === 'unfeature') {
    await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { is_featured: false });
  } else if (action === 'reorder') {
    const display_order = parseInt(form.get('display_order'), 10);
    if (!isNaN(display_order)) await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { display_order });
  }
  return Response.redirect('/admin/dashboard#offers', 302);
}

async function handleAdminEmailCampaign(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  const form = await request.formData();
  const subject = form.get('subject');
  const body_html = form.get('body_html');
  const audience = form.get('audience') || 'all_active';
  if (!subject || !body_html) return Response.redirect('/admin/dashboard#email-campaign', 302);

  const emailHtml = emailBase(`<div class="card">
<h1>${subject}</h1>
${body_html}
</div>`);

  let recipients = [];
  if (audience === 'all_active') {
    const drivers = await sbGet(env, 'drivers', 'status=eq.active&select=email,name') || [];
    recipients = drivers.map(d => d.email).filter(Boolean);
  } else if (audience === 'email_captures') {
    const captures = await sbGet(env, 'email_captures', 'select=email') || [];
    recipients = [...new Set(captures.map(c => c.email).filter(Boolean))];
  }

  // Send in batches (fire and forget to avoid timeout)
  for (const email of recipients) {
    sendEmail(env, { to: email, subject, html: emailHtml, template_name: 'campaign' }).catch(() => {});
  }

  return Response.redirect('/admin/dashboard', 302);
}

// Admin W9 review (referenced in dashboard HTML above)
async function handleAdminW9Review(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect('/admin/login', 302);
  const form = await request.formData();
  const w9_id = form.get('w9_id');
  if (!w9_id) return Response.redirect('/admin/dashboard', 302);
  await sbPatch(env, 'w9_submissions', `id=eq.${w9_id}`, {
    reviewed: true,
    reviewed_at: new Date().toISOString()
  });
  return Response.redirect('/admin/dashboard#w9', 302);
}

function handleAdminLogout(request, env) {
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/admin/login', 'Set-Cookie': 'qrp_admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' }
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function html404() {
  return html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not Found</title>
<style>body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
h1{color:#F5C518;font-size:48px;margin-bottom:8px}p{color:#666}a{color:#F5C518}</style></head>
<body><div><h1>404</h1><p>Page not found.</p><p><a href="/">← Go home</a></p></div></body></html>`, 404);
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const parts = header.split(';');
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=');
    if (k.trim() === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

function staticPage(slug) {
  const pages = {
    privacy: { title: 'Privacy Policy', body: `<h1>Privacy Policy</h1>
<p>Last updated: January 1, 2026</p>
<p>QR Perks ("we", "us") operates qr-perks.com. This Privacy Policy describes how we collect, use, and share information.</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly (email, phone, name) and information collected automatically (IP address, browser type, pages visited).</p>
<h2>How We Use Information</h2>
<p>We use information to operate our platform, send you offers and alerts you've requested, pay driver commissions, and comply with legal obligations.</p>
<h2>Information Sharing</h2>
<p>We do not sell your personal information. We share information with our affiliate partners only as necessary to track conversions and pay commissions.</p>
<h2>Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal information by emailing support@qr-perks.com.</p>
<h2>Contact</h2>
<p>Email: support@qr-perks.com</p>` },
    terms: { title: 'Terms of Service', body: `<h1>Terms of Service</h1>
<p>Last updated: January 1, 2026</p>
<p>By using QR Perks, you agree to these terms. If you do not agree, do not use this service.</p>
<h2>Eligibility</h2>
<p>You must be 18 or older and a legal US resident to participate as a driver or enter sweepstakes.</p>
<h2>Driver Program</h2>
<p>Drivers may not scan their own QR codes, post truck QR codes online, or engage in any fraudulent activity. Violation results in immediate account termination and forfeiture of pending commissions.</p>
<h2>Sweepstakes</h2>
<p>No purchase necessary. Sweepstakes are operated by third parties. QR Perks is not responsible for prize fulfillment.</p>
<h2>Disclaimer</h2>
<p>Services are provided "as is." We are not liable for indirect, incidental, or consequential damages.</p>` },
    disclosure: { title: 'Affiliate Disclosure', body: `<h1>Affiliate Disclosure</h1>
<p>QR Perks participates in affiliate marketing programs. When you click an offer link and complete a qualifying action, we may earn a commission. This does not affect the cost to you.</p>
<p>All offers listed on QR Perks are from third-party providers. We do not control their content, availability, or terms. QR Perks does not guarantee any results from using these offers.</p>
<p>Truck drivers in our network earn commissions when visitors they refer complete qualifying actions. Full program terms are available at <a href="/contractor">Contractor Agreement</a>.</p>` },
    contractor: { title: 'Contractor Agreement', body: `<h1>Independent Contractor Agreement</h1>
<p>This agreement is between QR Perks ("Company") and the driver ("Contractor").</p>
<h2>Relationship</h2>
<p>Contractor is an independent contractor, not an employee. Contractor is responsible for all applicable taxes including self-employment tax. A W9 is required before any payment.</p>
<h2>Commission Structure</h2>
<p><strong>Truck conversions:</strong> 20% of net commissions generated by QR codes displayed on Contractor's assigned truck(s).<br>
<strong>Referral override:</strong> 10% of net commissions generated by drivers Contractor refers to the program.</p>
<h2>Payment Schedule</h2>
<p>Commissions are calculated on the 1st of each month and paid within 10 business days. Minimum payout threshold: $25.</p>
<h2>Rules</h2>
<p>Contractor may not: scan their own QR code; post truck QR codes on the internet; engage in any click fraud or incentivized traffic. Violation results in immediate termination and forfeiture of all unpaid commissions.</p>
<h2>Tax Obligations</h2>
<p>Contractor is responsible for all federal, state, and local taxes. Company will issue 1099-NEC for payments exceeding $600 per year.</p>` }
  };

  const p = pages[slug];
  if (!p) return html404();
  return html(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.title} — QR Perks</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#ccc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px 24px;max-width:720px;margin:0 auto;line-height:1.7}
h1{color:#fff;font-size:24px;margin-bottom:16px}
h2{color:#fff;font-size:16px;margin:24px 0 8px}
p{margin-bottom:12px;font-size:15px}
a{color:#F5C518}
.back{display:inline-block;color:#F5C518;text-decoration:none;margin-bottom:28px;font-size:13px}
</style></head><body>
<a href="/" class="back">← Back to QR Perks</a>
${p.body}
</body></html>`);
}
