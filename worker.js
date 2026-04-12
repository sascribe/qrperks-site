// QR-Perks Cloudflare Worker — v3 Full Rebuild 2026-04-12
// Env: SUPABASE_URL, SUPABASE_SECRET, ADMIN_PASSWORD,
//      RESEND_API_KEY, DRIVER_JWT_SECRET, W9_ENCRYPTION_KEY

const FALLBACK_AFFILIATES = [
  { id:'paypal-sweeps', name:'Win $1,000 PayPal Cash', url:'https://afflat3c1.com/trk/lnk/C8CC1E8D-9D2D-46AD-842E-9CEDD11DD805/?o=25393&c=918277&a=792250&k=4418E8A3B088D83CB0ED1E0B6C09CC86&l=26602&s1=qrp_paypal', offer_type:'financial', display_order:1, is_featured:true,
    icon:'💵', status:'active', prize_description:'Win $1,000 PayPal Cash', prize_description_es:'Gana $1,000 en Efectivo PayPal',
    cta_text:'Get PayPal Free', cta_text_es:'Obtener PayPal Gratis',
    description_en:'Free entry — no purchase required. Takes 30 seconds.', description_es:'Entrada gratis — sin compra. Solo 30 segundos.' },
  { id:'walmart-sweeps', name:'Win $1,000 Walmart Gift Card', url:'https://afflat3c1.com/trk/lnk/C8CC1E8D-9D2D-46AD-842E-9CEDD11DD805/?o=25394&c=918277&a=792250&k=BC203D6D8247B0DF7720B1CB839DB387&l=26603&s1=qrp_walmart', offer_type:'retail', display_order:2, is_featured:false,
    icon:'🛒', status:'active', prize_description:'Win $1,000 Walmart Gift Card', prize_description_es:'Gana $1,000 en Tarjeta Walmart',
    cta_text:'Shop Walmart Deals', cta_text_es:'Ofertas Walmart',
    description_en:'Free entry — no purchase required.', description_es:'Entrada gratis — sin compra.' },
  { id:'maybelline', name:'Free Maybelline Beauty Set', url:'https://afflat3c2.com/trk/lnk/C8CC1E8D-9D2D-46AD-842E-9CEDD11DD805/?o=24725&c=918277&a=792250&k=AFFE5632AE95E70324B4F71AD9308645&l=25813&s1=qrp_maybelline', offer_type:'beauty', display_order:3, is_featured:false,
    icon:'💄', status:'active', prize_description:'Free Maybelline Beauty Set', prize_description_es:'Set de Belleza Maybelline Gratis',
    cta_text:'Claim Beauty Deal', cta_text_es:'Obtener Oferta',
    description_en:'Claim your free makeup set. Limited quantities.', description_es:'Reclama tu set gratis. Cantidades limitadas.' },
  { id:'slam-dunk-loans', name:'Personal Loans Up to $50K', url:'https://afflat3c1.com/trk/lnk/C8CC1E8D-9D2D-46AD-842E-9CEDD11DD805/?o=11384&c=918277&a=792250&k=D911FDB90B20C8BB32EEBCE9ED5B6CAC&l=11476&s1=qrp_loans', offer_type:'loans', display_order:4, is_featured:false,
    icon:'🏀', status:'active', prize_description:'Personal Loans Up to $50K', prize_description_es:'Préstamos Hasta $50K',
    cta_text:'Get Loan Offer', cta_text_es:'Obtener Préstamo',
    description_en:'Quick approval, flexible terms. Apply in minutes.', description_es:'Aprobación rápida, términos flexibles.' },
  { id:'rok-financial', name:'Business Funding Up to $500K', url:'https://go.mypartner.io/business-financing/?ref=001Qk00000jaDEZIA2', offer_type:'financial', display_order:5, is_featured:false,
    icon:'💼', status:'active', prize_description:'Business Funding Up to $500K', prize_description_es:'Financiamiento Hasta $500K',
    cta_text:'Get Funded', cta_text_es:'Obtener Financiamiento',
    description_en:'Fast approvals. Get up to $500K for your business.', description_es:'Hasta $500K para tu negocio.' },
];

const T = {
  en: {
    hero_h1: 'Scan. Save. Score.',
    hero_sub: 'Exclusive deals delivered straight to your phone — just scan the QR code on the truck.',
    email_ph: 'Enter your email',
    cta_main: 'Get My Deal',
    featured_badge: 'FEATURED DEAL',
    free_badge: 'FREE ENTRY',
    apply_badge: 'FREE TO APPLY',
    more_deals: 'More Deals',
    cash_section: 'Need Funding?',
    how_title: 'How It Works',
    step1_title: 'Scan the QR Code', step1_desc: 'Find the QR code on any participating truck',
    step2_title: 'Choose Your Deal', step2_desc: 'Browse exclusive offers just for you',
    step3_title: 'Collect Your Reward', step3_desc: 'Follow the steps and claim your prize or loan',
    bridge_title: (n) => `You\'re headed to ${n}...`,
    bridge_sub: 'Get alerts when new deals drop:',
    email_capture_ph: 'Your email (optional)',
    phone_capture_ph: 'Phone for SMS alerts (optional)',
    alert_btn: 'Alert Me + Continue →',
    skip_btn: 'No thanks, take me there →',
    lang_toggle: 'ES',
    footer_copy: '© 2025 QR-Perks.com. All rights reserved.',
    privacy: 'Privacy Policy', terms: 'Terms of Service',
    earnings: 'Earnings Disclaimer', contact: 'Contact',
  },
  es: {
    hero_h1: 'Escanea. Ahorra. Gana.',
    hero_sub: 'Ofertas exclusivas directo a tu teléfono — solo escanea el código QR del camión.',
    email_ph: 'Ingresa tu correo',
    cta_main: 'Obtener Mi Oferta',
    featured_badge: 'OFERTA DESTACADA',
    free_badge: 'ENTRADA GRATIS',
    apply_badge: 'APLICAR GRATIS',
    more_deals: 'Más Ofertas',
    cash_section: '¿Necesitas Financiamiento?',
    how_title: 'Cómo Funciona',
    step1_title: 'Escanea el Código QR', step1_desc: 'Encuentra el código QR en cualquier camión participante',
    step2_title: 'Elige Tu Oferta', step2_desc: 'Explora ofertas exclusivas para ti',
    step3_title: 'Recibe Tu Recompensa', step3_desc: 'Sigue los pasos y reclama tu premio o préstamo',
    bridge_title: (n) => `Te dirigimos a ${n}...`,
    bridge_sub: 'Recibe alertas cuando lleguen nuevas ofertas:',
    email_capture_ph: 'Tu correo (opcional)',
    phone_capture_ph: 'Teléfono para SMS (opcional)',
    alert_btn: 'Notifícarme + Continuar →',
    skip_btn: 'No gracias, ir a la oferta →',
    lang_toggle: 'EN',
    footer_copy: '© 2025 QR-Perks.com. Todos los derechos reservados.',
    privacy: 'Política de Privacidad', terms: 'Términos de Servicio',
    earnings: 'Aviso de Ganancias', contact: 'Contacto',
  }
};

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

