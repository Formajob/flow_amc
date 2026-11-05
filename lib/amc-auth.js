const crypto = require('crypto');

// Aucun mot de passe ici. Les secrets restent dans les variables Vercel.
// Les deux admins voient et modifient tout. Les membres voient les mêmes pages, sans modifier.
const SAUF_LIVRES = ['pantalons', 'pulls', 'pyjamas', 'peignoirs', 'djellaba_f', 'djellaba_h', 'jackets', 'manteaux', 'chales', 'argent'];
const PEOPLE = [
  { email: 'zouzou.douni@gmail.com', name: 'Zineb Elagbi', role: 'admin', passwordHash: 'scrypt$UXxn-BYhhLbhkwaRvfSRWw$9Iw3TwPgyspjE69Gp9ZO-BJGQPNOpjZFA2MqKUdnxfw' },
  { email: 'achetoukch96@gmail.com', name: 'Chaimaa Achetouk', role: 'admin', passwordHash: 'scrypt$nvmeBj6SRWvK7L9NcoG9fA$LTviEaJNAoEg0RP_PEmYPAcFhMQEhqbBcS3vlZ41ckE' },
  { email: 'bouchroub.a@gmail.com', name: 'Ashraf', role: 'membre', passwordHash: 'scrypt$rbHEaQbPd_pZ4E1WF89Qig$zj6T8h843I2pmIFFFL0dsA4nSn2WkE2XwRYJPAhjy8Q' },
  { email: 'yassirkrami01@gmail.com', name: 'Yassir', role: 'saisie', pages: ['index.html', 'collecte.html', 'preparation.html', 'transport.html', 'distribution.html', 'classement.html', 'communiques.html'], passwordHash: 'scrypt$zNXOF30NN_WG2Q_aXFXn_A$w46XL7pAfe6NNmIxKRPMbDET2kf2sVgVOMb4GtDQaNQ' },
  { email: 'abassihamza14@gmail.com', name: 'Hamza', role: 'membre', passwordHash: 'scrypt$SAhm9gex49Xv2kRj9u8lVw$3lfdEmBjqVnUREo9v45P7MNxzcTfI0kx13I0cp8szLE' },
  { email: 'hassnaalachgar1995@gmail.com', name: 'Hassnaa', role: 'membre', passwordHash: 'scrypt$i43k6ZYUmTvWbaQ-tKd8qA$7lB8InV6adhf07muehPDv_E_NiLHnKaBDYFHFQ5LLRE' },
  { email: 'scaliougirl@gmail.com', name: 'Bouchra', role: 'membre', passwordHash: 'scrypt$bohPsCkB-l6XRXjQktBfGA$N3olTTYxHioyEnAI-WGHhUZPvuBQRGhX2NJw6v6nD2Q' },
  { email: 's.safaasamih@gmail.com', name: 'Safaa', role: 'membre', passwordHash: 'scrypt$zYX_zQy7mlqQ-5yDfVKEiA$ihQnwJSdIxLlU_YrVO5GlxsiVF_uT53puB6tkYM76ds' },
  { email: 'mohamedyahyajbir@gmail.com', name: 'Yahya', role: 'saisie', pages: ['collecte.html', 'communiques.html'], items: SAUF_LIVRES, passwordHash: 'scrypt$TKubEubWYe_pKZvYEIEmtA$Rl57aOaedqIwN5bI7ZXx-uQ6FPAYqDYRPovl4MNm3eE' },
  { email: 'marouaabid1607@gmail.com', name: 'Maroua', role: 'saisie', pages: ['collecte.html', 'communiques.html'], items: ['livres'], passwordHash: 'scrypt$zeILj9vIAlxNOH-HRRsOhQ$7vTGujVZiVO1rxI8d2QwBijCgjzork-QGthW07vKG9I' }
];
const COOKIE = 'amc_session';
const MAX_AGE = 60 * 60 * 12;
const PORTAL_ORIGINS = new Set(['https://acx-flow.vercel.app']);

function personOf(email) {
  return PEOPLE.find((p) => p.email === email) || null;
}

function normalizeRole(role) {
  if (role === 'admin' || role === 'saisie' || role === 'membre') return role;
  return 'membre';
}

