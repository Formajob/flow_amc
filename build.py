from pathlib import Path

root = Path(__file__).resolve().parent
css = root.joinpath('demo.css').read_text(encoding='utf-8')
js = root.joinpath('demo.js').read_text(encoding='utf-8')

def page(title, body, extra=''):
    boot = ''
    if extra.strip():
        boot = 'AMC.onReady(function () {\n' + extra + '\n});\n'
    return f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b1330">
  <title>{title}</title>
  <style>
{css}
  </style>
</head>
<body>
{body}
<noscript><p style="padding:24px;font-family:sans-serif">Activez JavaScript pour entrer dans l’espace AMC.</p></noscript>
<script>
{js}
{boot}
</script>
<script src="support-widget.js"></script>
</body>
</html>
'''

def side(active):
    ico = {
        'board': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>',
        'flag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4"/><path d="M5 4h11l-1.5 3.5L16 11H5"/></svg>',
        'box': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/></svg>',
        'truck': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
        'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/></svg>',
        'cup': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h8v6a4 4 0 0 1-8 0z"/><path d="M15 6h3a2 2 0 0 1 0 4h-3"/><path d="M8 20h8"/><path d="M12 14v6"/></svg>',
        'msg': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 6h14v9H8l-3 3z"/></svg>',
        'admin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 19c1.2-3 3.4-4.5 7-4.5s5.8 1.5 7 4.5"/></svg>',
    }
    stages = [
        ('collecte.html', 'Collecte', ico['box']),
        ('preparation.html', 'Préparation', ico['flag']),
        ('transport.html', 'Transport', ico['truck']),
        ('distribution.html', 'Distribution', ico['home']),
    ]
    subs = []
    for href, label, icon in stages:
        on = ' class="on"' if href == active else ''
        subs.append(f'<a href="{href}"{on}><span class="nav-ico">{icon}</span>{label}</a>')
    def link(href, label, icon):
        on = ' class="on"' if href == active else ''
        return f'<a href="{href}"{on}><span class="nav-ico">{icon}</span>{label}</a>'
    return f"""<aside class="side">
    <div class="brand"><img class="brand-logo" src="logo.png" alt="ACX Flow"></div>
    <button type="button" class="nav-toggle" data-nav aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <div class="space"><i></i> Espace AMC</div>
    <nav>
      {link('index.html', 'Tableau de bord', ico['board'])}
      <div class="nav-group open">
        <button type="button" data-toggle><span class="nav-ico">{ico['flag']}</span>Campagne <span class="chev">›</span></button>
        <div class="sub"><div>{''.join(subs)}</div></div>
      </div>
      {link('classement.html', 'Classement', ico['cup'])}
      {link('communiques.html', 'Communiqués', ico['msg'])}
      {link('administration.html', 'Administration', ico['admin'])}
    </nav>
    <div class="role" aria-label="Session">
      <span class="session-face" data-session-face></span>
      <span class="session-who" data-who></span>
      <button type="button" data-logout>Quitter</button>
    </div>
    <div class="foot">Caravane humanitaire · 11e édition<br>Douar Ilissi · 26-27 déc. 2026</div>
  </aside>"""

def shell(active, main):
    return f'<div class="app">{side(active)}<main class="main">{main}</main></div>'

index = page('ACX Flow · AMC', '''
<main class="access">
  <section class="panel">
    <div class="inner">
      <div class="brand"><b>ACX Flow</b><span>By <a href="https://acx.ma/">ACX Maroc</a></span></div>
      <div class="kicker" style="margin-top:48px"><i></i> Espace AMC</div>
      <h1>La chaleur humaine,<br><em>au même rythme.</em></h1>
      <p>Association Morocco's Creativity. Caravane humanitaire, 11e édition. Douar Ilissi, région d'Azilal, les 26 et 27 décembre 2026.</p>
      <div class="points">
        <div><b>1 · Collecte</b><span>Quatre groupes, vêtements et dons. Saisie au fil de l'eau.</span></div>
        <div><b>2 · Préparation et convoi</b><span>Tri, écart, chargement, route vers Azilal.</span></div>
        <div><b>3 · Distribution</b><span>Lots remis, reste, clôture. Pas de liste de familles dans l'outil.</span></div>
      </div>
    </div>
    <div class="inner" style="color:#9eb0c8;font-size:12px">support@acx.ma · flow.acx.ma · +212 634 232 006</div>
  </section>
  <section class="access-main">
    <div class="access-card">
      <div class="kicker"><i></i> Espace AMC</div>
      <h2>Entrer dans l'espace</h2>
      <p class="lead">L'accès se fait depuis la page login Flow, puis le mot de passe de cet espace.</p>
      <a class="btn" href="index.html">Ouvrir la connexion</a>
      <div class="links">
        <a href="collecte.html">Collecte <span>→</span></a>
        <a href="preparation.html">Préparation <span>→</span></a>
        <a href="transport.html">Transport <span>→</span></a>
        <a href="distribution.html">Distribution <span>→</span></a>
        <a href="classement.html">Classement <span>→</span></a>
        <a href="communiques.html">Communiqués <span>→</span></a>
      </div>
    </div>
  </section>