// ─── DESIGN SYSTEM SHARED CSS ───
const DS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0f;--surf:#13131a;--bdr:#1e1e2e;--acc:#00ff88;--pur:#7c3aed;--txt:#f0f0f0;--sub:#8888aa;--err:#ef4444;--warn:#f59e0b;--r-sm:8px;--r-md:12px;--r-lg:20px}
body{background:var(--bg);color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
a{color:var(--acc);text-decoration:none}
button{cursor:pointer;font-family:inherit}
.btn{display:inline-flex;align-items:center;justify-content:center;background:var(--acc);color:#000;font-weight:700;font-size:15px;padding:0 24px;min-height:48px;border-radius:var(--r-md);border:none;transition:filter .15s,transform .1s;white-space:nowrap}
.btn:hover{filter:brightness(1.1)}
.btn:active{transform:scale(.97)}
.btn-outline{background:transparent;color:var(--acc);border:2px solid var(--acc)}
.btn-outline:hover{background:var(--acc);color:#000}
.btn-ghost{background:transparent;color:var(--sub);border:1px solid var(--bdr)}
.btn-ghost:hover{border-color:var(--acc);color:var(--acc)}
.btn-danger{background:#3a0000;color:#ef4444;border:1px solid #7a0000}
.btn-sm{min-height:36px;padding:0 14px;font-size:13px}
.card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r-lg)}
.badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;letter-spacing:1px}
.badge-green{background:#00ff8820;color:#00ff88;border:1px solid #00ff8844}
.badge-yellow{background:#f59e0b20;color:#f59e0b;border:1px solid #f59e0b44}
.badge-red{background:#ef444420;color:#ef4444;border:1px solid #ef444444}
.badge-purple{background:#7c3aed20;color:#7c3aed;border:1px solid #7c3aed44}
input,select,textarea{width:100%;background:#1e1e2e;border:1.5px solid var(--bdr);color:var(--txt);padding:12px 16px;border-radius:var(--r-md);font-size:15px;font-family:inherit;outline:none;transition:border-color .15s;-webkit-appearance:none}
input:focus,select:focus,textarea:focus{border-color:var(--acc)}
input::placeholder{color:var(--sub)}
label{display:block;font-size:13px;color:var(--sub);margin-bottom:6px;font-weight:500}
.form-group{margin-bottom:16px}
.msg-ok{background:#00ff8812;border:1px solid #00ff8840;color:#00ff88;padding:12px 16px;border-radius:var(--r-md);font-size:14px;display:none}
.msg-ok.show{display:block}
.msg-err{background:#ef444412;border:1px solid #ef444440;color:#ef4444;padding:12px 16px;border-radius:var(--r-md);font-size:14px;display:none}
.msg-err.show{display:block}
.es{display:none}
[data-lang="es"] .es{display:unset}
[data-lang="es"] .en{display:none}
`;

// ─── MAIN EXPORT ───
export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (err) {
      console.error('Worker error:', err.stack || err.message || err);
      return new Response(`Internal Server Error: ${err.message}`, { status: 500, headers: {'Content-Type':'text/plain'} });
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runMonthlyCommissions(env));
  }
};

async function route(request, env, ctx) {
  const url    = new URL(request.url);
  const path   = url.pathname.replace(/\/$/, '') || '/';
  const method = request.method;

  // QR truck routes /t1-/t50
  if (/^\/t([1-9]|[1-4]\d|50)$/.test(path)) return handleTruck(request, env, ctx, path.slice(1));

  // Referral join
  if (path === '/join') return handleJoin(request, env);

  // Affiliate redirect
  if (path.startsWith('/go/') && method === 'GET') return handleGo(request, env, path);

  // Driver auth routes
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
  if (driverRoutes[dKey]) return await driverRoutes[dKey]();

  // Admin routes
  if ((path === '/admin' || path === '/admin/login') && method === 'GET')  return handleAdminLoginPage(request, env);
  if ((path === '/admin' || path === '/admin/login') && method === 'POST') return handleAdminLoginPost(request, env);
  if (path === '/admin/dashboard'             && method === 'GET')  return handleAdminDashboard(request, env);
  if (path === '/admin/approve-driver'        && method === 'POST') return handleAdminApproveDriver(request, env);
  if (path === '/admin/deny-driver'           && method === 'POST') return handleAdminDenyDriver(request, env);
  if (path === '/admin/commissions/calculate' && method === 'POST') return handleAdminCalcCommissions(request, env);
  if (path === '/admin/commissions/mark-paid' && method === 'POST') return handleAdminMarkPaid(request, env);
  if (path === '/admin/offers'                && method === 'POST') return handleAdminUpdateOffer(request, env);
  if (path === '/admin/w9/review'             && method === 'POST') return handleAdminW9Review(request, env);
  if (path === '/admin/logout'                && method === 'POST') return handleAdminLogout(request, env);

  // API routes
  if (path === '/api/affiliates')                                   return handleApiAffiliates(request, env);
  if (path === '/api/capture'    && method === 'POST')              return handleCapture(request, env);
  if (path === '/api/email-capture' && method === 'POST')           return handleCapture(request, env);
  if (path === '/api/contact'    && method === 'POST')              return handleContactPost(request, env);

  // Landing page
  if (path === '/') return handleHome(request, env, ctx);

  // Static / legal pages
  if (path === '/privacy')             return staticPage('privacy');
  if (path === '/terms')               return staticPage('terms');
  if (path === '/disclosure')          return staticPage('disclosure');
  if (path === '/earnings-disclaimer') return staticPage('earnings');
  if (path === '/contact')             return handleContactPage(request, env);
  if (path === '/contractor')          return staticPage('contractor');
  if (path === '/unsubscribe')         return staticPage('unsubscribe');

  return html404();
}

// ═══════════════════════════════════════════════════════════════
// CRYPTO HELPERS
// ═══════════════════════════════════════════════════════════════

async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations:100000 }, key, 256);
  const hashHex = bytesToHex(new Uint8Array(bits));
  return `pbkdf2:sha256:100000:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const parts = stored.split(':');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;
  const [,,iters,saltHex,storedHash] = parts;
  const salt = hexToBytes(saltHex);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', hash:'SHA-256', salt, iterations:parseInt(iters) }, key, 256);
  return bytesToHex(new Uint8Array(bits)) === storedHash;
}

async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const header = b64url(JSON.stringify({alg:'HS256',typ:'JWT'}));
  const body   = b64url(JSON.stringify(payload));
  const data   = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64url(new Uint8Array(sig))}`;
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
  if (payload.exp && Date.now()/1000 > payload.exp) return null;
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

async function encryptTaxId(plaintext, keyHex) {
  const key = await crypto.subtle.importKey('raw', hexToBytes(keyHex), {name:'AES-GCM'}, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt({name:'AES-GCM',iv}, key, enc.encode(plaintext));
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(ct))}`;
}

function hexToBytes(hex) { return new Uint8Array(hex.match(/.{2}/g).map(h=>parseInt(h,16))); }
function bytesToHex(bytes) { return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join(''); }
function genToken(bytes=32) { return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes))); }
function genReferralCode() {
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>chars[b%chars.length]).join('');
}
async function hashIp(ip) {
  const enc = new TextEncoder();
  const h = await crypto.subtle.digest('SHA-256', enc.encode(ip));
  return bytesToHex(new Uint8Array(h)).slice(0,16);
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════

function sbHdr(env) {
  return {
    'apikey': env.SUPABASE_SECRET,
    'Authorization': `Bearer ${env.SUPABASE_SECRET}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function sbGet(env, table, query='') {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: sbHdr(env) });
    if (!res.ok) { console.error('sbGet error', table, res.status, await res.text().catch(()=>'')); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch(e) { console.error('sbGet exception', table, e.message); return []; }
}

async function sbGetOne(env, table, query='') {
  const rows = await sbGet(env, table, query);
  return rows[0] || null;
}

async function sbPost(env, table, data) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
      method:'POST', headers: sbHdr(env), body: JSON.stringify(data)
    });
    if (!res.ok) { console.error('sbPost error', table, res.status, await res.text().catch(()=>'')); return null; }
    const text = await res.text();
    if (!text) return null;
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch(e) { console.error('sbPost exception', table, e.message); return null; }
}

async function sbPatch(env, table, filter, data) {
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method:'PATCH', headers: sbHdr(env), body: JSON.stringify(data)
    });
    return res.ok;
  } catch(e) { console.error('sbPatch exception', table, e.message); return false; }
}

// ═══════════════════════════════════════════════════════════════
// EMAIL — RESEND
// ═══════════════════════════════════════════════════════════════

async function sendEmail(env, { to, subject, html, template_name }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({ from:'QR Perks <noreply@qr-perks.com>', to:[to], subject, html })
    });
    const result = await res.json().catch(()=>({}));
    sbPost(env, 'email_logs', {
      recipient:to, template_name, status:res.ok?'sent':'failed',
      error_message:res.ok?null:JSON.stringify(result), resend_id:result.id||null
    }).catch(()=>{});
    return res.ok ? result : null;
  } catch(e) {
    sbPost(env, 'email_logs', { recipient:to, template_name, status:'error', error_message:String(e) }).catch(()=>{});
    return null;
  }
}

const emailBase = (content) => `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0f0f0}
.wrap{max-width:600px;margin:0 auto;padding:32px 24px}
.logo{text-align:center;font-size:22px;font-weight:800;letter-spacing:3px;color:#00ff88;margin-bottom:32px}
.card{background:#13131a;border:1px solid #1e1e2e;border-radius:16px;padding:28px 24px;margin-bottom:20px}
h1{margin:0 0 16px;font-size:22px;font-weight:700;color:#f0f0f0}
p{margin:0 0 14px;font-size:15px;line-height:1.7;color:#8888aa}
strong{color:#f0f0f0}
.btn{display:block;background:#00ff88;color:#000;text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;font-weight:800;font-size:16px;margin:20px 0}
.tag{display:inline-block;background:#00ff8820;color:#00ff88;border:1px solid #00ff8840;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:800;margin-bottom:16px;letter-spacing:1px}
code{background:#1e1e2e;padding:10px 14px;border-radius:8px;display:block;margin:8px 0;color:#00ff88;font-size:13px;word-break:break-all}
hr{border:none;border-top:1px solid #1e1e2e;margin:24px 0}
a{color:#00ff88}
.dim{color:#555;font-size:12px;text-align:center}
</style></head><body><div class="wrap">
<div class="logo">QR PERKS</div>
${content}
<hr>
<p class="dim">QR Perks · qr-perks.com<br>
<a href="https://qr-perks.com/unsubscribe" style="color:#444">Unsubscribe</a></p>
</div></body></html>`;

function emailWelcome(driver) {
  return emailBase(`<div class="card">
<div class="tag">WELCOME</div>
<h1>You're in, ${driver.name}! 🎉</h1>
<p>Your QR Perks driver account is now <strong>active</strong>. Here's how you earn:</p>
<p>💰 <strong>20%</strong> of commissions from every conversion your truck QR generates<br>
👥 <strong>10%</strong> of commissions from every driver you refer — forever</p>
<a href="https://qr-perks.com/driver/dashboard" class="btn">Go to Dashboard →</a>
<p><strong>Your referral link:</strong></p>
<code>https://qr-perks.com/join?ref=${driver.referral_code}</code>
<p style="font-size:13px;color:#555">⚠️ Place QR codes on your truck only. Do not post online. Do not scan your own code.</p>
</div>`);
}

function emailVerification(driver, token) {
  const link = `https://qr-perks.com/driver/verify-email?token=${token}`;
  return emailBase(`<div class="card">
<div class="tag">VERIFY EMAIL</div>
<h1>Confirm your email</h1>
<p>Hi ${driver.name}, thanks for signing up. Click below to verify your email — then an admin will review and activate your account.</p>
<a href="${link}" class="btn">Verify My Email →</a>
<p class="dim">Link expires in 24 hours.</p>
</div>`);
}

function emailPasswordReset(token) {
  const link = `https://qr-perks.com/driver/reset?token=${token}`;
  return emailBase(`<div class="card">
<div class="tag">PASSWORD RESET</div>
<h1>Reset your password</h1>
<p>Click below to set a new password. If you didn't request this, ignore this email.</p>
<a href="${link}" class="btn">Reset Password →</a>
<p class="dim">Link expires in 1 hour.</p>
</div>`);
}

function emailW9Confirmation(driver) {
  return emailBase(`<div class="card">
<div class="tag">W9 RECEIVED</div>
<h1>W9 On File — Thank You</h1>
<p>Hi ${driver.name}, we've received your W9. You'll receive payouts on the 1st of each month once earnings reach the $25 minimum.</p>
<a href="https://qr-perks.com/driver/earnings" class="btn">View Earnings →</a>
</div>`);
}

function emailReferralSignup(referrer, newName) {
  return emailBase(`<div class="card">
<div class="tag">NEW REFERRAL</div>
<h1>Someone joined your team!</h1>
<p>Hi ${referrer.name}, <strong>${newName}</strong> just signed up using your referral link. Once their account is active and generating conversions, you'll earn <strong>10%</strong> automatically.</p>
<a href="https://qr-perks.com/driver/referrals" class="btn">View Referrals →</a>
</div>`);
}

// ═══════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

function getCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const part of h.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k.trim() === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function requireDriver(request, env, handler) {
  const cookie = getCookie(request, 'qrp_sess');
  if (!cookie) return Response.redirect(new URL('/driver/login', request.url).toString(), 302);
  let payload;
  try { payload = await verifyJwt(cookie, env.DRIVER_JWT_SECRET); } catch { payload = null; }
  if (!payload) return Response.redirect(new URL('/driver/login', request.url).toString(), 302);
  const driver = await sbGetOne(env, 'drivers', `id=eq.${payload.driver_id}&select=*`);
  if (!driver) return Response.redirect(new URL('/driver/login', request.url).toString(), 302);
  if (driver.status !== 'active') return html(`<html><body style="background:#0a0a0f;color:#f0f0f0;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;text-align:center"><div><p style="color:#f59e0b;font-size:18px">Account pending approval.</p><p style="color:#555;margin-top:8px"><a href="/driver/login" style="color:#00ff88">Back to login</a></p></div></body></html>`, 403);
  const newToken = await signJwt({ driver_id:driver.id, referral_code:driver.referral_code, status:driver.status, exp:Math.floor(Date.now()/1000)+604800 }, env.DRIVER_JWT_SECRET);
  const resp = await handler(request, env, driver);
  const r = new Response(resp.body, resp);
  r.headers.set('Set-Cookie', sessCookie(newToken));
  return r;
}

function sessCookie(token, clear=false) {
  if (clear) return `qrp_sess=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  return `qrp_sess=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`;
}

function isAdminAuthed(request, env) {
  try {
    const c = getCookie(request, 'qrp_admin');
    return !!(c && env.ADMIN_PASSWORD && c === env.ADMIN_PASSWORD);
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
// TRUCK SCAN + GO + CAPTURE HANDLERS
// ═══════════════════════════════════════════════════════════════

async function handleTruck(request, env, ctx, truckId) {
  const ip      = request.headers.get('CF-Connecting-IP') || '';
  const country = request.headers.get('CF-IPCountry') || '';
  const ua      = request.headers.get('User-Agent') || '';
  ctx.waitUntil(sbPost(env, 'scans', { truck_id:truckId, ip, country, user_agent:ua }).catch(()=>{}));
  const resp = await handleTruckPage(request, env, ctx, truckId);
  const r = new Response(resp.body, resp);
  r.headers.set('Set-Cookie', `qrp_truck=${truckId}; Path=/; Max-Age=86400; SameSite=Lax`);
  return r;
}

async function handleJoin(request, env) {
  const ref = new URL(request.url).searchParams.get('ref') || '';
  return Response.redirect(new URL(`/driver/signup?ref=${encodeURIComponent(ref)}`, request.url).toString(), 302);
}

async function handleGo(request, env, path) {
  const affiliateId = path.replace('/go/','').split('?')[0];
  const url = new URL(request.url);
  const truckId = url.searchParams.get('t') || getCookie(request, 'qrp_truck') || 'web';
  let destUrl = null;
  try {
    const row = await sbGetOne(env, 'affiliates', `id=eq.${affiliateId}&select=url`);
    if (row) destUrl = row.url;
  } catch {}
  if (!destUrl) {
    const fb = FALLBACK_AFFILIATES.find(a=>a.id===affiliateId);
    destUrl = fb?.url || 'https://qr-perks.com';
  }
  try {
    const dest = new URL(destUrl);
    dest.searchParams.set('s2', `qrp_${truckId}`);
    dest.searchParams.set('utm_source','qrperks');
    dest.searchParams.set('utm_medium','qr');
    dest.searchParams.set('utm_campaign', truckId);
    return Response.redirect(dest.toString(), 302);
  } catch {
    return Response.redirect(destUrl, 302);
  }
}

async function handleCapture(request, env) {
  try {
    const body = await request.json();
    const { email, phone, source, offer_clicked } = body;
    if (!email && !phone) return jsonOk({ ok:false });
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ip_hash = await hashIp(ip);
    await sbPost(env, 'email_captures', { email:email||null, phone:phone||null, source:source||'web', offer_clicked:offer_clicked||null, ip_hash });
    return jsonOk({ ok:true });
  } catch { return jsonOk({ ok:false }); }
}

async function handleApiAffiliates(request, env) {
  const rows = await sbGet(env, 'affiliates', 'select=id,name,icon,status,offer_type,display_order,cta_text,cta_text_es,prize_description,prize_description_es,description_en,description_es,is_featured&order=display_order.asc&status=eq.active');
  return jsonOk(rows.length ? rows : FALLBACK_AFFILIATES.map(a=>({...a})));
}

// ═══════════════════════════════════════════════════════════════
// LANDING PAGE — NEW DESIGN
// ═══════════════════════════════════════════════════════════════

async function handleHome(request, env, ctx) {
  return handleTruckPage(request, env, ctx, null);
}

async function handleTruckPage(request, env, ctx, truckId) {
  let affiliates = FALLBACK_AFFILIATES;
  try {
    const rows = await sbGet(env, 'affiliates', 'select=*&status=eq.active&order=display_order.asc');
    if (rows && rows.length > 0) affiliates = rows;
  } catch {}

  const featured  = affiliates.find(a=>a.is_featured) || affiliates[0];
  const others    = affiliates.filter(a=>a.id !== featured.id && (a.offer_type==='sweepstakes'||a.offer_type==='retail'||a.offer_type==='beauty'||a.offer_type==='financial'));
  const loans     = affiliates.filter(a=>a.offer_type==='loans');
  const subId     = truckId ? `qrp_${truckId}` : 'qrp_web';

  const offerCard = (a, isSmall=false) => {
    const goPath = `/go/${a.id}?t=${truckId||'web'}`;
    if (!isSmall) return `
<div class="featured-card card" onclick="openBridge('${a.id}','${subId}','${(a.prize_description||a.name).replace(/'/g,"\\'")}','${(a.prize_description_es||a.name).replace(/'/g,"\\'")}')">
  <div class="feat-top">
    <span class="badge badge-green feat-badge"><span class="en">${a.cta_text&&a.offer_type==='loans'?'FREE TO APPLY':'FREE ENTRY'}</span><span class="es">${a.cta_text_es&&a.offer_type==='loans'?'APLICAR GRATIS':'ENTRADA GRATIS'}</span></span>
    <span class="feat-icon">${a.icon||'🎰'}</span>
  </div>
  <div class="feat-body">
    <div class="feat-name"><span class="en">${a.prize_description||a.name}</span><span class="es">${a.prize_description_es||a.name}</span></div>
    <div class="feat-desc"><span class="en">${a.description_en||''}</span><span class="es">${a.description_es||''}</span></div>
  </div>
  <button class="btn feat-cta" aria-label="Get deal">
    <span class="en">${a.cta_text||'Enter Free Now'} →</span>
    <span class="es">${a.cta_text_es||'Participar Gratis'} →</span>
  </button>
  <p class="feat-trust"><span class="en">Free to enter · No purchase required · 30 seconds</span><span class="es">Gratis · Sin compra · 30 segundos</span></p>
</div>`;
    return `
<div class="offer-card card" onclick="openBridge('${a.id}','${subId}','${(a.prize_description||a.name).replace(/'/g,"\\'")}','${(a.prize_description_es||a.name).replace(/'/g,"\\'")}')">
  <div class="oc-icon">${a.icon||'🎰'}</div>
  <div class="oc-body">
    <div class="oc-name"><span class="en">${a.prize_description||a.name}</span><span class="es">${a.prize_description_es||a.name}</span></div>
    <div class="oc-desc"><span class="en">${a.description_en||''}</span><span class="es">${a.description_es||''}</span></div>
  </div>
  <div class="oc-cta">
    <span class="badge badge-green" style="font-size:10px"><span class="en">FREE</span><span class="es">GRATIS</span></span>
    <div class="oc-arrow">→</div>
  </div>
</div>`;
  };

  return html(`<!DOCTYPE html>
<html lang="en" id="qrp-root" data-lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="description" content="Exclusive deals for QR Perks visitors — free sweepstakes and cash offers.">
<title>QR Perks — Scan. Save. Score.</title>
<style>
${DS}
/* Landing page specific */
.hdr{position:sticky;top:0;z-index:100;background:rgba(10,10,15,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:56px}
.logo{font-size:18px;font-weight:900;letter-spacing:3px;color:var(--acc)}
.lang-btn{background:transparent;border:1px solid var(--bdr);color:var(--sub);padding:6px 14px;border-radius:8px;font-size:13px;font-weight:700;transition:all .15s}
.lang-btn:hover{border-color:var(--acc);color:var(--acc)}
/* Hero */
.hero{padding:32px 20px 24px;text-align:center;max-width:600px;margin:0 auto}
.hero h1{font-size:clamp(28px,7vw,44px);font-weight:900;letter-spacing:-1px;line-height:1.1;margin-bottom:12px}
.hero h1 .acc{color:var(--acc)}
.hero-sub{color:var(--sub);font-size:16px;line-height:1.6;margin-bottom:28px;max-width:420px;margin-left:auto;margin-right:auto}
.hero-form{display:flex;gap:10px;max-width:400px;margin:0 auto;flex-direction:column}
@media(min-width:480px){.hero-form{flex-direction:row}}
.hero-form input{flex:1;min-width:0}
.hero-form .btn{flex-shrink:0;width:100%}
@media(min-width:480px){.hero-form .btn{width:auto}}
/* Featured card */
.featured-card{padding:24px;cursor:pointer;transition:border-color .2s,transform .1s;margin:20px;border-color:#00ff8840}
.featured-card:hover{border-color:var(--acc);transform:translateY(-2px)}
.featured-card:active{transform:scale(.98)}
.feat-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.feat-icon{font-size:40px}
.feat-name{font-size:22px;font-weight:800;margin-bottom:8px;line-height:1.2}
.feat-desc{color:var(--sub);font-size:14px;margin-bottom:20px;line-height:1.5}
.feat-cta{width:100%;font-size:17px;min-height:54px;border-radius:12px}
.feat-trust{text-align:center;color:var(--sub);font-size:12px;margin-top:12px}
/* Section header */
.sec-hdr{padding:8px 20px 12px;font-size:11px;font-weight:800;color:var(--sub);letter-spacing:2px;text-transform:uppercase}
/* Offer cards */
.offers-list{padding:0 20px;display:flex;flex-direction:column;gap:10px}
.offer-card{display:flex;align-items:center;gap:14px;padding:16px;cursor:pointer;transition:border-color .2s,transform .1s}
.offer-card:hover{border-color:var(--acc)}
.offer-card:active{transform:scale(.98)}
.oc-icon{font-size:28px;flex-shrink:0}
.oc-body{flex:1;min-width:0}
.oc-name{font-size:15px;font-weight:700;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oc-desc{font-size:13px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oc-cta{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.oc-arrow{color:var(--acc);font-size:18px;font-weight:700}
/* How it works */
.how{padding:40px 20px;max-width:600px;margin:0 auto}
.how h2{text-align:center;font-size:22px;font-weight:800;margin-bottom:28px}
.steps{display:flex;flex-direction:column;gap:16px}
@media(min-width:600px){.steps{flex-direction:row}}
.step{flex:1;text-align:center;padding:20px;background:var(--surf);border:1px solid var(--bdr);border-radius:16px}
.step-icon{font-size:32px;margin-bottom:12px}
.step-title{font-weight:700;font-size:15px;margin-bottom:6px}
.step-desc{color:var(--sub);font-size:13px;line-height:1.5}
/* Footer */
.foot{border-top:1px solid var(--bdr);padding:32px 20px;text-align:center;margin-top:40px}
.foot-links{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-bottom:16px}
.foot-links a{color:var(--sub);font-size:13px}
.foot-links a:hover{color:var(--acc)}
.foot-copy{color:#444;font-size:12px}
/* Bridge overlay */
#bridge{display:none;position:fixed;inset:0;background:rgba(10,10,15,.98);z-index:9999;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center}
#bridge.show{display:flex}
.br-title{font-size:20px;font-weight:800;margin-bottom:6px;max-width:340px}
.br-prog{width:100%;max-width:320px;height:3px;background:#1e1e2e;border-radius:2px;overflow:hidden;margin:20px 0}
.br-fill{height:100%;background:var(--acc);width:0;transition:width 5s linear}
.br-sub{color:var(--sub);font-size:14px;margin-bottom:24px;max-width:320px}
.br-form{width:100%;max-width:360px;display:flex;flex-direction:column;gap:10px}
.br-form input{background:#1e1e2e;border-color:#2e2e4e}
.br-btn{background:var(--acc);color:#000;border:none;padding:16px;border-radius:12px;font-size:16px;font-weight:800;width:100%}
.br-skip{background:none;border:none;color:var(--sub);font-size:13px;text-decoration:underline;margin-top:8px}
.br-close{position:absolute;top:20px;right:20px;background:none;border:none;color:var(--sub);font-size:24px;cursor:pointer;padding:8px}
.spacer{height:40px}
/* EN/ES toggle handled by DS [data-lang] rules */
</style>
</head>
<body>

<div id="bridge">
  <button class="br-close" onclick="closeBridge()">✕</button>
  <div class="br-title" id="br-title"></div>
  <div class="br-prog"><div class="br-fill" id="br-fill"></div></div>
  <div class="br-sub"><span class="en">Get alerts when new deals drop:</span><span class="es">Recibe alertas cuando lleguen nuevas ofertas:</span></div>
  <div class="br-form">
    <input type="email" id="br-email" autocomplete="email">
    <input type="tel" id="br-phone" autocomplete="tel">
    <button class="br-btn" id="br-alert"><span class="en">Alert Me + Continue →</span><span class="es">Notifícarme + Continuar →</span></button>
    <button class="br-skip" id="br-skip"><span class="en">No thanks, take me there →</span><span class="es">No gracias, ir a la oferta →</span></button>
  </div>
</div>

<header class="hdr">
  <div class="logo">QR PERKS</div>
  <div style="display:flex;align-items:center;gap:10px">
    <a href="/driver" class="btn-outline btn btn-sm" style="min-height:36px;padding:0 14px;font-size:13px;text-decoration:none"><span class="en">Driver Login</span><span class="es">Acceso Conductores</span></a>
    <button class="lang-btn" id="lang-btn">ES</button>
  </div>
</header>

<section class="hero">
  <h1><span class="en">Scan. <span class="acc">Save.</span> Score.</span><span class="es">Escanea. <span class="acc">Ahorra.</span> Gana.</span></h1>
  <p class="hero-sub"><span class="en">Exclusive deals delivered straight to your phone — just scan the QR code on the truck.</span><span class="es">Ofertas exclusivas directo a tu teléfono — solo escanea el código QR del camión.</span></p>
  <form class="hero-form" onsubmit="heroCapture(event)">
    <input type="email" id="hero-email" name="email" required placeholder="Enter your email">
    <button type="submit" class="btn"><span class="en">Get My Deal</span><span class="es">Obtener Mi Oferta</span></button>
  </form>
</section>

${offerCard(featured)}

${others.length > 0 ? `
<div class="sec-hdr"><span class="en">More Deals</span><span class="es">Más Ofertas</span></div>
<div class="offers-list">
${others.map(a=>offerCard(a, true)).join('')}
</div>` : ''}

${loans.length > 0 ? `
<div class="sec-hdr"><span class="en">Need Funding?</span><span class="es">¿Necesitas Financiamiento?</span></div>
<div class="offers-list">
${loans.map(a=>offerCard(a, true)).join('')}
</div>` : ''}

<div class="how">
  <h2><span class="en">How It Works</span><span class="es">Cómo Funciona</span></h2>
  <div class="steps">
    <div class="step"><div class="step-icon">📱</div>
      <div class="step-title"><span class="en">Scan the QR Code</span><span class="es">Escanea el Código QR</span></div>
      <div class="step-desc"><span class="en">Find the QR code on any participating truck</span><span class="es">Encuentra el código QR en cualquier camión participante</span></div>
    </div>
    <div class="step"><div class="step-icon">🎯</div>
      <div class="step-title"><span class="en">Choose Your Deal</span><span class="es">Elige Tu Oferta</span></div>
      <div class="step-desc"><span class="en">Browse exclusive offers curated just for you</span><span class="es">Explora ofertas exclusivas para ti</span></div>
    </div>
    <div class="step"><div class="step-icon">🏆</div>
      <div class="step-title"><span class="en">Collect Your Reward</span><span class="es">Recibe Tu Recompensa</span></div>
      <div class="step-desc"><span class="en">Follow the steps and claim your prize or loan</span><span class="es">Sigue los pasos y reclama tu premio o préstamo</span></div>
    </div>
  </div>
</div>

<footer class="foot">
  <div class="foot-links">
    <a href="/privacy"><span class="en">Privacy Policy</span><span class="es">Privacidad</span></a>
    <a href="/terms"><span class="en">Terms of Service</span><span class="es">Términos</span></a>
    <a href="/earnings-disclaimer"><span class="en">Earnings Disclaimer</span><span class="es">Aviso de Ganancias</span></a>
    <a href="/contact"><span class="en">Contact</span><span class="es">Contacto</span></a>
    <a href="/driver"><span class="en">Driver Portal</span><span class="es">Portal Conductores</span></a>
  </div>
  <p class="foot-copy"><span class="en">© 2025 QR-Perks.com. All rights reserved.</span><span class="es">© 2025 QR-Perks.com. Todos los derechos reservados.</span></p>
</footer>

<div class="spacer"></div>

<script>
const TRUCK_ID = ${JSON.stringify(truckId)};
let bridgeUrl = null, autoTimer = null;

function getLang(){const s=localStorage.getItem('qrp-lang');if(s)return s;return(navigator.language||'').startsWith('es')?'es':'en';}
function setLang(l){
  localStorage.setItem('qrp-lang',l);
  document.documentElement.setAttribute('data-lang',l);
  document.getElementById('lang-btn').textContent=l==='en'?'ES':'EN';
  const br=document.getElementById('br-email');
  const bp=document.getElementById('br-phone');
  if(br)br.placeholder=l==='en'?'Your email (optional)':'Tu correo (opcional)';
  if(bp)bp.placeholder=l==='en'?'Phone for SMS alerts (optional)':'Teléfono para SMS (opcional)';
  const hi=document.getElementById('hero-email');
  if(hi)hi.placeholder=l==='en'?'Enter your email':'Ingresa tu correo';
}
document.getElementById('lang-btn').addEventListener('click',()=>setLang(getLang()==='en'?'es':'en'));
setLang(getLang());

function openBridge(affiliateId, subId, nameEn, nameEs){
  const l=getLang();
  bridgeUrl='/go/'+affiliateId+'?t='+(TRUCK_ID||'web');
  const title=document.getElementById('br-title');
  title.textContent=l==='en'?'You\'re headed to '+nameEn+'...':'Te dirigimos a '+nameEs+'...';
  document.getElementById('bridge').classList.add('show');
  const fill=document.getElementById('br-fill');
  setTimeout(()=>fill.style.width='100%',50);
  clearTimeout(autoTimer);
  autoTimer=setTimeout(()=>doRedirect(),5000);
  document.getElementById('br-alert').onclick=async()=>{
    clearTimeout(autoTimer);
    const email=document.getElementById('br-email').value.trim();
    const phone=document.getElementById('br-phone').value.trim();
    if(email||phone){
      fetch('/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,phone,source:TRUCK_ID||'web',offer_clicked:affiliateId})}).catch(()=>{});
    }
    doRedirect();
  };
  document.getElementById('br-skip').onclick=()=>{clearTimeout(autoTimer);doRedirect();};
}
function closeBridge(){clearTimeout(autoTimer);document.getElementById('bridge').classList.remove('show');document.getElementById('br-fill').style.width='0';}
function doRedirect(){if(bridgeUrl)window.open(bridgeUrl,'_blank');closeBridge();}
function heroCapture(e){
  e.preventDefault();
  const email=document.getElementById('hero-email').value.trim();
  if(email){
    fetch('/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email,source:TRUCK_ID||'hero',offer_clicked:'signup'})}).catch(()=>{});
  }
  // Show first offer after capture
  if(affiliates && affiliates.length) openBridge(affiliates[0],'hero','${(featured.prize_description||featured.name).replace(/'/g,"\\'")}','${(featured.prize_description_es||featured.name).replace(/'/g,"\\'")}');
}
const affiliates=${JSON.stringify(affiliates.map(a=>({id:a.id,prize_description:a.prize_description,prize_description_es:a.prize_description_es,name:a.name})))};
</script>
</body></html>`);
}

// ═══════════════════════════════════════════════════════════════
// DRIVER AUTH PAGES — NEW DESIGN
// ═══════════════════════════════════════════════════════════════

const authShell = (title, content, script='') => html(`<!DOCTYPE html>
<html lang="en" data-lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — QR Perks</title>
<style>
${DS}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.auth-wrap{width:100%;max-width:420px}
.auth-logo{text-align:center;font-size:20px;font-weight:900;letter-spacing:3px;color:var(--acc);margin-bottom:32px}
.auth-card{background:var(--surf);border:1px solid var(--bdr);border-radius:20px;padding:32px 28px}
.auth-card h1{font-size:22px;font-weight:800;margin-bottom:4px}
.auth-sub{color:var(--sub);font-size:14px;margin-bottom:24px}
.auth-links{text-align:center;margin-top:20px;font-size:13px;color:var(--sub)}
.auth-links a{color:var(--acc);font-weight:600}
.btn-full{width:100%;margin-top:4px}
</style></head><body>
<div class="auth-wrap">
  <div class="auth-logo">QR PERKS</div>
  <div class="auth-card">
    ${content}
  </div>
</div>
${script}
<script>(function(){var s=localStorage.getItem('qrp-lang');var l=s?s:((navigator.language||'').startsWith('es')?'es':'en');document.documentElement.setAttribute('data-lang',l);})();</script>
</body></html>`);

// ─── LOGIN ───
async function handleDriverLoginPage(request, env) {
  const msg = new URL(request.url).searchParams.get('msg') || '';
  return authShell('Driver Login', `
<h1>Driver Login</h1>
<p class="auth-sub">Access your QR Perks dashboard</p>
${msg==='verified'?'<div class="msg-ok show">Email verified! Your account is pending admin approval.</div>':''}
${msg==='reset'?'<div class="msg-ok show">Password updated. You can now log in.</div>':''}
<div class="msg-err" id="err"></div>
<div class="form-group"><label>Email</label><input type="email" id="em" required autocomplete="email"></div>
<div class="form-group"><label>Password</label><input type="password" id="pw" required autocomplete="current-password"></div>
<button class="btn btn-full" id="lbtn" onclick="doLogin()">Log In →</button>
<div class="auth-links"><a href="/driver/forgot">Forgot password?</a> &nbsp;·&nbsp; <a href="/driver/signup">Sign up</a></div>`,
`<script>
async function doLogin(){
  const btn=document.getElementById('lbtn');
  btn.disabled=true;btn.textContent='Logging in...';
  const r=await fetch('/driver/login',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:document.getElementById('em').value,password:document.getElementById('pw').value})});
  const d=await r.json();
  if(d.ok){window.location.href='/driver/dashboard';}
  else{const e=document.getElementById('err');e.textContent=d.error||'Login failed';e.classList.add('show');btn.disabled=false;btn.textContent='Log In →';}
}
document.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
</script>`);
}

async function handleDriverLoginPost(request, env) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return jsonOk({ ok:false, error:'Email and password required' });
    const driver = await sbGetOne(env, 'drivers', `email=eq.${encodeURIComponent(email)}&select=*`);
    if (!driver || !driver.password_hash) return jsonOk({ ok:false, error:'Invalid email or password' });
    const ok = await verifyPassword(password, driver.password_hash);
    if (!ok) return jsonOk({ ok:false, error:'Invalid email or password' });
    if (!driver.email_verified) return jsonOk({ ok:false, error:'Please verify your email first. Check your inbox.' });
    if (driver.status==='pending') return jsonOk({ ok:false, error:'Your account is pending admin approval.' });
    if (driver.status==='suspended') return jsonOk({ ok:false, error:'Account suspended. Email support@qr-perks.com' });
    if (driver.status!=='active') return jsonOk({ ok:false, error:'Account inactive.' });
    const token = await signJwt({ driver_id:driver.id, referral_code:driver.referral_code, status:driver.status, exp:Math.floor(Date.now()/1000)+604800 }, env.DRIVER_JWT_SECRET);
    return new Response(JSON.stringify({ ok:true }), {
      headers:{ 'Content-Type':'application/json', 'Set-Cookie':sessCookie(token) }
    });
  } catch(e) { return jsonOk({ ok:false, error:'Server error' }); }
}

// ─── SIGNUP ───
async function handleDriverSignupPage(request, env) {
  const ref = new URL(request.url).searchParams.get('ref') || '';
  return authShell('Join QR Perks', `
<h1>Join QR Perks</h1>
<p class="auth-sub">Apply to become a driver and earn passive income</p>
<div class="msg-err" id="err"></div>
<div class="msg-ok" id="ok"></div>
<div id="sform">
  <div class="form-group"><label>Full Name</label><input type="text" id="nm" required autocomplete="name"></div>
  <div class="form-group"><label>Email</label><input type="email" id="em" required autocomplete="email"></div>
  <div class="form-group"><label>Phone (optional)</label><input type="tel" id="ph" autocomplete="tel"></div>
  <div class="form-group"><label>Password (min 8 characters)</label><input type="password" id="pw" required minlength="8" autocomplete="new-password"></div>
  <div class="form-group"><label>Confirm Password</label><input type="password" id="pw2" required minlength="8" autocomplete="new-password"></div>
  ${ref?`<div class="form-group"><label>Referred By</label><input type="text" id="ref" value="${ref}" readonly style="color:var(--acc);opacity:.8"></div>`:'<div class="form-group"><label>Referral Code (optional)</label><input type="text" id="ref"></div>'}
  <button class="btn btn-full" id="sbtn" onclick="doSignup()">Apply Now →</button>
</div>
<div class="auth-links">Already have an account? <a href="/driver/login">Log in</a></div>`,
`<script>
async function doSignup(){
  const e=document.getElementById('err'),o=document.getElementById('ok'),btn=document.getElementById('sbtn');
  e.classList.remove('show');
  if(document.getElementById('pw').value!==document.getElementById('pw2').value){e.textContent='Passwords do not match';e.classList.add('show');return;}
  btn.disabled=true;btn.textContent='Submitting...';
  const r=await fetch('/driver/signup',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:document.getElementById('nm').value,email:document.getElementById('em').value,
      phone:document.getElementById('ph').value,password:document.getElementById('pw').value,
      ref_code:document.getElementById('ref').value})});
  const d=await r.json();
  if(d.ok){document.getElementById('sform').style.display='none';o.textContent=d.message;o.classList.add('show');}
  else{e.textContent=d.error;e.classList.add('show');btn.disabled=false;btn.textContent='Apply Now →';}
}
</script>`);
}

async function handleDriverSignupPost(request, env) {
  try {
    const { name, email, phone, password, ref_code } = await request.json();
    if (!name||!email||!password) return jsonOk({ ok:false, error:'Name, email, and password are required' });
    if (password.length<8) return jsonOk({ ok:false, error:'Password must be at least 8 characters' });
    const existing = await sbGetOne(env, 'drivers', `email=eq.${encodeURIComponent(email)}&select=id`);
    if (existing) return jsonOk({ ok:false, error:'Email already registered. Try logging in.' });
    let referred_by=null, referrerDriver=null;
    if (ref_code) {
      const refRow = await sbGetOne(env, 'drivers', `referral_code=eq.${encodeURIComponent(ref_code)}&select=id,name,email`);
      if (refRow) { referred_by=refRow.id; referrerDriver=refRow; }
    }
    const password_hash = await hashPassword(password);
    let referral_code, attempts=0;
    do {
      referral_code = genReferralCode();
      const chk = await sbGetOne(env, 'drivers', `referral_code=eq.${referral_code}&select=id`);
      if (!chk) break;
    } while (++attempts<5);
    const newDriver = await sbPost(env, 'drivers', { name, email, phone:phone||null, password_hash, referral_code, referred_by:referred_by||null, status:'pending', email_verified:false });
    if (!newDriver) return jsonOk({ ok:false, error:'Failed to create account. Please try again.' });
    if (referred_by) await sbPost(env, 'referrals', { referrer_driver_id:referred_by, referred_driver_id:newDriver.id });
    const verifyToken = genToken(32);
    await sbPost(env, 'email_verifications', { driver_id:newDriver.id, token:verifyToken, expires_at:new Date(Date.now()+86400000).toISOString() });
    await sendEmail(env, { to:email, subject:'Verify your QR Perks email', html:emailVerification(newDriver, verifyToken), template_name:'email_verification' });
    if (referrerDriver) {
      await sendEmail(env, { to:referrerDriver.email, subject:'Someone joined using your referral link', html:emailReferralSignup(referrerDriver, name), template_name:'referral_signup' });
    }
    return jsonOk({ ok:true, message:'Check your email to verify your account. An admin will activate it after verification.' });
  } catch(e) { return jsonOk({ ok:false, error:'Server error. Try again.' }); }
}

async function handleDriverVerifyEmail(request, env) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return authShell('Verify Email', '<h1>Invalid Link</h1><p class="auth-sub">Missing verification token.</p>');
  const rec = await sbGetOne(env, 'email_verifications', `token=eq.${token}&select=*`);
  if (!rec) return authShell('Verify Email', '<h1>Invalid Link</h1><p class="auth-sub">This link is invalid or already used.</p>');
  if (rec.verified) return Response.redirect(new URL('/driver/login?msg=verified', request.url).toString(), 302);
  if (new Date(rec.expires_at)<new Date()) return authShell('Verify Email', '<h1>Link Expired</h1><p class="auth-sub"><a href="/driver/signup">Sign up again</a> or contact support.</p>');
  await sbPatch(env, 'email_verifications', `id=eq.${rec.id}`, { verified:true });
  await sbPatch(env, 'drivers', `id=eq.${rec.driver_id}`, { email_verified:true, email_verified_at:new Date().toISOString() });
  return Response.redirect(new URL('/driver/login?msg=verified', request.url).toString(), 302);
}

async function handleDriverForgotPage(request, env) {
  return authShell('Forgot Password', `
<h1>Forgot Password</h1>
<p class="auth-sub">Enter your email and we'll send a reset link</p>
<div class="msg-ok" id="ok"></div>
<div id="ff">
  <div class="form-group"><label>Email</label><input type="email" id="em" required autocomplete="email"></div>
  <button class="btn btn-full" id="fbtn" onclick="doForgot()">Send Reset Link →</button>
</div>
<div class="auth-links"><a href="/driver/login">Back to login</a></div>`,
`<script>
async function doForgot(){
  document.getElementById('fbtn').disabled=true;
  await fetch('/driver/forgot',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:document.getElementById('em').value})});
  document.getElementById('ff').style.display='none';
  document.getElementById('ok').textContent='If that email exists, a reset link has been sent.';
  document.getElementById('ok').classList.add('show');
}
</script>`);
}

async function handleDriverForgotPost(request, env) {
  try {
    const { email } = await request.json();
    if (!email) return jsonOk({ ok:true });
    const driver = await sbGetOne(env, 'drivers', `email=eq.${encodeURIComponent(email)}&select=id,name`);
    if (driver) {
      const token = genToken(32);
      await sbPost(env, 'password_resets', { driver_id:driver.id, token, expires_at:new Date(Date.now()+3600000).toISOString() });
      await sendEmail(env, { to:email, subject:'Reset your QR Perks password', html:emailPasswordReset(token), template_name:'password_reset' });
    }
    return jsonOk({ ok:true });
  } catch { return jsonOk({ ok:true }); }
}

async function handleDriverResetPage(request, env) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const rec = token ? await sbGetOne(env, 'password_resets', `token=eq.${token}&used=eq.false&select=*`) : null;
  if (!rec || new Date(rec.expires_at)<new Date()) {
    return authShell('Reset Password', '<h1>Link Expired</h1><p class="auth-sub"><a href="/driver/forgot">Request a new reset link</a>.</p>');
  }
  return authShell('Reset Password', `
<h1>Set New Password</h1>
<p class="auth-sub">Choose a strong password (min 8 characters)</p>
<div class="msg-err" id="err"></div>
<div class="form-group"><label>New Password</label><input type="password" id="pw" required minlength="8" autocomplete="new-password"></div>
<div class="form-group"><label>Confirm Password</label><input type="password" id="pw2" required minlength="8" autocomplete="new-password"></div>
<button class="btn btn-full" id="rbtn" onclick="doReset('${token}')">Update Password →</button>`,
`<script>
async function doReset(token){
  const e=document.getElementById('err'),btn=document.getElementById('rbtn');
  if(document.getElementById('pw').value!==document.getElementById('pw2').value){e.textContent='Passwords do not match';e.classList.add('show');return;}
  btn.disabled=true;btn.textContent='Updating...';
  const r=await fetch('/driver/reset',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token,password:document.getElementById('pw').value})});
  const d=await r.json();
  if(d.ok)window.location.href='/driver/login?msg=reset';
  else{e.textContent=d.error;e.classList.add('show');btn.disabled=false;btn.textContent='Update Password →';}
}
</script>`);
}

async function handleDriverResetPost(request, env) {
  try {
    const { token, password } = await request.json();
    if (!token||!password||password.length<8) return jsonOk({ ok:false, error:'Invalid request' });
    const rec = await sbGetOne(env, 'password_resets', `token=eq.${token}&used=eq.false&select=*`);
    if (!rec||new Date(rec.expires_at)<new Date()) return jsonOk({ ok:false, error:'Link expired. Request a new one.' });
    const hash = await hashPassword(password);
    await sbPatch(env, 'drivers', `id=eq.${rec.driver_id}`, { password_hash:hash });
    await sbPatch(env, 'password_resets', `id=eq.${rec.id}`, { used:true });
    return jsonOk({ ok:true });
  } catch { return jsonOk({ ok:false, error:'Server error' }); }
}

async function handleDriverLogout(request, env) {
  return new Response(null, { status:302, headers:{ 'Location':'/driver/login', 'Set-Cookie':sessCookie('',true) }});
}

// ═══════════════════════════════════════════════════════════════
// DRIVER DASHBOARD — NEW DESIGN
// ═══════════════════════════════════════════════════════════════

const dashShell = (title, active, content, script='') => html(`<!DOCTYPE html>
<html lang="en" data-lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — QR Perks</title>
<style>
${DS}
body{padding-bottom:80px}
/* Top nav */
.dnav{position:sticky;top:0;z-index:50;background:rgba(10,10,15,.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--bdr);display:flex;align-items:center;overflow-x:auto;padding:0 4px;min-height:52px;gap:2px}
.dnav-logo{font-weight:900;letter-spacing:2px;color:var(--acc);font-size:14px;padding:0 14px;flex-shrink:0}
.dnav a{color:var(--sub);text-decoration:none;padding:8px 12px;font-size:13px;font-weight:500;border-radius:8px;white-space:nowrap;flex-shrink:0;border-bottom:2px solid transparent;transition:color .15s}
.dnav a.active{color:var(--acc);border-bottom-color:var(--acc)}
.dnav a:hover:not(.active){color:var(--txt)}
.dnav-logout{margin-left:auto;flex-shrink:0;background:none;border:none;color:#555;cursor:pointer;font-size:12px;padding:8px 12px;font-family:inherit}
.dnav-logout:hover{color:var(--err)}
/* Page */
.dpage{padding:24px 20px;max-width:800px;margin:0 auto}
.dpage h1{font-size:22px;font-weight:800;margin-bottom:4px}
.dpage .sub{color:var(--sub);font-size:14px;margin-bottom:24px}
/* Stat cards */
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px}
@media(min-width:500px){.stats{grid-template-columns:repeat(4,1fr)}}
.stat{background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:16px;text-align:center}
.stat-n{font-size:22px;font-weight:800;color:var(--acc);margin-bottom:4px}
.stat-l{font-size:11px;color:var(--sub);text-transform:uppercase;letter-spacing:1px}
/* Section */
.dsec{background:var(--surf);border:1px solid var(--bdr);border-radius:16px;padding:20px;margin-bottom:16px}
.dsec h2{font-size:15px;font-weight:700;margin-bottom:14px}
/* Table */
table{width:100%;border-collapse:collapse;font-size:13px}
th{color:var(--sub);font-weight:600;text-align:left;padding:8px 0;border-bottom:1px solid var(--bdr);font-size:12px;text-transform:uppercase;letter-spacing:.5px}
td{padding:10px 0;border-bottom:1px solid #12121a;color:var(--sub)}
td:first-child,th:first-child{color:var(--txt)}
td:last-child,th:last-child{text-align:right}
.banner{background:#f59e0b12;border:1px solid #f59e0b40;color:#f59e0b;padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:14px}
.banner a{color:#f59e0b;font-weight:700}
code-block{background:#0f0f18;padding:12px 16px;border-radius:10px;display:block;font-size:13px;color:var(--acc);word-break:break-all;font-family:monospace;margin:8px 0}
.copy-btn{background:transparent;border:1px solid var(--bdr);color:var(--sub);padding:6px 12px;border-radius:6px;font-size:12px;transition:all .15s}
.copy-btn:hover{border-color:var(--acc);color:var(--acc)}
</style></head><body>
<nav class="dnav">
  <span class="dnav-logo">QRP</span>
  ${[['dashboard','Dashboard'],['qr-codes','QR Codes'],['earnings','Earnings'],['referrals','Referrals'],['w9','W9'],['settings','Settings']].map(([p,l])=>`<a href="/driver/${p}" class="${active===p?'active':''}">${l}</a>`).join('')}
  <form action="/driver/logout" method="POST" style="display:flex;margin-left:auto">
    <button type="submit" class="dnav-logout">Logout</button>
  </form>
</nav>
<div class="dpage">
${content}
</div>
${script}
</body></html>`);

function fmt$(cents) { return '$'+(cents/100).toFixed(2); }

// ─── DASHBOARD MAIN ───
async function handleDriverDashboard(request, env, driver) {
  const [trucks, scans, commissions, referrals] = await Promise.all([
    sbGet(env, 'trucks', `driver_id=eq.${driver.id}&select=id,status`),
    sbGet(env, 'scans', `truck_id=in.(${['t1','t2','t3','t4','t5','t6','t7','t8'].join(',')})&select=id&limit=1000`), // approximate
    sbGet(env, 'commissions', `driver_id=eq.${driver.id}&select=*&order=created_at.desc`),
    sbGet(env, 'referrals', `referrer_driver_id=eq.${driver.id}&select=id`),
  ]);
  const truckIds = trucks.map(t=>t.id);
  const driverScans = truckIds.length ? await sbGet(env, 'scans', `truck_id=in.(${truckIds.join(',')})&select=id`) : [];
  const pending = commissions.filter(c=>c.status==='pending').reduce((s,c)=>s+c.driver_amount_cents,0);
  const paid    = commissions.filter(c=>c.status==='paid').reduce((s,c)=>s+c.driver_amount_cents,0);
  const recent  = commissions.slice(0,8);

  return dashShell('Dashboard', 'dashboard', `
<h1>Dashboard</h1>
<p class="sub">Welcome back, ${driver.name}</p>
${!driver.w9_submitted?'<div class="banner">⚠️ <a href="/driver/w9">Submit your W9</a> to receive payouts. Required before your first payment.</div>':''}
<div class="stats">
  <div class="stat"><div class="stat-n">${driverScans.length}</div><div class="stat-l">Scans</div></div>
  <div class="stat"><div class="stat-n">${commissions.filter(c=>c.conversion_id).length}</div><div class="stat-l">Conversions</div></div>
  <div class="stat"><div class="stat-n">${fmt$(pending)}</div><div class="stat-l">Pending</div></div>
  <div class="stat"><div class="stat-n">${fmt$(paid)}</div><div class="stat-l">Paid</div></div>
</div>
<div class="dsec">
  <h2>Your Trucks</h2>
  ${trucks.length?`<table><tr><th>Truck</th><th>Status</th><th>QR Code</th></tr>
  ${trucks.map(t=>`<tr><td>T${t.id.replace('t','')}</td><td><span class="badge ${t.status==='active'?'badge-green':'badge-yellow'}">${t.status}</span></td><td><a href="/driver/qr-codes" style="color:var(--acc);font-size:13px">Download →</a></td></tr>`).join('')}
  </table>`:'<p style="color:var(--sub);font-size:14px">No trucks assigned yet. Contact support@qr-perks.com</p>'}
</div>
<div class="dsec">
  <h2>Referrals</h2>
  <p style="color:var(--sub);font-size:14px">${referrals.length} driver${referrals.length!==1?'s':''} referred</p>
  <a href="/driver/referrals" class="btn btn-sm btn-outline" style="margin-top:12px;display:inline-flex">View Referrals →</a>
</div>
${recent.length?`<div class="dsec">
  <h2>Recent Commissions</h2>
  <table><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr>
  ${recent.map(c=>`<tr>
    <td>${new Date(c.created_at).toLocaleDateString()}</td>
    <td>${c.type==='truck_conversion'?'Truck':'Referral'}</td>
    <td>${fmt$(c.driver_amount_cents)}</td>
    <td><span class="badge ${c.status==='paid'?'badge-green':c.status==='pending'?'badge-yellow':'badge-red'}">${c.status}</span></td>
  </tr>`).join('')}
  </table></div>`:''}`);
}

// ─── QR CODES ───
async function handleDriverQrCodes(request, env, driver) {
  const trucks = await sbGet(env, 'trucks', `driver_id=eq.${driver.id}&select=id,status`);
  const needsAck = !driver.accepted_qr_rules_at;
  return dashShell('QR Codes', 'qr-codes', `
${needsAck?`<div id="rules-modal" style="position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px">
<div style="background:var(--surf);border:1px solid var(--bdr);border-radius:20px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;padding:28px">
<h2 style="margin-bottom:16px;color:var(--acc);font-size:18px">QR Code Rules</h2>
<p style="color:#00ff8888;background:#00ff8808;border:1px solid #00ff8820;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:16px">Read before downloading your QR code.</p>
<p style="color:#00ff88;font-weight:700;margin:14px 0 6px;font-size:13px">✅ ALLOWED:</p>
<ul style="color:var(--sub);font-size:13px;padding-left:18px;line-height:2.2">
<li>Place on your assigned vehicle(s) only</li><li>Use on magnets, wraps, or decals</li>
<li>Print at any size (must remain scannable)</li><li>Share your personal referral link on social media</li>
</ul>
<p style="color:var(--err);font-weight:700;margin:14px 0 6px;font-size:13px">❌ NOT ALLOWED:</p>
<ul style="color:var(--sub);font-size:13px;padding-left:18px;line-height:2.2">
<li>Do not share truck QR codes online or on social media</li><li>Do not scan your own QR code</li>
<li>Do not modify or distort the QR code image</li><li>Do not make earnings claims to potential recruits</li>
<li>Do not use in paid advertising</li>
</ul>
<div style="background:#f59e0b10;border:1px solid #f59e0b30;padding:12px;border-radius:10px;margin:16px 0;color:#f59e0b;font-size:13px">
⚠️ Violations may result in suspension and forfeiture of pending earnings.
</div>
<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:14px;color:var(--sub);margin-bottom:16px">
<input type="checkbox" id="rck" style="width:auto;margin-top:2px;accent-color:var(--acc)">
I have read and agree to these rules
</label>
<button id="rck-btn" onclick="ackRules()" class="btn" style="width:100%" disabled>Acknowledge & Download →</button>
</div></div>`:'' }
<h1>QR Codes</h1>
<p class="sub">Download and print your truck QR codes</p>
${trucks.length===0?'<div class="dsec"><p style="color:var(--sub)">No trucks assigned. Contact support to get started.</p></div>':
  trucks.map(t=>{
    const n=t.id.replace('t','');
    const qrUrl=`https://qr-perks.com/${t.id}`;
    const svg=qrPlaceholder(n);
    return `<div class="dsec">
<h2>Truck T${n} <span class="badge ${t.status==='active'?'badge-green':'badge-yellow'}" style="margin-left:8px">${t.status}</span></h2>
<div style="text-align:center;margin:20px 0">${svg}</div>
<p style="text-align:center;color:var(--sub);font-size:12px;margin-bottom:16px">${qrUrl}</p>
<div style="display:flex;gap:10px;justify-content:center">
<a href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" download="QRPerks_T${n}.svg" class="btn btn-sm">Download SVG →</a>
</div></div>`;
  }).join('')}`,
`<script>
${needsAck?`document.getElementById('rck').addEventListener('change',function(){document.getElementById('rck-btn').disabled=!this.checked;});
async function ackRules(){
  await fetch('/driver/qr-codes',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
  document.getElementById('rules-modal').style.display='none';
}`:''}
</script>`);
}

function qrPlaceholder(truckNum) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="180" height="180" style="border:2px solid #00ff8840;border-radius:12px;background:#0f0f18;padding:12px">
<rect x="20" y="20" width="60" height="60" fill="none" stroke="#00ff88" stroke-width="4"/>
<rect x="30" y="30" width="40" height="40" fill="#00ff88" opacity=".3"/>
<rect x="120" y="20" width="60" height="60" fill="none" stroke="#00ff88" stroke-width="4"/>
<rect x="130" y="30" width="40" height="40" fill="#00ff88" opacity=".3"/>
<rect x="20" y="120" width="60" height="60" fill="none" stroke="#00ff88" stroke-width="4"/>
<rect x="30" y="130" width="40" height="40" fill="#00ff88" opacity=".3"/>
<text x="100" y="107" text-anchor="middle" font-family="monospace" font-size="11" fill="#00ff88" font-weight="bold">T${truckNum}</text>
<text x="100" y="118" text-anchor="middle" font-family="monospace" font-size="7" fill="#555">qr-perks.com/t${truckNum}</text>
</svg>`;
}

async function handleDriverQrCodesPost(request, env, driver) {
  await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { accepted_qr_rules_at:new Date().toISOString() });
  return jsonOk({ ok:true });
}

// ─── W9 ───
async function handleDriverW9Page(request, env, driver) {
  if (driver.w9_submitted) return dashShell('W9', 'w9', `
<h1>W9 Tax Form</h1><p class="sub">Already on file</p>
<div class="dsec">
<p style="color:var(--acc);margin-bottom:12px">✅ Your W9 has been received and is on file.</p>
<p style="color:var(--sub);font-size:14px">Need to make a correction? Email <a href="mailto:support@qr-perks.com">support@qr-perks.com</a> before your next payout.</p>
</div>`);

  const states = US_STATES.map(s=>`<option value="${s}">${s}</option>`).join('');
  return dashShell('W9 Form', 'w9', `
<h1>W9 Tax Form</h1>
<p class="sub">Required for IRS reporting. Your Tax ID is encrypted and never shared.</p>
<div class="dsec">
<div class="msg-err" id="err"></div>
<div class="form-group"><label>Legal Name (as on tax return)</label><input type="text" id="ln" required></div>
<div class="form-group"><label>Business Name (optional)</label><input type="text" id="bn"></div>
<div class="form-group"><label>Tax ID Type</label>
<div style="display:flex;gap:20px;margin-top:8px">
<label style="display:flex;align-items:center;gap:8px;color:var(--txt);font-weight:normal;cursor:pointer;margin:0"><input type="radio" name="tit" value="ssn" style="width:auto;accent-color:var(--acc)"> Individual (SSN)</label>
<label style="display:flex;align-items:center;gap:8px;color:var(--txt);font-weight:normal;cursor:pointer;margin:0"><input type="radio" name="tit" value="ein" style="width:auto;accent-color:var(--acc)"> Business (EIN)</label>
</div></div>
<div class="form-group"><label>Tax ID Number (SSN or EIN)</label><input type="text" id="tid" required placeholder="XXX-XX-XXXX" maxlength="11" autocomplete="off"></div>
<div class="form-group"><label>Address</label><input type="text" id="a1" required autocomplete="address-line1" placeholder="Street address"></div>
<div class="form-group"><label>Address Line 2 (optional)</label><input type="text" id="a2" autocomplete="address-line2" placeholder="Apt, suite, etc."></div>
<div style="display:grid;grid-template-columns:1fr 80px 100px;gap:12px">
<div class="form-group"><label>City</label><input type="text" id="city" required autocomplete="address-level2"></div>
<div class="form-group"><label>State</label><select id="st" required><option value="">—</option>${states}</select></div>
<div class="form-group"><label>ZIP</label><input type="text" id="zip" required maxlength="10" autocomplete="postal-code"></div>
</div>
<div class="form-group"><label>Signature</label>
<canvas id="sig" style="width:100%;height:110px;background:#0f0f18;border:1.5px solid var(--bdr);border-radius:12px;cursor:crosshair;display:block;touch-action:none"></canvas>
<button type="button" onclick="clearSig()" style="background:none;border:none;color:var(--sub);font-size:12px;cursor:pointer;margin-top:6px">Clear</button>
</div>
<div class="form-group"><label style="display:flex;align-items:flex-start;gap:10px;color:var(--sub);font-weight:normal;cursor:pointer">
<input type="checkbox" id="cert" style="width:auto;margin-top:2px;accent-color:var(--acc)">
Under penalties of perjury, I certify the information is accurate and complete.
</label></div>
<button class="btn btn-full" onclick="submitW9()">Submit W9 →</button>
</div>`,
`<script>
const c=document.getElementById('sig'),ctx=c.getContext('2d');
c.width=c.offsetWidth*devicePixelRatio;c.height=c.offsetHeight*devicePixelRatio;
ctx.scale(devicePixelRatio,devicePixelRatio);ctx.strokeStyle='#00ff88';ctx.lineWidth=2;ctx.lineCap='round';
let draw=false,lx=0,ly=0;
function pos(e){const r=c.getBoundingClientRect(),s=e.touches?e.touches[0]:e;return[s.clientX-r.left,s.clientY-r.top];}
c.addEventListener('mousedown',e=>{draw=true;[lx,ly]=pos(e);});
c.addEventListener('touchstart',e=>{e.preventDefault();draw=true;[lx,ly]=pos(e);});
c.addEventListener('mousemove',e=>{if(!draw)return;const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();[lx,ly]=[x,y];});
c.addEventListener('touchmove',e=>{e.preventDefault();if(!draw)return;const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();[lx,ly]=[x,y];});
['mouseup','mouseleave','touchend'].forEach(ev=>c.addEventListener(ev,()=>draw=false));
function clearSig(){ctx.clearRect(0,0,c.width,c.height);}
async function submitW9(){
  const err=document.getElementById('err');
  err.classList.remove('show');
  const tit=document.querySelector('input[name="tit"]:checked');
  if(!tit){err.textContent='Select Tax ID type';err.classList.add('show');return;}
  if(!document.getElementById('cert').checked){err.textContent='Please certify the information';err.classList.add('show');return;}
  const sig_data=c.toDataURL();
  if(sig_data.length<1000){err.textContent='Please provide your signature';err.classList.add('show');return;}
  const r=await fetch('/driver/w9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    legal_name:document.getElementById('ln').value,business_name:document.getElementById('bn').value,
    tax_id_type:tit.value,tax_id:document.getElementById('tid').value,
    address_line1:document.getElementById('a1').value,address_line2:document.getElementById('a2').value,
    city:document.getElementById('city').value,state:document.getElementById('st').value,
    zip:document.getElementById('zip').value,signature_data:sig_data
  })});
  const d=await r.json();
  if(d.ok)window.location.reload();
  else{err.textContent=d.error;err.classList.add('show');}
}
</script>`);
}

async function handleDriverW9Post(request, env, driver) {
  try {
    if (driver.w9_submitted) return jsonOk({ ok:false, error:'W9 already submitted' });
    const body = await request.json();
    const { legal_name, business_name, tax_id_type, tax_id, address_line1, address_line2, city, state, zip, signature_data } = body;
    if (!legal_name||!tax_id_type||!tax_id||!address_line1||!city||!state||!zip||!signature_data) return jsonOk({ ok:false, error:'All required fields must be filled' });
    if (!env.W9_ENCRYPTION_KEY) return jsonOk({ ok:false, error:'Encryption not configured. Contact support.' });
    const taxIdClean = tax_id.replace(/\D/g,'');
    if (taxIdClean.length<9) return jsonOk({ ok:false, error:'Invalid Tax ID number' });
    const tax_id_last4 = taxIdClean.slice(-4);
    const tax_id_encrypted = await encryptTaxId(taxIdClean, env.W9_ENCRYPTION_KEY);
    const ip_hash = await hashIp(request.headers.get('CF-Connecting-IP')||'');
    await sbPost(env, 'w9_submissions', { driver_id:driver.id, legal_name, business_name:business_name||null, tax_id_type, tax_id_encrypted, tax_id_last4, address_line1, address_line2:address_line2||null, city, state, zip, signature_data, signed_at:new Date().toISOString(), ip_hash });
    await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { w9_submitted:true, w9_submitted_at:new Date().toISOString() });
    await sendEmail(env, { to:driver.email, subject:'QR Perks — W9 received', html:emailW9Confirmation(driver), template_name:'w9_confirmation' });
    return jsonOk({ ok:true });
  } catch(e) { return jsonOk({ ok:false, error:'Server error. Try again.' }); }
}

// ─── REFERRALS ───
async function handleDriverReferrals(request, env, driver) {
  const [referrals, refEarnings] = await Promise.all([
    sbGet(env, 'referrals', `referrer_driver_id=eq.${driver.id}&select=*&order=created_at.desc`),
    sbGet(env, 'commissions', `driver_id=eq.${driver.id}&type=eq.referral_override&select=driver_amount_cents,status`),
  ]);
  const refLink = `https://qr-perks.com/join?ref=${driver.referral_code||''}`;
  const totalRef = refEarnings.reduce((s,c)=>s+c.driver_amount_cents,0);
  return dashShell('Referrals', 'referrals', `
<h1>Referral Dashboard</h1>
<p class="sub">Earn 10% of commissions from every driver you refer — forever.</p>
<div class="dsec">
  <h2>Your Referral Link</h2>
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <code style="background:#0f0f18;padding:10px 14px;border-radius:10px;font-size:13px;color:var(--acc);flex:1;min-width:200px;word-break:break-all">${refLink}</code>
    <button class="copy-btn" onclick="copyRef()">Copy</button>
  </div>
  <p style="color:var(--sub);font-size:13px;margin-top:16px">Referral earnings: <strong style="color:var(--acc)">${fmt$(totalRef)}</strong></p>
</div>
<div class="dsec">
  <h2>Referred Drivers (${referrals.length})</h2>
  ${referrals.length?`<table><tr><th>Joined</th><th>Status</th></tr>
  ${referrals.map(r=>`<tr><td>${new Date(r.created_at).toLocaleDateString()}</td><td><span class="badge badge-green">active</span></td></tr>`).join('')}
  </table>`:'<p style="color:var(--sub);font-size:13px">No referrals yet. Share your link to start earning.</p>'}
</div>`,
`<script>function copyRef(){navigator.clipboard.writeText('${refLink}');event.target.textContent='Copied!';setTimeout(()=>event.target.textContent='Copy',2000);}</script>`);
}

// ─── EARNINGS ───
async function handleDriverEarnings(request, env, driver) {
  const commissions = await sbGet(env, 'commissions', `driver_id=eq.${driver.id}&select=*&order=created_at.desc`);
  const now = new Date();
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMo = commissions.filter(c=>new Date(c.created_at)>=mStart).reduce((s,c)=>s+c.driver_amount_cents,0);
  const pending = commissions.filter(c=>c.status==='pending').reduce((s,c)=>s+c.driver_amount_cents,0);
  const paid    = commissions.filter(c=>c.status==='paid').reduce((s,c)=>s+c.driver_amount_cents,0);
  return dashShell('Earnings', 'earnings', `
<h1>Earnings</h1>
<p class="sub">Commission breakdown and payout status</p>
<div class="stats" style="grid-template-columns:repeat(3,1fr)">
  <div class="stat"><div class="stat-n">${fmt$(thisMo)}</div><div class="stat-l">This Month</div></div>
  <div class="stat"><div class="stat-n">${fmt$(pending)}</div><div class="stat-l">Pending</div></div>
  <div class="stat"><div class="stat-n">${fmt$(paid)}</div><div class="stat-l">Lifetime Paid</div></div>
</div>
<div class="dsec" style="font-size:13px;color:var(--sub)">
📅 Payouts processed on the <strong style="color:var(--txt)">1st of each month</strong>. Minimum payout: <strong style="color:var(--txt)">$25.00</strong>.
${!driver.w9_submitted?'<a href="/driver/w9">Submit your W9 →</a>':'✅ W9 on file'}
</div>
${commissions.length?`<div class="dsec">
<h2>Commission History</h2>
<table><tr><th>Date</th><th>Type</th><th>Gross</th><th>Yours</th><th>Status</th></tr>
${commissions.map(c=>`<tr>
<td>${new Date(c.created_at).toLocaleDateString()}</td>
<td>${c.type==='truck_conversion'?'Truck':'Referral'}</td>
<td>${fmt$(c.gross_amount_cents||0)}</td>
<td>${fmt$(c.driver_amount_cents||0)}</td>
<td><span class="badge ${c.status==='paid'?'badge-green':c.status==='pending'?'badge-yellow':'badge-red'}">${c.status}</span></td>
</tr>`).join('')}
</table></div>`:'<div class="dsec"><p style="color:var(--sub);font-size:13px">No commissions yet.</p></div>'}`);
}

// ─── SETTINGS ───
async function handleDriverSettings(request, env, driver) {
  return dashShell('Settings', 'settings', `
<h1>Account Settings</h1>
<p class="sub">Update your profile and preferences</p>
<div class="dsec">
  <h2>Profile</h2>
  <div class="msg-ok" id="ok"></div><div class="msg-err" id="err"></div>
  <div class="form-group"><label>Display Name</label><input type="text" id="nm" value="${driver.name||''}" required></div>
  <div class="form-group"><label>Phone</label><input type="tel" id="ph" value="${driver.phone||''}"></div>
  <button class="btn btn-sm" onclick="saveProfile()">Save Changes</button>
</div>
<div class="dsec">
  <h2>Change Password</h2>
  <div class="form-group"><label>Current Password</label><input type="password" id="cpw" required></div>
  <div class="form-group"><label>New Password</label><input type="password" id="npw" required minlength="8"></div>
  <div class="form-group"><label>Confirm New Password</label><input type="password" id="cpw2" required minlength="8"></div>
  <button class="btn btn-sm" onclick="changePw()">Update Password</button>
</div>
<div class="dsec" style="border-color:#1e1e2e">
  <h2>Account Info</h2>
  <p style="color:var(--sub);font-size:13px;margin-bottom:8px">Email: <strong style="color:var(--txt)">${driver.email}</strong> (contact support to change)</p>
  <p style="color:var(--sub);font-size:13px;margin-bottom:8px">Referral Code: <strong style="color:var(--acc)">${driver.referral_code||'N/A'}</strong></p>
  <p style="color:var(--sub);font-size:13px">Member since: ${new Date(driver.created_at).toLocaleDateString()}</p>
</div>`,
`<script>
async function saveProfile(){
  const r=await fetch('/driver/settings',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'profile',name:document.getElementById('nm').value,phone:document.getElementById('ph').value})});
  const d=await r.json();
  const el=document.getElementById(d.ok?'ok':'err');el.textContent=d.ok?'Saved!':d.error;el.classList.add('show');
}
async function changePw(){
  if(document.getElementById('npw').value!==document.getElementById('cpw2').value){
    document.getElementById('err').textContent='Passwords do not match';document.getElementById('err').classList.add('show');return;
  }
  const r=await fetch('/driver/settings',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'password',current_password:document.getElementById('cpw').value,new_password:document.getElementById('npw').value})});
  const d=await r.json();
  const el=document.getElementById(d.ok?'ok':'err');el.textContent=d.ok?'Password updated!':d.error;el.classList.add('show');
}
</script>`);
}

async function handleDriverSettingsPost(request, env, driver) {
  try {
    const body = await request.json();
    if (body.action==='profile') {
      if (!body.name) return jsonOk({ ok:false, error:'Name is required' });
      await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { name:body.name, phone:body.phone||null, profile_updated_at:new Date().toISOString() });
      return jsonOk({ ok:true });
    }
    if (body.action==='password') {
      if (!body.current_password||!body.new_password||body.new_password.length<8) return jsonOk({ ok:false, error:'Invalid request' });
      const d = await sbGetOne(env, 'drivers', `id=eq.${driver.id}&select=password_hash`);
      if (!d||!await verifyPassword(body.current_password, d.password_hash)) return jsonOk({ ok:false, error:'Current password is incorrect' });
      await sbPatch(env, 'drivers', `id=eq.${driver.id}`, { password_hash:await hashPassword(body.new_password) });
      return jsonOk({ ok:true });
    }
    return jsonOk({ ok:false, error:'Unknown action' });
  } catch { return jsonOk({ ok:false, error:'Server error' }); }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD — NEW DESIGN (defensive, no crash)
// ═══════════════════════════════════════════════════════════════

const adminShell = (title, content) => html(`<!DOCTYPE html>
<html lang="en" data-lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Admin</title>
<style>
${DS}
.anav{background:#0d0d14;border-bottom:1px solid var(--bdr);padding:0 20px;display:flex;align-items:center;min-height:50px;gap:16px;overflow-x:auto}
.anav-logo{font-weight:900;letter-spacing:2px;color:var(--acc);font-size:13px;flex-shrink:0}
.anav a{color:var(--sub);text-decoration:none;font-size:12px;padding:4px 8px;border-radius:6px;white-space:nowrap;flex-shrink:0}
.anav a:hover{color:var(--acc)}
.anav-logout{margin-left:auto;background:none;border:none;color:#444;cursor:pointer;font-size:12px;padding:4px 8px;font-family:inherit;flex-shrink:0}
.apage{padding:24px;max-width:1100px;margin:0 auto}
.apage h1{font-size:20px;font-weight:800;margin-bottom:20px}
.asec{background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:18px;margin-bottom:18px}
.asec h2{font-size:14px;font-weight:700;margin-bottom:12px;color:var(--txt)}
table{width:100%;border-collapse:collapse;font-size:12px}
th{color:var(--sub);font-weight:600;text-align:left;padding:6px 0;border-bottom:1px solid var(--bdr);text-transform:uppercase;letter-spacing:.5px}
td{padding:9px 0;border-bottom:1px solid #10101a;color:var(--sub);vertical-align:middle}
td:first-child{color:var(--txt)}
.stats-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.astat{background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:14px 20px;text-align:center;min-width:100px}
.astat-n{font-size:20px;font-weight:800;color:var(--acc)}
.astat-l{font-size:11px;color:var(--sub);margin-top:2px}
form{display:inline}
</style></head><body>
<nav class="anav">
  <span class="anav-logo">QRP ADMIN</span>
  <a href="/admin/dashboard">Overview</a>
  <a href="/admin/dashboard#drivers">Drivers</a>
  <a href="/admin/dashboard#w9">W9</a>
  <a href="/admin/dashboard#commissions">Commissions</a>
  <a href="/admin/dashboard#offers">Offers</a>
  <a href="/admin/dashboard#leads">Leads</a>
  <form action="/admin/logout" method="POST" style="display:flex;margin-left:auto">
    <button type="submit" class="anav-logout">Logout</button>
  </form>
</nav>
<div class="apage">${content}</div>
</body></html>`);

async function handleAdminLoginPage(request, env) {
  if (isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/dashboard', request.url).toString(), 302);
  return html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Admin</title>
<style>
${DS}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.card{background:var(--surf);border:1px solid var(--bdr);border-radius:20px;padding:36px 28px;width:100%;max-width:360px;text-align:center}
.logo{font-size:18px;font-weight:900;letter-spacing:3px;color:var(--acc);margin-bottom:28px}
.msg-err{margin-bottom:16px}
</style></head>
<body><div class="card">
<div class="logo">QRP ADMIN</div>
<div class="msg-err" id="err"></div>
<div class="form-group"><input type="password" id="pw" placeholder="Admin password" autocomplete="current-password" onkeydown="if(event.key==='Enter')doLogin()"></div>
<button class="btn" style="width:100%" onclick="doLogin()">Enter →</button>
</div>
<script>
async function doLogin(){
  const r=await fetch('/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('pw').value})});
  const d=await r.json();
  if(d.ok)window.location.href='/admin/dashboard';
  else{document.getElementById('err').textContent='Invalid password';document.getElementById('err').classList.add('show');}
}
</script>
</body></html>`);
}

async function handleAdminLoginPost(request, env) {
  try {
    const { password } = await request.json();
    if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) return jsonOk({ ok:false, error:'Invalid password' });
    return new Response(JSON.stringify({ ok:true }), {
      headers:{ 'Content-Type':'application/json',
        'Set-Cookie':`qrp_admin=${env.ADMIN_PASSWORD}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400` }
    });
  } catch { return jsonOk({ ok:false, error:'Error' }); }
}

async function handleAdminDashboard(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);

  // Fetch all data defensively
  let drivers=[], commissions=[], affiliates=[], captures=[], w9s=[];
  try {
    [drivers, commissions, affiliates, captures, w9s] = await Promise.all([
      sbGet(env, 'drivers', 'select=*&order=created_at.desc'),
      sbGet(env, 'commissions', 'select=*&order=created_at.desc'),
      sbGet(env, 'affiliates', 'select=*&order=display_order.asc'),
      sbGet(env, 'email_captures', 'select=*&order=created_at.desc&limit=100'),
      sbGet(env, 'w9_submissions', 'select=id,driver_id,created_at,reviewed&order=created_at.desc'),
    ]);
  } catch(e) { console.error('Admin dashboard fetch error:', e.message); }

  const pending   = drivers.filter(d=>d.status==='pending');
  const active    = drivers.filter(d=>d.status==='active');
  const pendingPay = commissions.filter(c=>c.status==='pending').reduce((s,c)=>s+(c.driver_amount_cents||0),0);
  const paidOut    = commissions.filter(c=>c.status==='paid').reduce((s,c)=>s+(c.driver_amount_cents||0),0);

  const drRow = d => `<tr>
<td>${d.name||'—'}</td>
<td style="color:var(--sub)">${d.email}</td>
<td><span class="badge ${d.status==='active'?'badge-green':d.status==='pending'?'badge-yellow':'badge-red'}">${d.status}</span></td>
<td>${d.w9_submitted?'<span style="color:var(--acc)">✓</span>':'<span style="color:#333">—</span>'}</td>
<td style="color:var(--sub)">${d.referral_code||'—'}</td>
<td style="text-align:right">
${d.status==='pending'?`<form action="/admin/approve-driver" method="POST" style="display:inline"><input type="hidden" name="driver_id" value="${d.id}"><button class="btn btn-sm" style="font-size:11px">Approve</button></form>
<form action="/admin/deny-driver" method="POST" style="display:inline;margin-left:6px"><input type="hidden" name="driver_id" value="${d.id}"><button class="btn btn-sm btn-danger" style="font-size:11px">Deny</button></form>`:''}
${d.status==='active'?`<form action="/admin/deny-driver" method="POST" style="display:inline"><input type="hidden" name="driver_id" value="${d.id}"><button class="btn btn-sm btn-ghost" style="font-size:11px">Suspend</button></form>`:''}
</td></tr>`;

  const commPending = commissions.filter(c=>c.status==='pending').slice(0,40);

  return adminShell('Dashboard', `
<h1>QR Perks Admin</h1>
<div class="stats-row">
  <div class="astat"><div class="astat-n">${drivers.length}</div><div class="astat-l">Drivers</div></div>
  <div class="astat"><div class="astat-n" style="color:#f59e0b">${pending.length}</div><div class="astat-l">Pending</div></div>
  <div class="astat"><div class="astat-n">${active.length}</div><div class="astat-l">Active</div></div>
  <div class="astat"><div class="astat-n" style="color:#f59e0b">$${(pendingPay/100).toFixed(2)}</div><div class="astat-l">Owed</div></div>
  <div class="astat"><div class="astat-n">$${(paidOut/100).toFixed(2)}</div><div class="astat-l">Paid Out</div></div>
  <div class="astat"><div class="astat-n">${captures.length}</div><div class="astat-l">Leads</div></div>
</div>

<div class="asec" id="drivers">
<h2>Drivers</h2>
<table><tr><th>Name</th><th>Email</th><th>Status</th><th>W9</th><th>Ref Code</th><th style="text-align:right">Actions</th></tr>
${drivers.map(drRow).join('')||'<tr><td colspan="6" style="color:var(--sub);padding:12px 0">No drivers yet</td></tr>'}
</table></div>

<div class="asec" id="w9">
<h2>W9 Submissions</h2>
<table><tr><th>Date</th><th>Driver ID</th><th>Status</th><th style="text-align:right">Action</th></tr>
${w9s.map(w=>`<tr>
<td>${new Date(w.created_at).toLocaleDateString()}</td>
<td style="color:var(--sub)">${(w.driver_id||'').slice(0,8)}</td>
<td>${w.reviewed?'<span class="badge badge-green">Reviewed</span>':'<span class="badge badge-yellow">Pending</span>'}</td>
<td style="text-align:right">${!w.reviewed?`<form action="/admin/w9/review" method="POST" style="display:inline"><input type="hidden" name="w9_id" value="${w.id}"><button class="btn btn-sm btn-ghost" style="font-size:11px">Mark Reviewed</button></form>`:'—'}</td>
</tr>`).join('')||'<tr><td colspan="4" style="color:var(--sub);padding:12px 0">No W9 submissions</td></tr>'}
</table></div>

<div class="asec" id="commissions">
<h2>Pending Commissions</h2>
<div style="margin-bottom:12px">
<form action="/admin/commissions/calculate" method="POST" style="display:inline">
<button class="btn btn-sm">▶ Run Commission Calc</button>
</form>
</div>
<table><tr><th>Date</th><th>Driver</th><th>Type</th><th>Amount</th><th style="text-align:right">Action</th></tr>
${commPending.map(c=>`<tr>
<td>${new Date(c.created_at).toLocaleDateString()}</td>
<td style="color:var(--sub)">${(c.driver_id||'').slice(0,8)}</td>
<td>${c.type==='truck_conversion'?'Truck':'Referral'}</td>
<td>$${((c.driver_amount_cents||0)/100).toFixed(2)}</td>
<td style="text-align:right"><form action="/admin/commissions/mark-paid" method="POST" style="display:inline"><input type="hidden" name="commission_id" value="${c.id}"><button class="btn btn-sm btn-outline" style="font-size:11px">Mark Paid</button></form></td>
</tr>`).join('')||'<tr><td colspan="5" style="color:var(--sub);padding:12px 0">No pending commissions</td></tr>'}
</table></div>

<div class="asec" id="offers">
<h2>Affiliate Offers</h2>
<table><tr><th>Name</th><th>Type</th><th>Order</th><th>Featured</th><th>Status</th><th style="text-align:right">Actions</th></tr>
${affiliates.map(a=>`<tr>
<td>${a.name}</td>
<td style="color:var(--sub)">${a.offer_type||'—'}</td>
<td style="color:var(--sub)">${a.display_order}</td>
<td>${a.is_featured?'<span style="color:var(--acc)">★</span>':'—'}</td>
<td><span class="badge ${a.status==='active'?'badge-green':'badge-red'}">${a.status}</span></td>
<td style="text-align:right">
<form action="/admin/offers" method="POST" style="display:inline"><input type="hidden" name="affiliate_id" value="${a.id}"><input type="hidden" name="action" value="${a.status==='active'?'deactivate':'activate'}"><button class="btn btn-sm btn-ghost" style="font-size:11px">${a.status==='active'?'Deactivate':'Activate'}</button></form>
<form action="/admin/offers" method="POST" style="display:inline;margin-left:4px"><input type="hidden" name="affiliate_id" value="${a.id}"><input type="hidden" name="action" value="${a.is_featured?'unfeature':'feature'}"><button class="btn btn-sm ${a.is_featured?'btn-ghost':''}" style="font-size:11px">${a.is_featured?'Unfeature':'Feature'}</button></form>
</td></tr>`).join('')}
</table></div>

<div class="asec" id="leads">
<h2>Email Captures (last 100)</h2>
<table><tr><th>Date</th><th>Email</th><th>Phone</th><th>Source</th><th>Offer</th></tr>
${captures.slice(0,60).map(c=>`<tr>
<td>${new Date(c.created_at).toLocaleDateString()}</td>
<td>${c.email||'—'}</td>
<td style="color:var(--sub)">${c.phone||'—'}</td>
<td style="color:var(--sub)">${c.source||'—'}</td>
<td style="color:var(--sub)">${c.offer_clicked||'—'}</td>
</tr>`).join('')||'<tr><td colspan="5" style="color:var(--sub);padding:12px 0">No leads yet</td></tr>'}
</table></div>`);
}

async function handleAdminApproveDriver(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  const form = await request.formData();
  const driver_id = form.get('driver_id');
  if (driver_id) {
    const driver = await sbGetOne(env, 'drivers', `id=eq.${driver_id}&select=*`);
    if (driver) {
      await sbPatch(env, 'drivers', `id=eq.${driver_id}`, { status:'active' });
      await sendEmail(env, { to:driver.email, subject:'Your QR Perks account is approved!', html:emailWelcome(driver), template_name:'welcome' });
    }
  }
  return Response.redirect(new URL('/admin/dashboard#drivers', request.url).toString(), 302);
}

async function handleAdminDenyDriver(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  const form = await request.formData();
  const driver_id = form.get('driver_id');
  if (driver_id) await sbPatch(env, 'drivers', `id=eq.${driver_id}`, { status:'suspended' });
  return Response.redirect(new URL('/admin/dashboard#drivers', request.url).toString(), 302);
}

async function handleAdminCalcCommissions(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  await calculateCommissions(env);
  return Response.redirect(new URL('/admin/dashboard#commissions', request.url).toString(), 302);
}

async function handleAdminMarkPaid(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  const form = await request.formData();
  const id = form.get('commission_id');
  if (id) await sbPatch(env, 'commissions', `id=eq.${id}`, { status:'paid', paid_at:new Date().toISOString() });
  return Response.redirect(new URL('/admin/dashboard#commissions', request.url).toString(), 302);
}

async function handleAdminUpdateOffer(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  const form = await request.formData();
  const affiliate_id = form.get('affiliate_id');
  const action = form.get('action');
  if (affiliate_id && action) {
    if (action==='activate') await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { status:'active' });
    else if (action==='deactivate') await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { status:'inactive' });
    else if (action==='feature') {
      await sbPatch(env, 'affiliates', 'is_featured=eq.true', { is_featured:false });
      await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { is_featured:true });
    } else if (action==='unfeature') await sbPatch(env, 'affiliates', `id=eq.${affiliate_id}`, { is_featured:false });
  }
  return Response.redirect(new URL('/admin/dashboard#offers', request.url).toString(), 302);
}

async function handleAdminW9Review(request, env) {
  if (!isAdminAuthed(request, env)) return Response.redirect(new URL('/admin/login', request.url).toString(), 302);
  const form = await request.formData();
  const id = form.get('w9_id');
  if (id) await sbPatch(env, 'w9_submissions', `id=eq.${id}`, { reviewed:true, reviewed_at:new Date().toISOString() });
  return Response.redirect(new URL('/admin/dashboard#w9', request.url).toString(), 302);
}

function handleAdminLogout(request, env) {
  return new Response(null, { status:302, headers:{ 'Location':'/admin/login', 'Set-Cookie':'qrp_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' }});
}

// ═══════════════════════════════════════════════════════════════
// COMMISSION ENGINE
// ═══════════════════════════════════════════════════════════════

async function calculateCommissions(env) {
  try {
    const convs = await sbGet(env, 'conversions', 'commission_calculated=eq.false&select=*');
    for (const conv of convs) {
      if (!conv.gross_amount_cents || !conv.driver_id) continue;
      const driverAmt = Math.floor(conv.gross_amount_cents * 0.20);
      const commRow = await sbPost(env, 'commissions', { driver_id:conv.driver_id, conversion_id:conv.id, type:'truck_conversion', gross_amount_cents:conv.gross_amount_cents, driver_amount_cents:driverAmt, status:'pending' });
      await sbPatch(env, 'conversions', `id=eq.${conv.id}`, { commission_calculated:true, commission_id:commRow?.id||null });
      const refs = await sbGet(env, 'referrals', `referred_driver_id=eq.${conv.driver_id}&select=referrer_driver_id`);
      if (refs[0]) {
        const refAmt = Math.floor(conv.gross_amount_cents * 0.10);
        await sbPost(env, 'commissions', { driver_id:refs[0].referrer_driver_id, conversion_id:conv.id, type:'referral_override', gross_amount_cents:conv.gross_amount_cents, driver_amount_cents:refAmt, status:'pending' });
      }
    }
  } catch(e) { console.error('calculateCommissions error:', e.message); }
}

async function runMonthlyCommissions(env) {
  await calculateCommissions(env);
}

// ═══════════════════════════════════════════════════════════════
// CONTACT PAGE + HANDLER
// ═══════════════════════════════════════════════════════════════

async function handleContactPage(request, env) {
  return html(`<!DOCTYPE html>
<html lang="en" data-lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Contact — QR Perks</title>
<style>${DS}
.page{padding:40px 24px;max-width:640px;margin:0 auto}
.logo{font-size:18px;font-weight:900;letter-spacing:3px;color:var(--acc);margin-bottom:28px}
.back{color:var(--acc);font-size:13px;display:inline-block;margin-bottom:20px}
h1{font-size:26px;font-weight:800;margin-bottom:8px}
.sub{color:var(--sub);font-size:15px;margin-bottom:28px}
.card{background:var(--surf);border:1px solid var(--bdr);border-radius:16px;padding:24px;margin-bottom:20px}
.form-group{margin-bottom:16px}
</style></head><body>
<div class="page">
<div class="logo">QR PERKS</div>
<a href="/" class="back">← Back</a>
<h1><span class="en">Contact Us</span><span class="es">Contáctanos</span></h1>
<p class="sub"><span class="en">We typically respond within 1–2 business days.</span><span class="es">Normalmente respondemos dentro de 1–2 días hábiles.</span></p>
<div class="card">
<div class="msg-ok" id="ok"></div>
<div class="msg-err" id="err"></div>
<div id="cform">
<div class="form-group"><label><span class="en">Name</span><span class="es">Nombre</span></label><input type="text" id="cn" required></div>
<div class="form-group"><label><span class="en">Email</span><span class="es">Correo electrónico</span></label><input type="email" id="ce" required></div>
<div class="form-group"><label><span class="en">Message</span><span class="es">Mensaje</span></label><textarea id="cm" rows="5" required style="resize:vertical"></textarea></div>
<button class="btn" style="width:100%" onclick="sendContact()"><span class="en">Send Message</span><span class="es">Enviar Mensaje</span></button>
</div>
</div>
<p style="color:var(--sub);font-size:14px"><span class="en">Email us directly:</span><span class="es">Escríbenos directamente:</span> <a href="mailto:support@qr-perks.com">support@qr-perks.com</a></p>
</div>
<script>
function getLang(){const s=localStorage.getItem('qrp-lang');if(s)return s;return(navigator.language||'').startsWith('es')?'es':'en';}
function setLang(l){localStorage.setItem('qrp-lang',l);document.documentElement.setAttribute('data-lang',l);}
setLang(getLang());
async function sendContact(){
  const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:document.getElementById('cn').value,email:document.getElementById('ce').value,message:document.getElementById('cm').value})});
  const d=await r.json();
  document.getElementById('cform').style.display='none';
  document.getElementById('ok').textContent=getLang()==='en'?'Message sent! We\'ll reply within 1–2 business days.':'¡Mensaje enviado! Te responderemos en 1–2 días hábiles.';
  document.getElementById('ok').classList.add('show');
}
</script>
</body></html>`);
}

async function handleContactPost(request, env) {
  try {
    const { name, email, message } = await request.json();
    if (!name||!email||!message) return jsonOk({ ok:false, error:'All fields required' });
    await sbPost(env, 'email_captures', { email, source:'contact_form', offer_clicked:null, ip_hash:await hashIp(request.headers.get('CF-Connecting-IP')||'') });
    await sendEmail(env, { to:'support@qr-perks.com', subject:`QR Perks Contact: ${name}`, html:emailBase(`<div class="card"><h1>New Contact Message</h1><p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g,'<br>')}</p></div>`), template_name:'contact' });
    return jsonOk({ ok:true });
  } catch { return jsonOk({ ok:true }); }
}

// ═══════════════════════════════════════════════════════════════
// LEGAL PAGES
// ═══════════════════════════════════════════════════════════════

const legalShell = (title, body) => html(`<!DOCTYPE html>
<html lang="en" data-lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — QR Perks</title>
<style>${DS}
.lpage{padding:40px 24px;max-width:720px;margin:0 auto;line-height:1.75}
.logo{font-size:18px;font-weight:900;letter-spacing:3px;color:var(--acc);margin-bottom:28px}
.back{color:var(--acc);font-size:13px;display:inline-block;margin-bottom:20px}
h1{font-size:26px;font-weight:800;margin-bottom:8px;color:var(--txt)}
h2{font-size:16px;font-weight:700;margin:28px 0 10px;color:var(--txt)}
p{color:var(--sub);font-size:15px;margin-bottom:14px}
strong{color:var(--txt)}
ul{color:var(--sub);font-size:15px;padding-left:20px;margin-bottom:14px;line-height:2}
.effective{color:#444;font-size:13px;margin-bottom:28px}
</style></head><body>
<div class="lpage">
<div class="logo">QR PERKS</div>
<a href="/" class="back">← Back to QR Perks</a>
${body}
</div>
<script>
function getLang(){const s=localStorage.getItem('qrp-lang');if(s)return s;return(navigator.language||'').startsWith('es')?'es':'en';}
function setLang(l){localStorage.setItem('qrp-lang',l);document.documentElement.setAttribute('data-lang',l);}
setLang(getLang());
</script>
</body></html>`);

function staticPage(slug) {
  if (slug==='privacy') return legalShell('Privacy Policy', `
<h1><span class="en">Privacy Policy</span><span class="es">Política de Privacidad</span></h1>
<p class="effective"><span class="en">Effective: January 1, 2025</span><span class="es">Vigente: 1 de enero de 2025</span></p>
<h2><span class="en">What We Collect</span><span class="es">Qué Recopilamos</span></h2>
<p><span class="en">We collect information you provide directly (email address, phone number, name) and information collected automatically when you use our service (IP address, device type, pages visited, QR code scan data).</span>
<span class="es">Recopilamos información que nos proporciona directamente (correo electrónico, teléfono, nombre) e información recopilada automáticamente (dirección IP, tipo de dispositivo, páginas visitadas, datos de escaneo de código QR).</span></p>
<h2><span class="en">How We Use It</span><span class="es">Cómo Lo Usamos</span></h2>
<p><span class="en">We use collected information to: operate our platform and track affiliate conversions; send you deals and alerts you've requested; process driver commission payments; comply with IRS reporting requirements; improve our service.</span>
<span class="es">Usamos la información para: operar nuestra plataforma y rastrear conversiones de afiliados; enviarte ofertas y alertas solicitadas; procesar pagos de comisiones; cumplir con requisitos del IRS; mejorar nuestro servicio.</span></p>
<h2><span class="en">Third-Party Services</span><span class="es">Servicios de Terceros</span></h2>
<p><span class="en">We use Supabase (database), Cloudflare (infrastructure and analytics), Resend (email delivery), and affiliate networks. Each has its own privacy policy.</span>
<span class="es">Usamos Supabase (base de datos), Cloudflare (infraestructura y análisis), Resend (envío de correo) y redes de afiliados. Cada uno tiene su propia política de privacidad.</span></p>
<h2><span class="en">Information Sharing</span><span class="es">Compartir Información</span></h2>
<p><span class="en">We do not sell your personal information. We share data with affiliate partners only as necessary to track conversions and process commissions.</span>
<span class="es">No vendemos su información personal. Compartimos datos con socios afiliados solo para rastrear conversiones y procesar comisiones.</span></p>
<h2><span class="en">Your Rights</span><span class="es">Sus Derechos</span></h2>
<p><span class="en">You may request access to, correction of, or deletion of your personal data by emailing <a href="mailto:privacy@qr-perks.com">privacy@qr-perks.com</a>.</span>
<span class="es">Puede solicitar acceso, corrección o eliminación de sus datos personales enviando un correo a <a href="mailto:privacy@qr-perks.com">privacy@qr-perks.com</a>.</span></p>
<p><a href="mailto:privacy@qr-perks.com">privacy@qr-perks.com</a></p>`);

  if (slug==='terms') return legalShell('Terms of Service', `
<h1><span class="en">Terms of Service</span><span class="es">Términos de Servicio</span></h1>
<p class="effective"><span class="en">Effective: January 1, 2025</span><span class="es">Vigente: 1 de enero de 2025</span></p>
<h2><span class="en">Eligibility</span><span class="es">Elegibilidad</span></h2>
<p><span class="en">You must be 18 years or older and a legal U.S. resident to participate as a driver or enter sweepstakes.</span>
<span class="es">Debes tener 18 años o más y ser residente legal de los EE.UU. para participar como conductor o en sorteos.</span></p>
<h2><span class="en">Driver Program</span><span class="es">Programa de Conductores</span></h2>
<p><span class="en">Drivers may not scan their own QR codes, post truck QR codes online, or engage in any fraudulent activity. Violation results in immediate account termination and forfeiture of all pending commissions.</span>
<span class="es">Los conductores no pueden escanear sus propios códigos QR, publicar códigos QR de camiones en línea, ni participar en actividades fraudulentas. La violación resulta en terminación inmediata y pérdida de comisiones pendientes.</span></p>
<h2><span class="en">Sweepstakes</span><span class="es">Sorteos</span></h2>
<p><span class="en">No purchase necessary. Void where prohibited. Sweepstakes are operated by third-party advertisers. QR Perks is not responsible for prize fulfillment.</span>
<span class="es">Sin compra necesaria. Nulo donde esté prohibido. Los sorteos son operados por anunciantes de terceros. QR Perks no es responsable de la entrega de premios.</span></p>
<h2><span class="en">Limitation of Liability</span><span class="es">Limitación de Responsabilidad</span></h2>
<p><span class="en">QR Perks is not liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed $100.</span>
<span class="es">QR Perks no es responsable de daños indirectos, incidentales o consecuentes. Nuestra responsabilidad total no excederá $100.</span></p>
<h2><span class="en">Governing Law</span><span class="es">Ley Aplicable</span></h2>
<p><span class="en">These terms are governed by the laws of the State of California.</span>
<span class="es">Estos términos se rigen por las leyes del Estado de California.</span></p>`);

  if (slug==='earnings') return legalShell('Earnings Disclaimer', `
<h1><span class="en">Earnings Disclaimer</span><span class="es">Aviso de Ganancias</span></h1>
<p class="effective"><span class="en">Effective: January 1, 2025</span><span class="es">Vigente: 1 de enero de 2025</span></p>
<h2><span class="en">No Earnings Guarantee</span><span class="es">Sin Garantía de Ganancias</span></h2>
<p><span class="en">QR Perks makes no guarantee of earnings or income for drivers in our network. Individual results will vary based on truck routes, scan volume, conversion rates, and other factors outside our control.</span>
<span class="es">QR Perks no garantiza ingresos o ganancias para los conductores de nuestra red. Los resultados individuales variarán según las rutas, volumen de escaneos, tasas de conversión y otros factores fuera de nuestro control.</span></p>
<h2><span class="en">FTC Disclosure</span><span class="es">Divulgación FTC</span></h2>
<p><span class="en">In accordance with FTC guidelines, QR Perks discloses that drivers receive commissions for conversions generated through their truck QR codes. Sweepstakes results displayed on this site are provided by third-party advertisers and are not typical results for QR Perks drivers.</span>
<span class="es">De acuerdo con las directrices de la FTC, QR Perks revela que los conductores reciben comisiones por conversiones generadas a través de sus códigos QR. Los resultados de sorteos mostrados en este sitio son proporcionados por anunciantes de terceros y no son resultados típicos para conductores de QR Perks.</span></p>
<h2><span class="en">Driver Commission Structure</span><span class="es">Estructura de Comisiones del Conductor</span></h2>
<p><span class="en"><strong>20%</strong> of net affiliate commissions from truck QR code conversions. <strong>10%</strong> of net commissions from referred drivers' conversions. Payouts made monthly. Minimum threshold: $25.00.</span>
<span class="es"><strong>20%</strong> de las comisiones netas de afiliados de conversiones de códigos QR del camión. <strong>10%</strong> de las comisiones netas de conversiones de conductores referidos. Pagos mensuales. Umbral mínimo: $25.00.</span></p>
<h2><span class="en">Contact</span><span class="es">Contacto</span></h2>
<p><a href="mailto:support@qr-perks.com">support@qr-perks.com</a></p>`);

  if (slug==='disclosure') return legalShell('Affiliate Disclosure', `
<h1>Affiliate Disclosure</h1>
<p class="effective">Effective: January 1, 2025</p>
<p>QR Perks participates in affiliate marketing programs. When you click an offer link and complete a qualifying action (such as filling out a form or making a purchase), we may earn a commission from the advertiser. This does not affect the price you pay or the quality of the offer.</p>
<p>All offers listed on QR Perks are provided by third-party advertisers. QR Perks does not guarantee the accuracy of advertiser claims, prize availability, or loan approval.</p>
<p>Truck drivers in our network earn commissions when visitors they refer complete qualifying actions. Full commission terms available at <a href="/contractor">/contractor</a>.</p>`);

  if (slug==='contractor') return legalShell('Contractor Agreement', `
<h1>Independent Contractor Agreement</h1>
<p class="effective">Effective: January 1, 2025</p>
<h2>Relationship</h2>
<p>The QR Perks driver ("Contractor") is an independent contractor, not an employee of QR Perks. Contractor is responsible for all applicable taxes. A completed W9 is required before any payment is issued.</p>
<h2>Commission Structure</h2>
<ul><li><strong>20%</strong> of net commissions from QR code conversions on assigned truck(s)</li><li><strong>10%</strong> of net commissions from referred drivers — ongoing, no cap</li></ul>
<h2>Payment</h2>
<p>Commissions calculated on the 1st of each month. Paid within 10 business days. Minimum payout: $25.00. Company will issue 1099-NEC for annual payments over $600.</p>
<h2>Rules (Non-Negotiable)</h2>
<ul><li>Do not scan your own QR code</li><li>Do not post truck QR codes online</li><li>Do not engage in click fraud or incentivized traffic</li><li>Do not place QR codes on vehicles you don't own/operate</li></ul>
<p>Violation = immediate termination + forfeiture of all unpaid commissions.</p>
<h2>Governing Law</h2>
<p>State of California.</p>`);

  if (slug==='unsubscribe') return legalShell('Unsubscribe', `
<h1><span class="en">Unsubscribed</span><span class="es">Dado de Baja</span></h1>
<p><span class="en">You've been removed from QR Perks email communications. To re-subscribe or for questions, email <a href="mailto:support@qr-perks.com">support@qr-perks.com</a>.</span>
<span class="es">Has sido eliminado de las comunicaciones de correo de QR Perks. Para volver a suscribirte, escríbenos a <a href="mailto:support@qr-perks.com">support@qr-perks.com</a>.</span></p>`);

  return html404();
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function html(body, status=200) {
  return new Response(body, { status, headers:{ 'Content-Type':'text/html; charset=utf-8', 'X-Content-Type-Options':'nosniff' }});
}

function jsonOk(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers:{ 'Content-Type':'application/json' }});
}

function html404() {
  return html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Not Found</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a0f;color:#f0f0f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center}
h1{font-size:64px;font-weight:900;color:#00ff88}p{color:#555;margin:8px 0}a{color:#00ff88}</style></head>
<body><div><h1>404</h1><p>Page not found.</p><p style="margin-top:16px"><a href="/">← Back to QR Perks</a></p></div></body></html>`, 404);
}