function pagesFor(role) {
  if (role === 'saisie') return ['collecte.html', 'communiques.html'];
  return ['index.html', 'collecte.html', 'preparation.html', 'transport.html', 'distribution.html', 'classement.html', 'communiques.html'];
}

function pagesForAccount(email, role) {
  const person = personOf(String(email || '').trim().toLowerCase());
  const cleanRole = normalizeRole((person && person.role) || role);
  const list = person && Array.isArray(person.pages) && person.pages.length
    ? person.pages.slice()
    : pagesFor(cleanRole);
  if (cleanRole === 'admin') return list;
  return list.filter((href) => href !== 'administration.html');
}

function itemsFor(email) {
  const person = personOf(String(email || '').trim().toLowerCase());
  if (!person || !Array.isArray(person.items)) return null;
  return person.items.slice();
}

function itemAllowed(email, item) {
  const items = itemsFor(email);
  if (!items) return true;
  return items.indexOf(String(item || '')) >= 0;
}

function adminEmails() {
  const set = new Set(PEOPLE.filter((p) => p.role === 'admin').map((p) => p.email));
  const extra = String(process.env.AMC_ADMIN_EMAIL || '').trim().toLowerCase();
  if (extra && extra.includes('@')) set.add(extra);
  return set;
}

function validEmail(email) {
  return typeof email === 'string' && email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseAccessJson() {
  const raw = process.env.AMC_ACCESS_JSON;
  if (!raw || raw.length > 20000) return {};
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return data;
  } catch (err) {
    return {};
  }
}

function memberEmailsFromEnv() {
  const admins = adminEmails();
  return String(process.env.AMC_MEMBER_EMAILS || '')
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => validEmail(s) && !admins.has(s));
}

function sameText(a, b) {
  const left = crypto.createHash('sha256').update(String(a), 'utf8').digest();
  const right = crypto.createHash('sha256').update(String(b), 'utf8').digest();
  return crypto.timingSafeEqual(left, right);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(String(password), salt, 32).toString('base64url');
  return 'scrypt$' + salt + '$' + hash;
}

function checkPassword(password, stored) {
  if (!password || !stored || String(password).length < 8) return false;
  if (String(stored).startsWith('scrypt$')) {
    const parts = String(stored).split('$');
    if (parts.length !== 3) return false;
    let got;
    try {
      got = crypto.scryptSync(String(password), parts[1], 32);
    } catch (err) {
      return false;
    }
    const exp = Buffer.from(parts[2], 'base64url');
    if (got.length !== exp.length) return false;
    return crypto.timingSafeEqual(got, exp);
  }
  return sameText(password, stored);
}

function secret() {
  const value = String(process.env.AMC_SESSION_SECRET || '');
  return value.length >= 16 ? value : 'amc-localhost-session-2026';
}

function supabaseEnv() {
  const url = String(process.env.AMC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.AMC_SUPABASE_SERVICE_ROLE || '');
  if (!url.startsWith('https://') || key.length < 20) return null;
  return { url, key };
}

async function supabaseFetch(path, options) {
  const env = supabaseEnv();
  if (!env) return null;
  const headers = Object.assign({
    apikey: env.key,
    Authorization: 'Bearer ' + env.key,
    'Content-Type': 'application/json'
  }, (options && options.headers) || {});
  return fetch(env.url + path, {
    method: (options && options.method) || 'GET',
    headers,
    body: options && options.body ? options.body : undefined
  });
}

async function lookupOperator(email) {
  if (!supabaseEnv()) return null;
  try {
    const res = await supabaseFetch('/rest/v1/amc_operators?email=eq.' + encodeURIComponent(email) + '&select=email,name,role,password_hash');
    if (!res || !res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row || !row.password_hash) return null;
    const role = row.role === 'admin' ? 'admin' : (row.role === 'saisie' ? 'saisie' : 'membre');
    return {
      email: String(row.email || email).toLowerCase(),
      name: String(row.name || ''),
      role,
      pages: pagesFor(role),
      items: itemsFor(email),
      passwordHash: row.password_hash,
      configured: true,
      source: 'supabase'
    };
  } catch (err) {
    return null;
  }
}

