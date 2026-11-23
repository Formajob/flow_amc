(function () {
  const KEY = 'flow-amc-demo-v2';
  const ITEMS = [
    { id: 'pantalons', label: 'Pantalons' },
    { id: 'pulls', label: 'Pulls en laine' },
    { id: 'pyjamas', label: 'Pyjamas' },
    { id: 'peignoirs', label: 'Peignoirs' },
    { id: 'djellaba_f', label: 'Djellabas femmes' },
    { id: 'djellaba_h', label: 'Djellabas hommes' },
    { id: 'jackets', label: 'Jackets' },
    { id: 'manteaux', label: 'Manteaux' },
    { id: 'chales', label: 'Châles' },
    { id: 'couverture', label: 'Couverture' },
    { id: 'livres', label: 'Livres' },
    { id: 'argent', label: 'Dons', money: true },
    { id: 'paniers', label: 'Paniers', activity: true },
    { id: 'paniers2', label: 'Panier 2', activity: true },
    { id: 'tri', label: 'Tri', activity: true },
    { id: 'deplacement', label: 'Déplacement', activity: true }
  ];
  const ITEM_SCOPE = {
    'mohamedyahyajbir@gmail.com': { deny: ['livres'] },
    'marouaabid1607@gmail.com': { allow: ['livres'] }
  };
  function visibleItems() {
    const email = String((session && session.email) || '').toLowerCase();
    if (session && Array.isArray(session.items)) return ITEMS.filter((it) => session.items.indexOf(it.id) >= 0);
    const scope = ITEM_SCOPE[email];
    if (!scope) return ITEMS;
    if (scope.allow) return ITEMS.filter((it) => scope.allow.indexOf(it.id) >= 0);
    if (scope.deny) return ITEMS.filter((it) => scope.deny.indexOf(it.id) < 0);
    return ITEMS;
  }
  function itemAllowed(id) {
    return visibleItems().some((it) => it.id === id);
  }
  const GROUPS = [
    { id: 'A', label: 'Groupe A', color: '#0b1330', members: [['safaa', 'Safaa'], ['yahya', 'Yahya'], ['nour', 'Nour'], ['fatiha', 'Fatiha'], ['badr', 'Badr'], ['nadia', 'Nadia']] },
    { id: 'B', label: 'Groupe B', color: '#0aa8bd', members: [['zineb', 'Zineb'], ['hamza', 'Hamza'], ['aicha', 'Aicha'], ['yusur', 'Yusur'], ['salma', 'Salma'], ['moncef', 'Moncef']] },
    { id: 'C', label: 'Groupe C', color: '#c9842a', members: [['yassir', 'Yassir'], ['bouchra', 'Bouchra'], ['zakaria', 'Zakaria'], ['mouhcine', 'Mouhcine'], ['maroua', 'Maroua'], ['wissal', 'Wissal']] },
    { id: 'D', label: 'Groupe D', color: '#3c5a8a', members: [['bouchra', 'Bouchra'], ['hasnaa', 'Hasnaa'], ['ilyass', 'Ilyass'], ['mohamed', 'Mohamed'], ['ahmed', 'Ahmed'], ['malak', 'Malak']] },
    { id: 'E', label: 'Groupe E', color: '#873cf4', members: [['ashraf', 'Ashraf'], ['chaymaa', 'Chaymaa'], ['salma_harama', 'Salma Harama'], ['ali_bousfiha', 'Ali Bousfiha']] }
  ];
  const DEFAULT_TARGETS = {
    pantalons: 120, pulls: 120, pyjamas: 80, peignoirs: 40, djellaba_f: 40,
    djellaba_h: 40, jackets: 60, manteaux: 48, chales: 80, couverture: 0, livres: 0, argent: 20000, paniers: 0, paniers2: 0, tri: 0, deplacement: 0
  };
  const RATES = { A: 0.58, B: 0.46, C: 0.72, D: 0.31, E: 0.44 };
  const WEIGHTS = [1.35, 1.15, 0.95, 0.8, 0.62, 0.38];

  function memberName(groupId, memberId) {
    const g = GROUPS.find((x) => x.id === groupId);
    const m = g && g.members.find((x) => x[0] === memberId);
    return m ? m[1] : '—';
  }
  function itemOf(id) { return ITEMS.find((x) => x.id === id); }
  function fmt(n) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(n) || 0); }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function panierPoints(n) {
    const q = Math.max(0, Number(n) || 0);
    return Math.min(q, 2) * 3 + Math.max(0, q - 2) * 4;
  }
  function couverturePoints(n) {
    const q = Math.max(0, Number(n) || 0);
    return Math.min(q, 3) * 3 + Math.max(0, q - 3) * 4;
  }
  function pts(row, money) {
    const clothes = row && typeof row === "object" ? Number(row.clothes) || 0 : Number(row) || 0;
    const books = row && typeof row === "object" ? Number(row.books) || 0 : 0;
    const covers = row && typeof row === "object" ? Number(row.couverture) || 0 : 0;
    const couvertureScore = row && typeof row === "object" && row.couvertureScore != null ? Number(row.couvertureScore) || 0 : couverturePoints(covers);
    const cash = row && typeof row === "object" ? Number(row.money) || 0 : Number(money) || 0;
    const baskets = row && typeof row === "object" && row.panierScore != null ? Number(row.panierScore) : panierPoints(row && row.paniers);
    const baskets2 = row && typeof row === "object" ? Number(row.paniers2) || 0 : 0;
    const tri = row && typeof row === "object" ? Number(row.tri) || 0 : 0;
    const move = row && typeof row === "object" ? Number(row.deplacement) || 0 : 0;
    return clothes / 10 + books / 5 + couvertureScore + cash / 50 + baskets + baskets2 * 2 + tri * 5 + move;
  }
  function pct(n, d) { return d > 0 ? Math.max(0, Math.round((n / d) * 100)) : 0; }
  function daysLeft() {
    const end = new Date(2026, 11, 26);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((end - now) / 86400000);
  }

  function seedEntries() {
    const entries = [];
    let n = 1;
    const wsum = WEIGHTS.reduce((a, b) => a + b, 0);
    GROUPS.forEach((g) => {
      g.members.forEach((m, i) => {
        const share = WEIGHTS[i] / wsum;
        ITEMS.forEach((it) => {
          const slice = DEFAULT_TARGETS[it.id] / GROUPS.length;
          const qty = Math.round(slice * RATES[g.id] * share);
          if (!qty) return;
          entries.push({
            id: 'seed-' + n,
            at: '2026-10-' + String(24 + (n % 5)).padStart(2, '0') + 'T10:00:00',
            group: g.id,
            member: m[0],
            item: it.id,
            qty: qty,
            demo: true
          });
          n += 1;
        });
      });
    });
    return entries;
  }

  function fresh(demo) {
    return {
      v: 2,
      targets: Object.assign({}, DEFAULT_TARGETS),
      entries: demo ? seedEntries() : [],
      prep: {},
      transport: { charge: false, depart: false, azilal: false, ilissi: false, lead1: '', lead2: '' },
      distribution: { households: 0, closed: false, lines: {} },
      notices: defaultNotices()
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh(false);
      const s = JSON.parse(raw);
      if (!s || s.v !== 2) return fresh(false);
      s.targets = Object.assign({}, DEFAULT_TARGETS, s.targets || {});
      s.entries = (Array.isArray(s.entries) ? s.entries : []).filter((e) => !e.demo);
      s.prep = s.prep || {};
      s.transport = Object.assign({ charge: false, depart: false, azilal: false, ilissi: false, lead1: '', lead2: '' }, s.transport || {});
      s.distribution = Object.assign({ households: 0, closed: false, lines: {} }, s.distribution || {});
      if (!Array.isArray(s.notices)) s.notices = defaultNotices();
      return s;
    } catch (e) {
      return fresh(false);
    }
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }
  function resetDemo() { const s = fresh(true); save(s); return s; }
  function zero() { const s = fresh(false); save(s); return s; }

  function stats(s) {
    const byGroup = {};
    const byMember = {};
    const byItem = {};
    GROUPS.forEach((g) => {
      byGroup[g.id] = { pieces: 0, clothes: 0, books: 0, couverture: 0, couvertureScore: 0, paniers: 0, paniers2: 0, tri: 0, deplacement: 0, money: 0, items: {} };
      byMember[g.id] = {};
      g.members.forEach((m) => { byMember[g.id][m[0]] = { pieces: 0, clothes: 0, books: 0, couverture: 0, paniers: 0, paniers2: 0, tri: 0, deplacement: 0, money: 0, name: m[1] }; });
    });
    ITEMS.forEach((it) => { byItem[it.id] = 0; });
    const panierQty = {};
    const couvertureQty = {};
    s.entries.forEach((e) => {
      if (!byGroup[e.group] || byItem[e.item] == null) return;
      const q = Number(e.qty) || 0;
      if (e.item === 'argent') {
        byGroup[e.group].money += q;
        byItem.argent += q;
        if (byMember[e.group][e.member]) byMember[e.group][e.member].money += q;
      } else if (e.item === 'paniers' || e.item === 'paniers2' || e.item === 'tri' || e.item === 'deplacement') {
        byGroup[e.group][e.item] += q;
        byGroup[e.group].items[e.item] = (byGroup[e.group].items[e.item] || 0) + q;
        byItem[e.item] += q;
        if (byMember[e.group][e.member]) byMember[e.group][e.member][e.item] += q;
        if (e.item === 'paniers') panierQty[e.group + '|' + e.member] = (panierQty[e.group + '|' + e.member] || 0) + q;
      } else if (e.item === 'couverture') {
        byGroup[e.group].couverture += q;
        byGroup[e.group].pieces += q;
        byGroup[e.group].items.couverture = (byGroup[e.group].items.couverture || 0) + q;
        byItem.couverture += q;
        if (byMember[e.group][e.member]) {
          byMember[e.group][e.member].couverture += q;
          byMember[e.group][e.member].pieces += q;
        }
        const key = e.group + '|' + e.member;
        couvertureQty[key] = (couvertureQty[key] || 0) + q;
      } else {
        const kind = e.item === 'livres' ? 'books' : 'clothes';
        byGroup[e.group][kind] += q;
        byGroup[e.group].pieces += q;
        byGroup[e.group].items[e.item] = (byGroup[e.group].items[e.item] || 0) + q;
        byItem[e.item] += q;
        if (byMember[e.group][e.member]) {
          byMember[e.group][e.member][kind] += q;
          byMember[e.group][e.member].pieces += q;
        }
      }
    });
    Object.keys(panierQty).forEach((key) => {
      const group = key.split('|')[0];
      if (byGroup[group]) byGroup[group].panierScore = (byGroup[group].panierScore || 0) + panierPoints(panierQty[key]);
    });
    Object.keys(couvertureQty).forEach((key) => {
      const group = key.split('|')[0];
      if (byGroup[group]) byGroup[group].couvertureScore += couverturePoints(couvertureQty[key]);
    });
    const pieceTarget = ITEMS.filter((it) => !it.money && !it.activity).reduce((sum, it) => sum + (Number(s.targets[it.id]) || 0), 0);
    const pieces = ITEMS.filter((it) => !it.money && !it.activity).reduce((sum, it) => sum + byItem[it.id], 0);
    const money = byItem.argent;
    const moneyTarget = Number(s.targets.argent) || 0;
    const ranked = GROUPS.map((g) => {
      const row = byGroup[g.id];
      return { id: g.id, label: g.label, color: g.color, pieces: row.pieces, money: row.money, score: pts(row) };
    }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    return { byGroup, byMember, byItem, pieces, pieceTarget, money, moneyTarget, ranked };
  }

  function addEntry(group, member, item, qty) {
    if (role() !== 'admin' && role() !== 'saisie') return load();
    const s = load();
    const q = Number(qty);
    if (!group || !member || !item || !q) return s;
    s.entries.push({ id: 'e' + Date.now(), at: new Date().toISOString(), group, member, item, qty: q, demo: false });
    save(s);
    return s;
  }
  function undo() {
    if (role() !== 'admin' && role() !== 'saisie') return load();
    const s = load();
    for (let i = s.entries.length - 1; i >= 0; i -= 1) {
      if (!s.entries[i].demo) { s.entries.splice(i, 1); break; }
    }
    save(s);
    return s;
  }
  function setTarget(id, qty) {
    if (role() !== 'admin') return load();
    const s = load();
    s.targets[id] = Math.max(0, Number(qty) || 0);
    save(s);
    return s;
  }
  function setPrep(id, field, qty) {
    if (role() !== 'admin') return load();
    const s = load();
    s.prep[id] = s.prep[id] || {};
    if (field === 'note') s.prep[id].note = String(qty || '').slice(0, 240);
    else s.prep[id][field] = Math.max(0, Number(String(qty).replace(',', '.')) || 0);
    save(s);
    return s;
  }
  function setTransport(patch) {
    if (role() !== 'admin') return load();
    const s = load();
    Object.assign(s.transport, patch);
    save(s);
    return s;
  }
  function setDistribution(patch) {
    if (role() !== 'admin') return load();
    const s = load();
    Object.assign(s.distribution, patch);
    save(s);
    return s;
  }
  function setDistLine(id, field, qty) {
    if (role() !== 'admin') return load();
    const s = load();
    s.distribution.lines[id] = s.distribution.lines[id] || {};
    s.distribution.lines[id][field] = Math.max(0, Number(qty) || 0);
    save(s);
    return s;
  }

  function defaultNotices() {
    return [
      { id: 'n1', title: 'Collecte ouverte', body: 'La collecte d’hiver est ouverte. Pantalons, pulls en laine, pyjamas, peignoirs, djellabas, jackets, manteaux, châles, couvertures et dons.', at: '2026-10-24T09:00:00', author: 'Admin' },
      { id: 'n2', title: 'Rappel de la caravane', body: 'Douar Ilissi, région d’Azilal, les 26 et 27 décembre 2026. Merci de transmettre les quantités au poste de saisie.', at: '2026-10-26T18:00:00', author: 'Admin' }
    ];
  }
  let session = null;
  const readyWaiters = [];
  let booted = false;
  function profile() {
    if (!session) return null;
    return { full_name: session.name || '', email: session.email || '', role: role() };
  }
  function bindNav() {
    const side = document.querySelector('.side');
    const btn = document.querySelector('[data-nav]');
    if (!side || !btn || btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const open = side.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-open', open);
    });
    side.querySelectorAll('nav a').forEach((link) => {
      link.addEventListener('click', () => {
        side.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }
  function role() {
    if (session && (session.role === 'admin' || session.role === 'saisie')) return session.role;
    return 'membre';
  }
  function onReady(fn) {
    if (booted) fn(session);
    else readyWaiters.push(fn);
  }
  function addNotice(title, body) {
    if (role() !== 'admin') return load();
    const s = load();
    s.notices.unshift({ id: 'n' + Date.now(), title: title.trim(), body: body.trim(), at: new Date().toISOString(), author: 'Admin' });
    save(s);
    return s;
  }
  function removeNotice(id) {
    if (role() !== 'admin') return load();
    const s = load();
    s.notices = s.notices.filter((n) => n.id !== id);
    save(s);
    return s;
  }
  function series(s) {
    const map = {};
    s.entries.forEach((e) => {
      if (e.item === 'argent') return;
      const day = String(e.at || '').slice(0, 10);
      if (!day) return;
      map[day] = (map[day] || 0) + (Number(e.qty) || 0);
    });
    let acc = 0;
    return Object.keys(map).sort().map((d) => {
      acc += map[d];
      return { day: d, add: map[d], acc: acc };
    });
  }
  function shareText(groupId) {
    const s = load();
    const st = stats(s);
    const g = GROUPS.find((x) => x.id === groupId);
    const lines = g.members.map((m) => {
      const row = st.byMember[g.id][m[0]];
      return { name: m[1], pieces: row.pieces, money: row.money, score: pts(row) };
    }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'));
    const head = 'Classement ' + g.label + ' · Caravane AMC · 11e édition';
    const body = lines.map((row, i) => (i + 1) + '. ' + row.name + ' — ' + fmt(row.pieces) + ' pcs · ' + fmt(row.money) + ' MAD · ' + fmt(row.score) + ' pts').join('\n');
    const done = pct(st.byGroup[g.id].pieces, Math.round(st.pieceTarget / GROUPS.length));
    return head + '\n' + body + '\nObjectif du groupe : ' + done + ' % des pièces.\nDouar Ilissi · 26-27 déc. 2026';
  }

  function when(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function finish(next) {
    const cleanRole = next.role === 'admin' || next.role === 'saisie' ? next.role : 'membre';
    const yassirPages = ['index.html', 'collecte.html', 'preparation.html', 'transport.html', 'distribution.html', 'classement.html', 'communiques.html'];
    const email = String(next.email || '').toLowerCase();
    const pages = cleanRole !== 'saisie' ? null : (email === 'yassirkrami01@gmail.com' ? yassirPages : ((Array.isArray(next.pages) && next.pages.length ? next.pages : ['collecte.html', 'communiques.html']).filter((href) => href !== 'administration.html')));
    session = { email: String(next.email || '').toLowerCase(), name: next.name || '', role: cleanRole, pages: pages, items: Array.isArray(next.items) ? next.items : null };
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (pages && pages.indexOf(here) === -1) {
      location.replace('collecte.html');
      return;
    }
    booted = true;
    document.documentElement.classList.add('unlocked');
    document.body.classList.remove('role-admin', 'role-membre', 'role-saisie');
    document.body.classList.add('role-' + role());
    const who = document.querySelector('[data-who]');
    const label = role() === 'admin' ? 'Admin' : (role() === 'saisie' ? 'Saisie' : 'Membre');
    window.__AMC_PROFILE = { full_name: session.name || '', email: session.email || '', role: role() };
    if (who) who.textContent = (session.name || session.email) + ' · ' + label;
    const hello = document.querySelector('[data-hello]');
    if (hello) {
      const name = session.name || String(session.email || '').split('@')[0] || 'à vous';
      hello.innerHTML = 'Bonjour ' + esc(name) + ' <span class="role-pill">' + label + '</span>';
    }
    paintSession();
    if (pages) {
      document.querySelectorAll('.side a[href]').forEach((link) => {
        const href = (link.getAttribute('href') || '').split('?')[0];
        if (pages.indexOf(href) === -1) link.hidden = true;
      });
    }
    const toggle = document.querySelector('[data-toggle]');
    if (toggle && !toggle.dataset.bound) {
      toggle.dataset.bound = '1';
      toggle.addEventListener('click', () => toggle.parentElement.classList.toggle('open'));
    }
    const out = document.querySelector('[data-logout]');
    if (out && !out.dataset.bound) {
      out.dataset.bound = '1';
      out.addEventListener('click', logout);
    }
    if (role() !== 'admin') {
      const main = document.querySelector('.main');
      if (main && !main.querySelector('.consult')) {
        const note = document.createElement('p');
        note.className = 'consult';
        note.textContent = role() === 'saisie'
          ? 'Saisie ouverte sur la collecte. Les communiqués sont en consultation.'
          : 'Vue membre. Consultation seulement : les saisies, les objectifs et la publication restent à l’admin.';
        main.prepend(note);
      }
    }
    readyWaiters.splice(0).forEach((fn) => fn(session));
    requestAnimationFrame(() => document.body.classList.add('ready'));
  }
  async function logout() {
    try { await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' }); } catch (err) { /* ignore */ }
    location.href = 'index.html';
  }
  function showGate(prefill) {
    if (document.querySelector('.gate')) return;
    const host = document.createElement('main');
    host.className = 'gate access';
    host.innerHTML = '<section class="panel"><div class="inner"><div class="brand"><b>ACX Flow</b><span>By <a href="https://acx.ma/">ACX Maroc</a></span></div><div class="kicker" style="margin-top:48px"><i></i> Espace AMC</div><h1>La chaleur humaine,<br><em>au même rythme.</em></h1></div><div class="inner support-line">support@acx.ma · <a href="https://flow.acx.ma/">flow.acx.ma</a> · <a href="tel:+212634232006">+212 634 232 006</a></div></section><section class="access-main"><form class="access-card" id="gate-form"><div class="kicker"><i></i> Connexion</div><h2>Entrer dans l’espace</h2><p class="lead">L’admin ouvre l’administration. Un mail membre autorisé ouvre la consultation. Aucun autre espace ne s’affiche.</p><label>Adresse e-mail<input id="gate-email" type="email" autocomplete="username" required></label><label>Mot de passe<input id="gate-password" type="password" autocomplete="current-password" required></label><p class="gate-error" id="gate-error" role="alert"></p><button class="btn" type="submit">Entrer</button></form></section>';
    document.body.prepend(host);
    const emailInput = host.querySelector('#gate-email');
    if (emailInput && prefill) emailInput.value = prefill;
    host.querySelector('#gate-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = host.querySelector('#gate-email').value.trim().toLowerCase();
      const password = host.querySelector('#gate-password').value;
      const err = host.querySelector('#gate-error');
      const btn = host.querySelector('button');
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Vérification…';
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          err.textContent = data.message || 'Accès refusé.';
          btn.disabled = false;
          btn.textContent = 'Entrer';
          return;
        }
        host.remove();
        const url = new URL(location.href);
        url.searchParams.delete('email');
        url.searchParams.delete('from');
        url.searchParams.delete('role');
        history.replaceState({}, '', url.pathname + (url.search || ''));
        finish(data);
      } catch (failure) {
        err.textContent = 'La vérification ne répond pas. Ouvrez l’espace déployé, pas une copie locale.';
        btn.disabled = false;
        btn.textContent = 'Entrer';
      }
    });
  }
  async function refreshMembers() {
    try {
      const res = await fetch('/api/members', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.members)) return;
      memberRows = data.members;
      const by = { A: [], B: [], C: [], D: [], E: [] };
      data.members.forEach((m) => { if (by[m.group]) by[m.group].push([m.id, m.name]); });
      GROUPS.forEach((g) => { g.members = by[g.id] || []; });
    } catch (err) { /* liste locale */ }
  }
  let memberRows = [];
  let photoBook = { access: {}, members: {}, linked: {}, accessList: [], ready: false };
  function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return (parts.map((part) => part[0]).join('') || '?').toUpperCase();
  }
  function accessPhoto(email) {
    return photoBook.access[String(email || '').toLowerCase()] || '';
  }
  function roster() { return memberRows.slice(); }
  function photoCatalog() { return photoBook; }
  function memberPhoto(group, slug) {
    const key = String(group || '') + '-' + String(slug || '');
    if (photoBook.members[key]) return photoBook.members[key];
    const email = photoBook.linked[key];
    return email ? accessPhoto(email) : '';
  }
  function paintSession() {
    if (!session) return;
    const url = accessPhoto(session.email);
    const name = session.name || session.email;
    paintFace(document.querySelector('[data-face]'), url, name);
    paintFace(document.querySelector('[data-session-face]'), url, name);
  }
  function paintFace(el, url, name) {
    if (!el) return;
    el.replaceChildren();
    if (url) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = url;
      el.appendChild(img);
    } else {
      el.textContent = initials(name);
    }
  }
  async function refreshPhotos() {
    try {
      const res = await fetch('/api/photos', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = await res.json();
      photoBook = {
        access: data.access || {},
        members: data.members || {},
        linked: data.linked || {},
        accessList: data.accessList || [],
        ready: true
      };
    } catch (err) { /* photos locales */ }
  }
  async function refreshPrep() {
    try {
      const res = await fetch('/api/prep', { credentials: 'same-origin' });
      if (!res.ok) return load();
      const data = await res.json();
      const s = load();
      const prep = {};
      (data.lines || []).forEach((line) => {
        prep[line.item] = { ready: Number(line.ready) || 0, rejected: Number(line.rejected) || 0, note: line.note || '' };
      });
      s.prep = prep;
      s.prepUpdatedAt = data.updatedAt || '';
      save(s);
      return s;
    } catch (err) {
      return load();
    }
  }
  async function refresh() {
    try {
      const res = await fetch('/api/entries', { credentials: 'same-origin' });
      if (!res.ok) return load();
      const data = await res.json();
      const s = load();
      s.entries = Array.isArray(data.entries) ? data.entries : [];
      save(s);
      return s;
    } catch (err) {
      return load();
    }
  }
  async function boot() {
    document.documentElement.classList.add('unlocked');
    document.body.classList.add('ready');
    bindNav();
    const params = new URLSearchParams(location.search);
    if (params.get('role')) {
      const url = new URL(location.href);
      url.searchParams.delete('role');
      history.replaceState({}, '', url.pathname + (url.search || ''));
    }
    try {
      const res = await fetch('/api/session', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.email && (data.role === 'admin' || data.role === 'membre' || data.role === 'saisie')) {
          const photosPromise = refreshPhotos();
          await Promise.all([refresh(), refreshMembers(), refreshPrep()]);
          finish(data);
          await photosPromise;
          paintSession();
          document.dispatchEvent(new Event('amc-photos'));
          return;
        }
      }
    } catch (err) { /* porte */ }
    showGate('');
  }
  window.AMC = {
    ITEMS, GROUPS, DEFAULT_TARGETS, load, save, resetDemo, zero, stats, addEntry, undo,
    setTarget, setPrep, setTransport, setDistribution, setDistLine, shareText, series,
    addNotice, removeNotice, role, profile, onReady, when, refresh, refreshMembers, refreshPrep, refreshPhotos, memberPhoto, initials, roster, photoCatalog,
    memberName, itemOf, fmt, esc, pts, couverturePoints, pct, daysLeft, visibleItems, itemAllowed
  };
  boot();
})();