</main>
''')

dashboard = page('Tableau de bord · AMC', shell('index.html', f'''
  <div class="head-row">
    <div class="hello-block">
      <span class="profile-face" data-face></span>
      <div>
      <div class="kicker"><i></i> AMC · Caravane 11</div>
      <h1 class="hello" data-hello>Bonjour</h1>
      <p class="lead">Avancement des cinq groupes, total contre l'objectif, et classement à envoyer dans le groupe de l'association.</p>
      </div>
    </div>
    <a class="btn noprint" href="classement.html">Ouvrir le classement à partager</a>
  </div>
  <div class="stepper" id="steps"></div>
  <section class="stats" id="kpis"></section>
  <section class="card" style="margin-bottom:12px">
    <h2>Volume par groupe</h2>
    <p class="sub">50 MAD = 1 point. 10 vêtements = 1 point. 5 livres = 1 point. Couvertures : par personne, 3 points chacune pour les 3 premières, puis 4 points par couverture à partir de la 4e. 1er et 2e panier : 3 points chacun, puis 4 points. Panier 2 : 2 points chacun. Tri : 5 points. Déplacement : 1 point.</p>
    <div class="vol-grid" id="groups"></div>
  </section>
  <section class="card" style="margin-top:12px">
    <h2>Objectifs</h2>
    <p class="sub">À saisir ou modifier. Chaque groupe a la même part de l'objectif, pour que le classement reste comparable.</p>
    <div id="targets"></div>
  </section>