function passwordFor(address, role) {
  const extra = parseAccessJson()[address];
  if (extra && typeof extra === 'object' && !Array.isArray(extra) && extra.password) {
    return String(extra.password);
  }
  if (role === 'admin') return String(process.env.AMC_ADMIN_PASSWORD || '');
  return String(process.env.AMC_MEMBER_PASSWORD || '');
}

async function classify(email) {
  const address = String(email || '').trim().toLowerCase();
  if (!validEmail(address)) return null;
  const person = personOf(address);
  if (person) {
    const password = passwordFor(address, person.role);
    return {
      email: address,
      name: person.name,
      role: normalizeRole(person.role),
      pages: person.pages || pagesFor(person.role),
      items: itemsFor(address),
      password,
      passwordHash: person.passwordHash || '',
      configured: Boolean(person.passwordHash) || password.length >= 8,
      source: 'directory'
    };
  }
  const extra = parseAccessJson()[address];
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    const password = String(extra.password || '');
    return { email: address, name: '', role: 'membre', password, configured: password.length >= 8, source: 'env' };
  }
  if (memberEmailsFromEnv().includes(address)) {
    const password = String(process.env.AMC_MEMBER_PASSWORD || '');
    return { email: address, name: '', role: 'membre', password, configured: password.length >= 8, source: 'env' };
  }
  return lookupOperator(address);
}

async function checkLogin(email, password) {
  const account = await classify(email);
  if (!account) return { ok: false, code: 'unknown' };
  if (!account.configured) return { ok: false, code: 'unconfigured', role: account.role };
  const hashOk = account.passwordHash && checkPassword(password, account.passwordHash);
  const envOk = account.password && checkPassword(password, account.password);
  if (!hashOk && !envOk) return { ok: false, code: 'password' };
  const role = normalizeRole(account.role);
  return { ok: true, email: account.email, name: account.name || '', role, pages: account.pages || pagesFor(role), items: itemsFor(account.email) };
}

