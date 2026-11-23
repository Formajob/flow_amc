const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = __dirname;
let source = fs.readFileSync(path.join(root, 'demo.js'), 'utf8');
assert.match(source, /  boot\(\);\s*\}\)\(\);\s*$/);
source = source.replace('  boot();', `  window.__amcTest = { ITEMS, GROUPS, DEFAULT_TARGETS, stats, pts, couverturePoints };`);
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'demo.js' });
const { ITEMS, GROUPS, DEFAULT_TARGETS, stats, pts, couverturePoints } = sandbox.window.__amcTest;

for (const [qty, expected] of [[0, 0], [1, 3], [2, 6], [3, 9], [4, 13], [5, 17]]) {
  assert.equal(couverturePoints(qty), expected, `${qty} couverture(s)`);
}
assert.ok(ITEMS.some((item) => item.id === 'couverture' && item.label === 'Couverture'));

const result = stats({
  targets: { ...DEFAULT_TARGETS },
  entries: [
    { group: 'A', member: 'safaa', item: 'couverture', qty: 4 },
    { group: 'A', member: 'yahya', item: 'couverture', qty: 1 }
  ]
});
assert.equal(result.byItem.couverture, 5);
assert.equal(result.pieces, 5);
assert.equal(result.byGroup.A.couvertureScore, 16, 'les paliers se calculent par membre puis s’additionnent au groupe');
assert.equal(pts(result.byMember.A.safaa), 13);
assert.equal(pts(result.byMember.A.yahya), 3);
assert.equal(pts(result.byGroup.A), 16);

const entriesApi = fs.readFileSync(path.join(root, 'app/api/entries/route.js'), 'utf8');
const prepApi = fs.readFileSync(path.join(root, 'app/api/prep/route.js'), 'utf8');
assert.match(entriesApi, /couverture: \["Couverture", "pièce", false, 16\]/);
assert.match(entriesApi, /item === "couverture" && !Number\.isInteger\(qty\)/);
assert.match(prepApi, /couverture: \["Couverture", "pièce", false, 16\]/);
for (const file of ['collecte.html', 'preparation.html', 'transport.html', 'distribution.html', 'classement.html']) {
  assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /Couverture/);
}
assert.match(fs.readFileSync(path.join(root, 'classement.html'), 'utf8'), /3 points chacune pour les 3 premières/);
console.log('COUVERTURE OK');