'''), '''
function render() {
  const s = AMC.load();
  const st = AMC.stats(s);
  const days = AMC.daysLeft();
  const piecePct = AMC.pct(st.pieces, st.pieceTarget);
  const moneyPct = AMC.pct(st.money, st.moneyTarget);
  document.getElementById('steps').innerHTML = [
    ['1', 'Collecte', 'En cours', true],
    ['2', 'Préparation et convoi', 'À ouvrir après la collecte', false],
    ['3', 'Distribution', '26-27 déc. 2026', false]
  ].map((x) => '<article class="step' + (x[3] ? ' now' : '') + '"><small>Étape ' + x[0] + '</small><b>' + x[1] + '</b><span>' + x[2] + '</span></article>').join('');
  document.getElementById('kpis').innerHTML = [
    [AMC.fmt(st.pieces), 'Pièces collectées', piecePct + ' % de l\\'objectif'],
    [AMC.fmt(st.money) + ' MAD', 'Dons', moneyPct + ' % de l\\'objectif'],
    [piecePct + ' %', 'Avancement pièces', 'Objectif ' + AMC.fmt(st.pieceTarget)],
    [days >= 0 ? String(days) : '0', days >= 0 ? 'Jours avant le 26 déc.' : 'Date de caravane passée', 'Douar Ilissi']
  ].map((x) => '<article class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span><em>' + x[2] + '</em></article>').join('');
  const share = Math.max(1, AMC.GROUPS.length);
  document.getElementById('groups').innerHTML = st.ranked.map((g, i) => {
    const target = Math.round(st.pieceTarget / share);
    const p = AMC.pct(g.pieces, target);
    return '<article class="card gcard"><span class="tag" style="background:' + g.color + '">' + (i + 1) + '</span><h2 style="margin-top:8px">' + g.label + '</h2><div class="bar"><i style="--w:' + Math.min(p, 100) + '%;background:' + g.color + '"></i></div><div class="meta"><span>' + AMC.fmt(g.pieces) + ' pcs</span><span>' + AMC.fmt(g.money) + ' MAD</span></div><div class="meta"><span>' + p + ' % de la part</span><b>' + AMC.fmt(g.score) + ' pts</b></div></article>';
  }).join('');
    document.getElementById('targets').innerHTML = '<div class="split">' + AMC.ITEMS.map((it) => '<label>' + it.label + '<input data-target="' + it.id + '" type="number" min="0" value="' + (s.targets[it.id] || 0) + '"></label>').join('') + '</div>';
}
document.getElementById('targets').addEventListener('change', (e) => {
  const id = e.target.getAttribute('data-target');
  if (id) { AMC.setTarget(id, e.target.value); render(); }
});
render();
''')

collecte = page('Collecte · AMC', shell('collecte.html', """
  <div class="kicker"><i></i> Étape 1 · Collecte</div>
  <h1>Saisie</h1>
  <p class="lead">Enregistrez une quantité réelle. Elle part dans la base FLOW, puis le tableau de bord et le classement la relisent.</p>
  <div class="grid-2">
    <section class="card writes">
      <h2 id="form-title">Nouvelle saisie</h2>
      <form class="form" id="form">
        <input id="edit-id" type="hidden" value="">
        <div class="split">
          <label>Groupe<select id="group"></select></label>
          <label>Membre<select id="member"></select></label>
        </div>
        <div class="split">
          <label>Article<select id="item"></select></label>
          <label>Quantité<input id="qty" type="number" inputmode="decimal" step="any" value="1" required></label>
        </div>
        <div class="qty-picks" id="picks">
          <button type="button" data-qty="1">+1</button>
          <button type="button" data-qty="5">+5</button>
          <button type="button" data-qty="10">+10</button>
        </div>
        <label>Note, facultative<input id="note" maxlength="240" placeholder="Exemple : sac reçu le matin"></label>
        <div class="row">
          <button class="btn" type="submit" id="save">Enregistrer</button>
          <button class="ghost" type="button" id="cancel" hidden>Annuler</button>
        </div>
        <p class="note" id="msg"></p>
      </form>
    </section>
    <section class="card">
      <h2>Score du moment</h2>
      <p class="sub" id="live-note">Lu dans la base, pas sur cet appareil.</p>
      <div id="live"></div>
    </section>
  </div>
  <section class="card" style="margin-top:12px">
    <h2>Saisies</h2>
    <p class="sub">Filtrez, cherchez, puis modifiez ou supprimez une ligne.</p>
    <div class="sheet-filters">
      <label>Recherche<input id="q" type="search" placeholder="Nom, article, note"></label>
      <label>Groupe<select id="filter-group"></select></label>
      <label>Membre<select id="filter-member"></select></label>
      <label>Article<select id="filter-item"></select></label>
    </div>
    <div style="overflow:auto">
      <table class="sheet">
        <thead><tr><th>Date</th><th>Groupe</th><th>Membre</th><th>Article</th><th class="num">Qté</th><th></th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  </section>
"""), """
let rows = [];
function fillMembers() {
  const g = AMC.GROUPS.find((x) => x.id === document.getElementById('group').value);
  document.getElementById('member').innerHTML = g.members.map((m) => '<option value="' + m[0] + '">' + m[1] + '</option>').join('');
}
function fillFilters() {
  document.getElementById('filter-group').innerHTML = '<option value="">Tous les groupes</option>' + AMC.GROUPS.map((g) => '<option value="' + g.id + '">' + g.label + '</option>').join('');
  document.getElementById('filter-item').innerHTML = '<option value="">Tous les articles</option>' + AMC.visibleItems().map((it) => '<option value="' + it.id + '">' + it.label + '</option>').join('');
  fillFilterMembers();
}
function fillFilterMembers() {
  const gid = document.getElementById('filter-group').value;
  const groups = gid ? AMC.GROUPS.filter((g) => g.id === gid) : AMC.GROUPS;
  const opts = ['<option value="">Tous les membres</option>'];
  groups.forEach((g) => g.members.forEach((m) => opts.push('<option value="' + g.id + ':' + m[0] + '">' + g.label + ' · ' + m[1] + '</option>')));
  document.getElementById('filter-member').innerHTML = opts.join('');
}
function resetForm() {
  document.getElementById('edit-id').value = '';
  document.getElementById('form-title').textContent = 'Nouvelle saisie';
  document.getElementById('save').textContent = 'Enregistrer';
  document.getElementById('cancel').hidden = true;
  document.getElementById('qty').value = '1';
  document.getElementById('note').value = '';
  syncQuantityMode();
}
function filtered() {
  const q = document.getElementById('q').value.trim().toLowerCase();
  const fg = document.getElementById('filter-group').value;
  const fm = document.getElementById('filter-member').value;
  const fi = document.getElementById('filter-item').value;
  return rows.filter((e) => {
    if (!AMC.itemAllowed(e.item)) return false;
    if (fg && e.group !== fg) return false;
    if (fi && e.item !== fi) return false;
    if (fm && fm !== e.group + ':' + e.member) return false;
    if (!q) return true;
    const it = AMC.itemOf(e.item);
    const blob = [e.group, AMC.memberName(e.group, e.member), it ? it.label : e.item, e.note, e.author].join(' ').toLowerCase();
    return blob.indexOf(q) >= 0;
  });
}
function render() {
  const s = AMC.load();
  const allowed = {};
  AMC.visibleItems().forEach((it) => { allowed[it.id] = true; });
  const view = Object.assign({}, s, { entries: (s.entries || []).filter((e) => allowed[e.item]) });
  const st = AMC.stats(view);
  const note = document.getElementById('live-note');
  if (note) note.textContent = AMC.visibleItems().length === AMC.ITEMS.length ? 'Lu dans la base, pas sur cet appareil.' : 'Lu dans la base, sur les articles ouverts pour cette session.';
  const share = Math.max(1, AMC.GROUPS.length);
  document.getElementById('live').innerHTML = st.ranked.map((g) => {
    const p = AMC.pct(g.pieces, Math.round(st.pieceTarget / share));
    return '<div style="margin-bottom:10px"><div class="meta"><b>' + g.label + '</b><span>' + AMC.fmt(g.score) + ' pts</span></div><div class="bar"><i style="--w:' + Math.min(p, 100) + '%;background:' + g.color + '"></i></div><div class="meta"><span>' + AMC.fmt(g.pieces) + ' pcs</span><span>' + AMC.fmt(g.money) + ' MAD</span></div></div>';
  }).join('');
  const list = filtered();
  const write = AMC.role() === 'admin' || AMC.role() === 'saisie';
  document.getElementById('rows').innerHTML = list.length ? list.map((e) => {
    const it = AMC.itemOf(e.item);
    const unit = e.item === 'argent' ? ' MAD' : '';
    const actions = write ? '<div class="row-actions"><button class="ghost" type="button" data-edit="' + e.id + '">Modifier</button><button class="ghost" type="button" data-drop="' + e.id + '">Supprimer</button></div>' : '';
    return '<tr><td>' + AMC.when(e.at) + '</td><td>Groupe ' + AMC.esc(e.group) + '</td><td>' + AMC.esc(AMC.memberName(e.group, e.member)) + '</td><td>' + AMC.esc(it ? it.label : e.item) + (e.note ? '<br><span class="hint">' + AMC.esc(e.note) + '</span>' : '') + '</td><td class="num">' + (e.qty > 0 ? '+' : '') + AMC.fmt(e.qty) + unit + '</td><td>' + actions + '</td></tr>';
  }).join('') : '<tr><td colspan="6">Aucune saisie pour ce filtre.</td></tr>';
}
async function reload(message) {
  await AMC.refresh();
  rows = AMC.load().entries || [];
  if (message) document.getElementById('msg').textContent = message;
  render();
}
async function send(method, body, id) {
  const res = await fetch('/api/entries' + (id ? '?id=' + id : ''), {
    method: method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'La base a refusé la saisie.');
  return data;
}
document.getElementById('group').innerHTML = AMC.GROUPS.map((g) => '<option value="' + g.id + '">' + g.label + '</option>').join('');
document.getElementById('item').innerHTML = AMC.visibleItems().map((it) => '<option value="' + it.id + '">' + it.label + '</option>').join('');
AMC.refreshMembers().then(() => { fillMembers(); fillFilters(); });
document.getElementById('group').onchange = fillMembers;
const itemSelect = document.getElementById('item');
const qtyInput = document.getElementById('qty');
function syncQuantityMode() {
  const covers = itemSelect.value === 'couverture';
  qtyInput.step = covers ? '1' : 'any';
  qtyInput.min = covers ? '1' : '';
  qtyInput.inputMode = covers ? 'numeric' : 'decimal';
}
itemSelect.addEventListener('change', syncQuantityMode);
syncQuantityMode();
fillMembers();
fillFilters();
document.getElementById('filter-group').onchange = () => { fillFilterMembers(); render(); };
['q', 'filter-member', 'filter-item'].forEach((id) => document.getElementById(id).addEventListener('input', render));
document.getElementById('picks').onclick = (e) => {
  const n = e.target.getAttribute('data-qty');
  if (n) document.getElementById('qty').value = n;
};
document.getElementById('cancel').onclick = () => { resetForm(); document.getElementById('msg').textContent = ''; };
document.getElementById('form').onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    group: document.getElementById('group').value,
    member: document.getElementById('member').value,
    item: document.getElementById('item').value,
    qty: String(document.getElementById('qty').value || '').trim().replace(',', '.'),
    note: document.getElementById('note').value
  };
  if (!payload.qty || Number.isNaN(Number(payload.qty)) || Number(payload.qty) === 0) {
    document.getElementById('msg').textContent = 'Indiquez une quantité. La virgule est acceptée.';
    document.getElementById('save').disabled = false;
    return;
  }
  if (payload.item === 'couverture' && !Number.isInteger(Number(payload.qty))) {
    document.getElementById('msg').textContent = 'Le nombre de couvertures doit être un entier.';
    document.getElementById('save').disabled = false;
    return;
  }
  if (!AMC.itemAllowed(payload.item)) {
    document.getElementById('msg').textContent = 'Cet article n’est pas ouvert pour cette session.';
    return;
  }
  const id = document.getElementById('edit-id').value;
  document.getElementById('save').disabled = true;
  try {
    await send(id ? 'PATCH' : 'POST', id ? Object.assign({ id: id }, payload) : payload);
    resetForm();
    await reload(id ? 'Saisie modifiée.' : 'Saisie enregistrée dans la base.');
  } catch (err) {
    document.getElementById('msg').textContent = err.message;
  }
  document.getElementById('save').disabled = false;
};
document.getElementById('rows').onclick = async (e) => {
  const edit = e.target.getAttribute('data-edit');
  const drop = e.target.getAttribute('data-drop');
  if (edit) {
    const row = rows.find((x) => String(x.id) === String(edit));
    if (!row) return;
    document.getElementById('edit-id').value = row.id;
    document.getElementById('group').value = row.group;
    fillMembers();
    document.getElementById('member').value = row.member;
    document.getElementById('item').value = row.item;
    syncQuantityMode();
    document.getElementById('qty').value = row.qty;
    document.getElementById('note').value = row.note || '';
    document.getElementById('form-title').textContent = 'Modifier la saisie';
    document.getElementById('save').textContent = 'Modifier';
    document.getElementById('cancel').hidden = false;
    return;
  }
  if (drop && window.confirm('Supprimer cette saisie ?')) {
    try {
      await send('DELETE', null, drop);
      resetForm();
      await reload('Saisie supprimée.');
    } catch (err) {
      document.getElementById('msg').textContent = err.message;
    }
  }
};
reload();
""")

preparation = page('Préparation · AMC', shell('preparation.html', f'''
  <div class="rank-head noprint">
    <div>
      <div class="kicker"><i></i> Étape 2 · Préparation</div>
      <h1>Tri et conditionnement</h1>
      <p class="lead">Le réel est copié du déclaré. Saisissez seulement ce qui est à écarter, et la raison. L'écart se calcule seul.</p>
    </div>
    <div class="extracts">
      <button class="extract extract-report" type="button" id="print-prep">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>
        Rapport
      </button>
    </div>
  </div>
  <section class="card" id="prep-work">
    <h2>Contrôle</h2>
    <p class="sub">Réel = Déclaré − À écarter. Écart = Déclaré − Réel. La raison explique l'écart.</p>
    <div class="prep-scroll">
      <table class="prep-sheet">
        <colgroup>
          <col class="c-article">
          <col class="c-num">
          <col class="c-num">
          <col class="c-edit">
          <col class="c-num">
          <col class="c-note">
        </colgroup>
        <thead><tr><th>Article</th><th class="num">Déclaré</th><th class="num">Réel</th><th class="edit">À écarter</th><th class="num">Écart</th><th class="note">Raison</th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
    <div class="row noprint" style="margin-top:14px">
      <button class="btn" type="button" id="save-prep">Enregistrer</button>
    </div>
    <p class="note" id="prep-msg"></p>
  </section>
  <section id="prep-report" class="prep-report">
    <header class="report-banner">
      <div>
        <div class="report-app">ACX Flow</div>
        <small>By ACX Maroc</small>
      </div>
      <div class="report-banner-side">Rapport de préparation</div>
    </header>
    <section class="assoc">
      <div class="brand-chip"><img src="logo.png" alt="ACX Flow"></div>
      <div>
        <b>Association Morocco's Creativity</b>
        <div class="assoc-meta">Caravane humanitaire, 11e édition · Douar Ilissi, région d'Azilal<br>26 et 27 décembre 2026<br>support@acx.ma · flow.acx.ma · +212 634 232 006</div>
      </div>
    </section>
    <p class="report-meta" id="report-meta"></p>
    <div id="report-body"></div>
  </section>
'''), '''
function rowsOf() {
  const s = AMC.load();
  const st = AMC.stats(s);
  return AMC.ITEMS.filter((it) => !it.money && !it.activity).map((it) => {
    const declared = Number(st.byItem[it.id]) || 0;
    const prep = s.prep[it.id] || {};
    const rejected = Math.max(0, Number(prep.rejected) || 0);
    const ready = Math.max(0, declared - rejected);
    return {
      id: it.id,
      label: it.label,
      declared: declared,
      rejected: rejected,
      ready: ready,
      gap: declared - ready,
      note: prep.note || '',
      over: rejected > declared
    };
  });
}
function render() {
  const s = AMC.load();
  document.getElementById('rows').innerHTML = rowsOf().map((row) => {
    const warn = row.over ? ' style="color:#9b2335"' : '';
    return '<tr><td>' + row.label + '</td><td class="num">' + AMC.fmt(row.declared) + '</td><td class="num">' + AMC.fmt(row.ready) + '</td><td class="edit"><input data-prep="' + row.id + '" data-field="rejected" type="number" min="0" step="any" value="' + row.rejected + '"></td><td class="num"' + warn + '>' + AMC.fmt(row.gap) + '</td><td class="note"><input class="prep-note" data-prep="' + row.id + '" data-field="note" maxlength="240" placeholder="Raison de l’écart" value="' + AMC.esc(row.note) + '"></td></tr>';
  }).join('');
  const msg = document.getElementById('prep-msg');
  if (msg && !msg.dataset.live) msg.textContent = s.prepUpdatedAt ? 'Dernier enregistrement : ' + AMC.when(s.prepUpdatedAt) : 'Pas encore enregistré dans la base.';
}
function fillReport() {
  const s = AMC.load();
  const who = AMC.profile();
  const rows = rowsOf();
  const totals = rows.reduce((sum, row) => {
    sum.declared += row.declared;
    sum.ready += row.ready;
    sum.rejected += row.rejected;
    sum.gap += row.gap;
    return sum;
  }, { declared: 0, ready: 0, rejected: 0, gap: 0 });
  const when = new Date().toLocaleString('fr-FR');
  document.getElementById('report-meta').textContent = 'Extrait le ' + when + (who && who.full_name ? ' · ' + who.full_name : '') + (s.prepUpdatedAt ? ' · enregistré le ' + AMC.when(s.prepUpdatedAt) : ' · pas encore enregistré dans la base');
  const body = rows.map((row) => '<tr><td>' + AMC.esc(row.label) + '</td><td class="num">' + AMC.fmt(row.declared) + '</td><td class="num">' + AMC.fmt(row.ready) + '</td><td class="num">' + AMC.fmt(row.rejected) + '</td><td class="num">' + AMC.fmt(row.gap) + '</td><td>' + AMC.esc(row.note || (row.gap ? 'Raison non indiquée' : '—')) + '</td></tr>').join('');
  const gaps = rows.filter((row) => row.gap || row.note);
  const detail = gaps.length ? gaps.map((row) => '<article class="report-gap"><b>' + AMC.esc(row.label) + '</b><span>Déclaré ' + AMC.fmt(row.declared) + ' · Réel ' + AMC.fmt(row.ready) + ' · À écarter ' + AMC.fmt(row.rejected) + ' · Écart ' + AMC.fmt(row.gap) + '</span><p>' + AMC.esc(row.note || 'Raison non indiquée.') + '</p></article>').join('') : '<p class="report-empty">Aucun écart.</p>';
  document.getElementById('report-body').innerHTML = '<div class="report-kpis"><div><b>' + AMC.fmt(totals.declared) + '</b><span>Déclaré</span></div><div><b>' + AMC.fmt(totals.ready) + '</b><span>Réel</span></div><div><b>' + AMC.fmt(totals.rejected) + '</b><span>À écarter</span></div><div><b>' + AMC.fmt(totals.gap) + '</b><span>Écart</span></div></div><p class="report-rule">Le réel est copié du déclaré, puis diminué de ce qui est à écarter. Écart = Déclaré − Réel.</p><table class="report-table"><thead><tr><th>Article</th><th class="num">Déclaré</th><th class="num">Réel</th><th class="num">À écarter</th><th class="num">Écart</th><th>Raison</th></tr></thead><tbody>' + body + '<tr class="report-total"><td>Total</td><td class="num">' + AMC.fmt(totals.declared) + '</td><td class="num">' + AMC.fmt(totals.ready) + '</td><td class="num">' + AMC.fmt(totals.rejected) + '</td><td class="num">' + AMC.fmt(totals.gap) + '</td><td></td></tr></tbody></table><h2>Détail des écarts</h2>' + detail;
}
document.getElementById('rows').addEventListener('change', (e) => {
  const id = e.target.getAttribute('data-prep');
  const field = e.target.getAttribute('data-field');
  if (!id || !field || AMC.role() !== 'admin') return;
  AMC.setPrep(id, field, e.target.value);
  if (field === 'rejected') {
    const current = rowsOf().find((row) => row.id === id);
    if (current) AMC.setPrep(id, 'ready', current.ready);
  }
  render();
});
document.getElementById('save-prep').onclick = async () => {
  if (AMC.role() !== 'admin') return;
  const msg = document.getElementById('prep-msg');
  const rows = rowsOf();
  const over = rows.find((row) => row.over);
  if (over) { msg.dataset.live = '1'; msg.textContent = over.label + ' : à écarter dépasse le déclaré.'; return; }
  const missing = rows.find((row) => row.rejected > 0 && !String(row.note).trim());
  if (missing) { msg.dataset.live = '1'; msg.textContent = 'Indiquez la raison pour ' + missing.label + '.'; return; }
  msg.dataset.live = '1';
  msg.textContent = 'Enregistrement…';
  try {
    const res = await fetch('/api/prep', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: rows.map((row) => ({ item: row.id, rejected: row.rejected, note: row.note })) })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { msg.textContent = data.message || 'Enregistrement impossible.'; return; }
    await AMC.refreshPrep();
    msg.dataset.live = '';
    render();
    msg.dataset.live = '1';
    msg.textContent = data.message || 'Préparation enregistrée.';
  } catch (err) {
    msg.textContent = 'La base ne répond pas.';
  }
};
document.getElementById('print-prep').onclick = () => {
  fillReport();
  document.body.classList.add('printing-report');
  window.print();
};
window.addEventListener('afterprint', () => document.body.classList.remove('printing-report'));
render();
''')

transport = page('Transport · AMC', shell('transport.html', f'''
  <div class="kicker"><i></i> Étape 2 · Convoi</div>
  <h1>Transport</h1>
  <p class="lead">Le convoi n'est pas une quatrième campagne. C'est le suivi de la préparation, jusqu'à Douar Ilissi. Aucun départ n'est coché : nous sommes avant le 26 décembre 2026. Les responsables ne sont pas inventés.</p>
  <div class="grid-2">
    <section class="card">
      <h2>Véhicules</h2>
      <p class="sub">Deux places prévues. Le nom du responsable se saisit le moment venu.</p>
      <div class="form">
        <label>Fourgon 1 · vêtements<input id="lead1" placeholder="Responsable à désigner"></label>
        <label>Véhicule 2 · relais<input id="lead2" placeholder="Responsable à désigner"></label>
      </div>
      <p class="note">Créneau à confirmer : route vers Azilal avant le 26 décembre, distribution les 26 et 27. Pas d'heure inventée.</p>
    </section>
    <section class="card">
      <h2>Étapes du convoi</h2>
      <label class="check"><input type="checkbox" data-check="charge"> Chargement confirmé</label>
      <label class="check"><input type="checkbox" data-check="depart"> Départ enregistré</label>
      <label class="check"><input type="checkbox" data-check="azilal"> Passage Azilal</label>
      <label class="check"><input type="checkbox" data-check="ilissi"> Arrivée à Douar Ilissi</label>
      <p class="note" id="state"></p>
    </section>
  </div>
  <section class="card" style="margin-top:12px">
    <h2>Ce que le convoi emporte</h2>
    <p class="sub">Si la préparation a noté des pièces prêtes, ce sont elles. Sinon, le déclaré de la collecte, marqué comme non contrôlé.</p>
    <div id="load"></div>
  </section>
'''), '''
function render() {
  const s = AMC.load();
  const st = AMC.stats(s);
  const t = s.transport;
  document.getElementById('lead1').value = t.lead1 || '';
  document.getElementById('lead2').value = t.lead2 || '';
  document.querySelectorAll('[data-check]').forEach((el) => { el.checked = !!t[el.getAttribute('data-check')]; });
  const done = ['charge', 'depart', 'azilal', 'ilissi'].filter((k) => t[k]).length;
  document.getElementById('state').textContent = done + ' étape' + (done > 1 ? 's' : '') + ' cochée' + (done > 1 ? 's' : '') + ' sur 4.';
  document.getElementById('load').innerHTML = '<div class="chart">' + AMC.ITEMS.filter((it) => !it.money && !it.activity).map((it) => {
    const ready = (s.prep[it.id] && s.prep[it.id].ready) || 0;
    const declared = st.byItem[it.id];
    const useReady = !!s.prepUpdatedAt;
    return '<div class="line"><b>' + it.label + '</b><div class="track"><i style="width:' + Math.min(100, (useReady ? ready : declared) / Math.max(declared, 1) * 100) + '%"></i></div><span>' + AMC.fmt(useReady ? ready : declared) + (useReady ? '' : ' *') + '</span></div>';
  }).join('') + '</div><p class="note">* Non contrôlé : total déclaré, pas encore le prêt au départ.</p>';
}
document.getElementById('lead1').onchange = (e) => AMC.setTransport({ lead1: e.target.value });
document.getElementById('lead2').onchange = (e) => AMC.setTransport({ lead2: e.target.value });
document.querySelectorAll('[data-check]').forEach((el) => {
  el.onchange = () => {
    const patch = {};
    patch[el.getAttribute('data-check')] = el.checked;
    AMC.setTransport(patch);
    render();
  };
});
render();
''')

distribution = page('Distribution · AMC', shell('distribution.html', f'''
  <div class="kicker"><i></i> Étape 3 · Distribution</div>
  <h1>Remise sur place</h1>
  <p class="lead">Les 26 et 27 décembre 2026, à Douar Ilissi. On note les lots remis et le reste. On ne constitue pas un fichier de familles. Un nombre de foyers suffit.</p>
  <div class="grid-2">
    <section class="card">
      <h2>Clôture</h2>
      <label>Foyers servis, nombre seulement<input id="households" type="number" min="0" value="0"></label>
      <p class="note" id="close-note"></p>
      <button class="btn" type="button" id="close" style="margin-top:10px">Marquer la distribution terminée</button>
    </section>
    <section class="card">
      <h2>Suivi proposé</h2>
      <p class="sub">Quatre contrôles, pas une quatrième application.</p>
      <div class="check">Lots emportés, lus depuis la préparation.</div>
      <div class="check">Lots remis, saisis sur place.</div>
      <div class="check">Reste à ramener, calculé.</div>
      <div class="check">Clôture de la 11e édition, sans liste nominative.</div>
    </section>
  </div>
  <section class="card" style="margin-top:12px">
    <h2>Pièces</h2>
    <div style="overflow:auto">
      <table>
        <thead><tr><th>Article</th><th class="num">Emporté</th><th class="num">Remis</th><th class="num">Reste</th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
    <p class="note">On note le nombre de foyers, pas les noms.</p>
  </section>
'''), '''
function render() {
  const s = AMC.load();
  const st = AMC.stats(s);
  document.getElementById('households').value = s.distribution.households || 0;
  document.getElementById('close-note').textContent = s.distribution.closed ? 'Distribution marquée terminée.' : 'Pas encore commencée. La caravane est le 26 décembre 2026.';
  document.getElementById('rows').innerHTML = AMC.ITEMS.filter((it) => !it.money && !it.activity).map((it) => {
    const ready = (s.prep[it.id] && s.prep[it.id].ready) || 0;
    const taken = ready || st.byItem[it.id];
    const given = (s.distribution.lines[it.id] && s.distribution.lines[it.id].given) || 0;
    return '<tr><td>' + it.label + '</td><td class="num">' + AMC.fmt(taken) + '</td><td class="num"><input data-given="' + it.id + '" type="number" min="0" value="' + given + '"></td><td class="num">' + AMC.fmt(taken - given) + '</td></tr>';
  }).join('');
}
document.getElementById('households').onchange = (e) => { AMC.setDistribution({ households: Math.max(0, Number(e.target.value) || 0) }); };
document.getElementById('close').onclick = () => { AMC.setDistribution({ closed: true }); render(); };
document.getElementById('rows').addEventListener('change', (e) => {
  const id = e.target.getAttribute('data-given');
  if (id) { AMC.setDistLine(id, 'given', e.target.value); render(); }
});
render();
''')

classement = page('Classement · AMC', shell('classement.html', root.joinpath('classement-body.html').read_text(encoding='utf-8')), root.joinpath('rank-pdf.js').read_text(encoding='utf-8') + '\n' + root.joinpath('classement-page.js').read_text(encoding='utf-8'))

communiques = page('Communiqués · AMC', shell('communiques.html', '''
  <div class="kicker"><i></i> Association</div>
  <h1>Communiqués</h1>
  <p class="lead">L'administration publie. Tous les membres consultent.</p>
  <section class="card composer" id="composer" hidden>
    <h2>Nouveau communiqué</h2>
    <form class="form" id="form">
      <label>Titre<input id="title" required maxlength="120"></label>
      <label>Texte<textarea id="body" required></textarea></label>
      <div class="row"><button class="btn" type="submit">Publier</button></div>
    </form>
  </section>
  <section class="notice" id="list"></section>
'''), '''
function render() {
  const s = AMC.load();
  const admin = AMC.role() === 'admin';
  document.getElementById('composer').hidden = !admin;
  const notes = (s.notices || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
  document.getElementById('list').innerHTML = notes.length ? notes.map((n) => '<article><time>' + AMC.when(n.at) + '</time><h3>' + AMC.esc(n.title) + '</h3><p class="hint">' + AMC.esc(n.body) + '</p>' + (admin ? '<button class="ghost" type="button" data-del="' + AMC.esc(n.id) + '" style="margin-top:8px">Retirer</button>' : '') + '</article>').join('') : '<article><h3>Aucun communiqué</h3><p class="hint">Les prochains messages de l\\'administration apparaîtront ici.</p></article>';
}
document.getElementById('form').onsubmit = (e) => {
  e.preventDefault();
  if (AMC.role() !== 'admin') return;
  AMC.addNotice(document.getElementById('title').value, document.getElementById('body').value);
  e.target.reset();
  render();
};
document.getElementById('list').addEventListener('click', (e) => {
  const id = e.target.getAttribute('data-del');
  if (id && AMC.role() === 'admin') { AMC.removeNotice(id); render(); }
});
render();
''')


administration = page('Administration · AMC', shell('administration.html', """
  <div class="kicker"><i></i> Admins</div>
  <h1>Administration</h1>
  <p class="lead">Ajoutez un nom, retirez-le, ou changez son groupe. Cet onglet est réservé aux deux admins.</p>
  <section class="card">
    <h2>Ajouter un nom</h2>
    <form class="form" id="add-form">
      <div class="split">
        <label>Groupe<select id="add-group"></select></label>
        <label>Nom<input id="add-name" maxlength="60" required placeholder="Exemple : Ali Bousfiha"></label>
      </div>
      <button class="btn" type="submit">Ajouter</button>
    </form>
    <p class="note" id="admin-msg"></p>
  </section>
  <details class="card admin-fold">
    <summary>Noms des groupes</summary>
    <p class="sub">Changer le groupe déplace aussi les saisies déjà enregistrées.</p>
    <div style="overflow:auto">
      <table class="sheet">
        <thead><tr><th>Nom</th><th>Groupe actuel</th><th>Nouveau groupe</th><th></th></tr></thead>
        <tbody id="roster"></tbody>
      </table>
    </div>
  </details>
  <details class="card admin-fold">
    <summary>Photos</summary>
    <p class="sub">La photo d'un accès s'affiche sur son tableau de bord. Si cette personne est tête de groupe, le même badge apparaît à côté de son nom.</p>
    <div id="photo-access" class="photo-grid"></div>
    <h2 style="margin-top:18px">Autres noms du classement</h2>
    <p class="sub">Pour un nom qui n'a pas d'accès, ou pour une photo différente.</p>
    <div id="photo-members" class="photo-grid"></div>
    <input id="photo-file" type="file" accept="image/*" hidden>
    <p class="note" id="photo-msg"></p>
  </details>
"""), """
if (AMC.role() !== 'admin') { location.replace('index.html'); return; }
let roster = [];
const msg = document.getElementById('admin-msg');
document.getElementById('add-group').innerHTML = AMC.GROUPS.map((g) => '<option value="' + g.id + '">' + g.label + '</option>').join('');
function say(text) { msg.textContent = text || ''; }
function drawRoster(rows) {
  roster = rows || [];
  const groups = ['A', 'B', 'C', 'D', 'E'];
  document.getElementById('roster').innerHTML = roster.map((m) => {
    const options = groups.map((g) => '<option value="' + g + '"' + (g === m.group ? ' selected' : '') + '>Groupe ' + g + '</option>').join('');
    return '<tr data-key="' + AMC.esc(m.key) + '"><td>' + AMC.esc(m.name) + '</td><td>Groupe ' + AMC.esc(m.group) + '</td><td><select data-group>' + options + '</select></td><td class="admin-actions"><button type="button" class="ghost" data-move>Changer</button><button type="button" class="ghost btn-danger" data-del>Supprimer</button></td></tr>';
  }).join('') || '<tr><td colspan="4">Aucun nom.</td></tr>';
}
async function loadRoster() {
  const cached = AMC.roster();
  if (cached.length) drawRoster(cached);
  const res = await fetch('/api/members', { credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { if (!roster.length) say(data.message || 'La liste ne répond pas.'); return; }
  await AMC.refreshMembers();
  drawRoster(AMC.roster().length ? AMC.roster() : (data.members || []));
}
document.getElementById('add-form').onsubmit = async (e) => {
  e.preventDefault();
  say('Enregistrement…');
  const res = await fetch('/api/members', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group: document.getElementById('add-group').value, name: document.getElementById('add-name').value })
  });
  const data = await res.json().catch(() => ({}));
  say(data.message || 'Ajout impossible.');
  if (!res.ok) return;
  document.getElementById('add-name').value = '';
  loadRoster();
};
document.getElementById('roster').onclick = async (e) => {
  const move = e.target.closest('[data-move]');
  const del = e.target.closest('[data-del]');
  if (!move && !del) return;
  const tr = e.target.closest('tr');
  const key = tr.getAttribute('data-key');
  const person = roster.find((m) => m.key === key);
  if (!person) return;
  if (move) {
    const group = tr.querySelector('[data-group]').value;
    if (group === person.group) { say(person.name + ' est déjà dans ce groupe.'); return; }
    say('Enregistrement…');
    const res = await fetch('/api/members', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, group: group })
    });
    const data = await res.json().catch(() => ({}));
    say(data.message || 'Changement impossible.');
    if (res.ok) loadRoster();
    return;
  }
  if (!confirm('Retirer ' + person.name + ' du groupe ' + person.group + ' ?')) return;
  let res = await fetch('/api/members?id=' + encodeURIComponent(key), { method: 'DELETE', credentials: 'same-origin' });
  let data = await res.json().catch(() => ({}));
  if (res.status === 409 && data.entries && confirm(data.message + ' Retirer aussi ces saisies ?')) {
    res = await fetch('/api/members?id=' + encodeURIComponent(key) + '&force=1', { method: 'DELETE', credentials: 'same-origin' });
    data = await res.json().catch(() => ({}));
  }
  say(data.message || 'Suppression impossible.');
  if (res.ok) loadRoster();
};
let photoPick = null;
function faceBox(url, name) {
  if (url) return '<span class="photo-face"><img src="' + AMC.esc(url) + '" alt=""></span>';
  return '<span class="photo-face face-empty">' + AMC.esc(AMC.initials(name)) + '</span>';
}
function shrinkPhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 320;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('photo'));
    img.src = URL.createObjectURL(file);
  });
}
function loadPhotos() {
  const book = AMC.photoCatalog();
  if (!book.ready) return;
  const note = document.getElementById('photo-msg');
  const data = { accessList: book.accessList || [], linked: book.linked || {} };
  const linked = data.linked || {};
  const covered = {};
  Object.keys(linked).forEach((key) => { covered[key] = true; });
  document.getElementById('photo-access').innerHTML = (data.accessList || []).map((person) => '<article class="photo-card"><button type="button" data-photo="access" data-id="' + AMC.esc(person.email) + '">' + faceBox(person.photo, person.name) + '</button><b>' + AMC.esc(person.name) + '</b><span>' + AMC.esc(person.email) + '</span></article>').join('');
  const members = (roster || []).filter((m) => !covered[m.key]);
  document.getElementById('photo-members').innerHTML = members.map((m) => '<article class="photo-card"><button type="button" data-photo="member" data-id="' + AMC.esc(m.key) + '">' + faceBox(AMC.memberPhoto(m.group, m.id), m.name) + '</button><b>' + AMC.esc(m.name) + '</b><span>Groupe ' + AMC.esc(m.group) + '</span></article>').join('') || '<p class="sub">Tous les noms reliés à un accès utilisent déjà sa photo.</p>';
}
document.getElementById('photo-access').onclick = document.getElementById('photo-members').onclick = (e) => {
  const btn = e.target.closest('[data-photo]');
  if (!btn) return;
  photoPick = { kind: btn.getAttribute('data-photo'), id: btn.getAttribute('data-id') };
  document.getElementById('photo-file').value = '';
  document.getElementById('photo-file').click();
};
document.getElementById('photo-file').onchange = async (e) => {
  const file = e.target.files && e.target.files[0];
  const note = document.getElementById('photo-msg');
  if (!file || !photoPick) return;
  note.textContent = 'Enregistrement de la photo…';
  try {
    const dataUrl = await shrinkPhoto(file);
    const res = await fetch('/api/photos', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: photoPick.kind, id: photoPick.id, data: dataUrl })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { note.textContent = data.message || 'Photo impossible.'; return; }
    await AMC.refreshPhotos();
    loadPhotos();
    note.textContent = data.message || 'Photo enregistrée.';
  } catch (err) {
    note.textContent = 'Cette photo ne peut pas être lue.';
  }
};
drawRoster(AMC.roster());
loadPhotos();
document.addEventListener('amc-photos', loadPhotos);
loadRoster();
""")

root.joinpath('acces.html').write_text(index, encoding='utf-8')
root.joinpath('index.html').write_text(dashboard, encoding='utf-8')
root.joinpath('collecte.html').write_text(collecte, encoding='utf-8')
root.joinpath('preparation.html').write_text(preparation, encoding='utf-8')
root.joinpath('transport.html').write_text(transport, encoding='utf-8')
root.joinpath('distribution.html').write_text(distribution, encoding='utf-8')
root.joinpath('classement.html').write_text(classement, encoding='utf-8')
root.joinpath('communiques.html').write_text(communiques, encoding='utf-8')
root.joinpath('administration.html').write_text(administration, encoding='utf-8')
print('pages ok', sum(p.stat().st_size for p in root.glob('*.html')))
