function medal(i) {
  if (i === 0) return '<span class="medal gold" aria-label="Premier">1</span>';
  if (i === 1) return '<span class="medal silver" aria-label="Deuxième">2</span>';
  if (i === 2) return '<span class="medal bronze" aria-label="Troisième">3</span>';
  return '<span class="rank" style="background:#18213b">' + (i + 1) + '</span>';
}
function place(i) { return i === 0 ? '1er' : (i + 1) + 'e'; }
function cheer(p, rank) {
  if (rank === 0 && p >= 45) return 'Félicitations, vous menez la caravane. Gardez ce rythme.';
  if (p >= 70) return 'Excellent rythme. Le douar compte sur vous.';
  if (p >= 40) return 'Belle avancée. Encore un effort et le groupe passe devant.';
  if (p > 0) return 'Chaque pièce compte. Continuez, la chaleur se partage.';
  return 'Le groupe démarre. La première pièce lance le classement.';
}
function linesOf(groupId) {
  const s = AMC.load();
  const st = AMC.stats(s);
  const g = AMC.GROUPS.find((x) => x.id === groupId);
  const lines = g.members.map((m) => {
    const row = st.byMember[g.id][m[0]] || { pieces: 0, clothes: 0, books: 0, money: 0, name: m[1] };
    return { slug: m[0], name: row.name || m[1], pieces: row.pieces, clothes: row.clothes || 0, books: row.books || 0, money: row.money, score: AMC.pts(row) };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'fr'));
  const share = Math.max(1, AMC.GROUPS.length);
  const p = AMC.pct(st.byGroup[g.id].pieces, Math.round(st.pieceTarget / share));
  return { g, lines, p, st };
}
function snapshot() {
  const pack = linesOf('A');
  const st = pack.st;
  const byId = {};
  AMC.GROUPS.forEach((g) => { byId[g.id] = linesOf(g.id); });
  const groups = st.ranked.map((g, index) => {
    const row = byId[g.id];
    const members = row.lines.map((line, i) => ({ slug: line.slug, name: line.name, pieces: line.pieces, money: line.money, score: line.score, rank: i + 1 }));
    return {
      id: g.id, label: g.label, color: g.color, rank: index + 1,
      pieces: g.pieces, money: g.money, score: g.score, percent: row.p,
      cheer: cheer(row.p, index),
      leader: members[0] || { slug: '', name: '—', pieces: 0, money: 0, score: 0, rank: 1 },
      members: members
    };
  });
  const d = new Date();
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const stamp = String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  return {
    dateLabel: d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear(),
    dateStamp: stamp,
    pieces: st.pieces,
    money: st.money,
    points: groups.reduce((n, g) => n + g.score, 0),
    daysLeft: AMC.daysLeft(),
    groups: groups
  };
}
function render() {
  const data = snapshot();
  const days = data.daysLeft;
  const dayLabel = days > 1 ? 'Jours avant le 26 décembre' : days === 1 ? 'Jour avant le départ' : days === 0 ? 'Départ aujourd\'hui' : 'Après la date de départ';
  const dayValue = days >= 0 ? AMC.fmt(days) : '—';
  document.getElementById('sums').innerHTML = [
    [AMC.fmt(data.pieces), 'Pièces'],
    [AMC.fmt(data.money), 'Dons, MAD'],
    [AMC.fmt(data.points), 'Points'],
    [dayValue, dayLabel]
  ].map((row) => '<div class="stat"><b>' + row[0] + '</b><span>' + row[1] + '</span></div>').join('');
  document.getElementById('tops').innerHTML = data.groups.map((g, i) => {
    const best = g.leader;
    const faceUrl = AMC.memberPhoto(g.id, best.slug);
    const face = faceUrl ? '<span class="top-face"><img src="' + AMC.esc(faceUrl) + '" alt=""></span>' : '<span class="top-face face-empty">' + AMC.esc(AMC.initials(best.name)) + '</span>';
    return '<article class="top-card' + (i === 0 ? ' lead-place' : '') + '" style="--c:' + g.color + '"><div class="place-tag">' + place(i) + ' groupe</div><div class="row" style="align-items:center;margin:8px 0">' + medal(i) + face + '<div><b style="color:#0b1330">' + AMC.esc(best.name) + '</b><div class="hint">' + AMC.esc(g.label) + ' · tête de groupe</div></div></div><div class="meta"><b>' + AMC.fmt(best.score) + ' pts</b><span>' + AMC.fmt(best.pieces) + ' pcs</span></div><p class="cheer">' + AMC.esc(g.cheer) + '</p></article>';
  }).join('');
  document.getElementById('cards').innerHTML = AMC.GROUPS.map((group) => {
    const g = data.groups.find((row) => row.id === group.id);
    const top = Math.max(1, ...g.members.map((row) => row.score));
    const rows = g.members.map((row, i) => '<li class="' + (i === 0 ? 'lead' : '') + '">' + medal(i) + '<div><div class="who">' + AMC.esc(row.name) + '</div><div class="bar" style="margin:4px 0"><i style="--w:' + Math.round(row.score / top * 100) + '%;background:' + g.color + '"></i></div><div class="pts">' + AMC.fmt(row.pieces) + ' pcs · ' + AMC.fmt(row.money) + ' MAD</div></div><div class="pts"><b>' + AMC.fmt(row.score) + '</b><br>pts</div></li>').join('');
    return '<article class="share" style="--c:' + g.color + '"><header style="background:' + g.color + '"><div class="subhead"><b>' + AMC.esc(g.label) + '</b><span class="pill">' + place(g.rank - 1) + '</span></div><span>' + g.percent + ' % de la part du groupe</span></header><ol>' + rows + '</ol><footer><b>' + AMC.esc(g.cheer) + '</b></footer></article>';
  }).join('');
}
function saveFile(bytes, name, type) {
  const blob = new Blob([bytes], { type: type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
async function logoImage() {
  try {
    const img = new Image();
    img.src = 'logo.png';
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const pen = canvas.getContext('2d');
    pen.fillStyle = '#0b1330';
    pen.fillRect(0, 0, canvas.width, canvas.height);
    pen.drawImage(img, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return null;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w: canvas.width, h: canvas.height };
  } catch (err) {
    return null;
  }
}
let busy = false;
async function extract(button, make, done) {
  if (busy) return;
  busy = true;
  button.disabled = true;
  document.getElementById('pdf-msg').textContent = 'Préparation du document…';
  try {
    if (AMC.refresh) await AMC.refresh();
    render();
document.addEventListener('amc-photos', render);
    const image = await logoImage();
    const data = snapshot();
    const file = done(data);
    saveFile(make(data, image), file.name, file.type);
    document.getElementById('pdf-msg').textContent = file.message;
  } catch (err) {
    document.getElementById('pdf-msg').textContent = 'Le document n\'a pas pu être préparé.';
  }
  button.disabled = false;
  busy = false;
}
document.getElementById('pdf-report').onclick = function () {
  extract(this, (data, image) => window.AmcPdf.reportPdf(data, image), (data) => ({
    name: 'AMC-rapport-classement-' + data.dateStamp + '.pdf',
    type: 'application/pdf',
    message: 'Rapport téléchargé.'
  }));
};
document.getElementById('pdf-certs').onclick = function () {
  extract(this, (data, image) => window.AmcPdf.certificatesZip(data, image), (data) => ({
    name: 'AMC-attestations-' + data.dateStamp + '.zip',
    type: 'application/zip',
    message: 'Attestations téléchargées, une par tête de groupe.'
  }));
};
render();