function signSession(email, role, name, pages) {
  const key = secret();
  if (!key) return '';
  const cleanRole = normalizeRole(role);
  const body = Buffer.from(JSON.stringify({
    email,
    name: String(name || ''),
    role: cleanRole,
    pages: (cleanRole === 'saisie' ? (Array.isArray(pages) && pages.length ? pages : pagesFor('saisie')) : (pages || pagesFor(cleanRole))).filter((href) => cleanRole === 'admin' || href !== 'administration.html'),
    items: itemsFor(email),
    exp: Date.now() + MAX_AGE * 1000
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(body).digest('base64url');
  return body + '.' + sig;
}

function readToken(token) {
  const key = secret();
  if (!key || !token || String(token).indexOf('.') < 0) return null;
  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', key).update(parts[0]).digest('base64url');
  const left = Buffer.from(parts[1]);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch (err) {
    return null;
  }
  if (!data || !data.exp || data.exp < Date.now()) return null;
  if (!validEmail(data.email)) return null;
  const role = normalizeRole(data.role);
  if (data.role !== 'admin' && data.role !== 'membre' && data.role !== 'saisie') return null;
  return {
    email: data.email,
    name: String(data.name || ''),
    role,
    pages: role === 'saisie' ? pagesFor('saisie') : pagesFor(role),
    items: itemsFor(data.email)
  };
}

function readSession(req) {
  const raw = (req.headers && req.headers.cookie) || '';
  const parts = String(raw).split(';');
  for (let i = 0; i < parts.length; i += 1) {
    const item = parts[i].trim();
    if (item.indexOf(COOKIE + '=') === 0) {
      try {
        return readToken(decodeURIComponent(item.slice(COOKIE.length + 1)));
      } catch (err) {
        return null;
      }
    }
  }
  return null;
}

function isSecure(req) {
  const proto = req && req.headers && (req.headers['x-forwarded-proto'] || '');
  return Boolean(process.env.VERCEL) || String(proto).split(',')[0].trim() === 'https';
}

function cookieHeader(token, req) {
  return COOKIE + '=' + encodeURIComponent(token) + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + MAX_AGE + (isSecure(req) ? '; Secure' : '');
}

function clearCookie(req) {
  return COOKIE + '=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' + (isSecure(req) ? '; Secure' : '');
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch (err) { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= 4000) chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length || size > 4000) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (err) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function queryEmail(req) {
  if (req.query && req.query.email) return String(req.query.email);
  try {
    const host = (req.headers && req.headers.host) || 'localhost';
    const url = new URL(req.url || '/', 'https://' + host);
    return url.searchParams.get('email') || '';
  } catch (err) {
    return '';
  }
}

function cors(req, res) {
  const origin = (req.headers && req.headers.origin) || '';
  if (!PORTAL_ORIGINS.has(origin)) return;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function listMembers() {
  const rows = [];
  const seen = new Set();
  function push(email, source, name) {
    if (!validEmail(email) || adminEmails().has(email) || seen.has(email)) return;
    seen.add(email);
    rows.push({ email, name: name || '', role: 'membre', source });
  }
  PEOPLE.filter((p) => p.role === 'membre').forEach((p) => push(p.email, 'directory', p.name));
  memberEmailsFromEnv().forEach((email) => push(email, 'env', ''));
  Object.keys(parseAccessJson()).forEach((email) => push(String(email).trim().toLowerCase(), 'env'));
  if (supabaseEnv()) {
    try {
      const res = await supabaseFetch('/rest/v1/amc_operators?select=email,role&role=eq.membre');
      if (res && res.ok) {
        const data = await res.json();
        (Array.isArray(data) ? data : []).forEach((row) => push(String(row.email || '').toLowerCase(), 'supabase'));
      }
    } catch (err) { /* liste partielle */ }
  }
  return { members: rows, storage: supabaseEnv() ? 'supabase' : 'env' };
}

async function addMember(email, password) {
  const address = String(email || '').trim().toLowerCase();
  if (!validEmail(address)) return { saved: false, status: 400, message: 'Adresse invalide.' };
  if (adminEmails().has(address)) {
    return { saved: false, status: 400, message: 'Cette adresse est déjà l’admin. Elle n’a pas à être ajoutée comme membre.' };
  }
  if (!password || String(password).length < 8) {
    return { saved: false, status: 400, message: 'Le mot de passe membre doit faire au moins 8 caractères.' };
  }
  if (supabaseEnv()) {
    try {
      const res = await supabaseFetch('/rest/v1/amc_operators?on_conflict=email', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ email: address, role: 'membre', password_hash: hashPassword(password) })
      });
      if (res && res.ok) {
        return { saved: true, status: 200, message: 'Adresse autorisée. Elle ouvre la vue membre, sans les autres activités.' };
      }
    } catch (err) { /* message ci-dessous */ }
    return { saved: false, status: 502, message: 'La base FLOW n’a pas enregistré cette adresse. Vérifiez que schema.sql a bien été appliqué.' };
  }
  return {
    saved: false,
    status: 501,
    message: 'Pas encore actif. Dans Vercel, variable AMC_ACCESS_JSON, collez la valeur ci-dessous (fusionnez-la si d’autres mails y sont déjà), puis redéployez. Le portail enverra ensuite ce mail directement ici.',
    snippet: JSON.stringify({ [address]: { role: 'membre', password: String(password) } })
  };
}

async function removeMember(email) {
  const address = String(email || '').trim().toLowerCase();
  if (!validEmail(address) || adminEmails().has(address)) {
    return { saved: false, status: 400, message: 'Cette adresse ne se retire pas ici.' };
  }
  if (!supabaseEnv()) {
    return { saved: false, status: 501, message: 'Retirez cette adresse de AMC_MEMBER_EMAILS ou de AMC_ACCESS_JSON, puis redéployez.' };
  }
  try {
    const res = await supabaseFetch('/rest/v1/amc_operators?email=eq.' + encodeURIComponent(address) + '&role=eq.membre', { method: 'DELETE' });
    if (res && res.ok) return { saved: true, status: 200, message: 'Adresse retirée.' };
  } catch (err) { /* message ci-dessous */ }
  return { saved: false, status: 502, message: 'Retrait impossible pour le moment.' };
}

module.exports = {
  classify,
  checkLogin,
  signSession,
  readToken,
  readSession,
  cookieHeader,
  clearCookie,
  noStore,
  send,
  readBody,
  queryEmail,
  cors,
  listMembers,
  addMember,
  removeMember,
  secret,
  itemsFor,
  itemAllowed,
  pagesForAccount
};
