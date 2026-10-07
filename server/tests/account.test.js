// Account management tests: change password, avatar upload, delete account
// (with cascade cleanup). Run with: node tests/account.test.js
// Requires: mongod running, `npm run seed` done, server on http://localhost:5000
const fs = require('fs');
const path = require('path');
const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const API_ORIGIN = BASE.replace(/\/api\/?$/, '');
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');

let passed = 0, failed = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; results.push(`  PASS  ${name}`); }
  else { failed++; results.push(`  FAIL  ${name} ${detail}`); }
}

async function req(method, urlPath, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

// Multipart avatar upload (fetch sets the boundary automatically).
async function uploadAvatar(userId, token, buffer, filename, mime) {
  const fd = new FormData();
  fd.append('avatar', new Blob([buffer], { type: mime }), filename);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}/users/${userId}`, { method: 'PUT', headers, body: fd });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

// Minimal PNG bytes — the server validates mimetype + extension, not pixels.
const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);
const TEXT = Buffer.from('this is not an image');

const avatarFileOnDisk = (avatarPath) =>
  avatarPath && fs.existsSync(path.join(AVATAR_DIR, path.basename(avatarPath)));

(async () => {
  console.log('\n=== SkillSwap account tests ===\n');
  const ts = Date.now();

  // Register three users
  let r = await req('POST', '/auth/register', { name: 'Acct Alice', email: `accta${ts}@example.com`, password: 'secret123' });
  check('register A (201)', r.status === 201, `got ${r.status}`);
  const tokenA = r.json.token, idA = r.json.user._id;

  r = await req('POST', '/auth/register', { name: 'Acct Bob', email: `acctb${ts}@example.com`, password: 'secret123' });
  check('register B (201)', r.status === 201, `got ${r.status}`);
  const tokenB = r.json.token, idB = r.json.user._id;

  r = await req('POST', '/auth/register', { name: 'Acct Cara', email: `accc${ts}@example.com`, password: 'secret123' });
  check('register C (201)', r.status === 201, `got ${r.status}`);
  const tokenC = r.json.token, idC = r.json.user._id;

  // ── Change password ──────────────────────────────────────────────
  r = await req('PUT', `/users/${idA}/password`, { currentPassword: 'secret123', newPassword: 'newpass456' }, tokenA);
  check('change password succeeds (200)', r.status === 200, `got ${r.status}`);

  r = await req('POST', '/auth/login', { email: `accta${ts}@example.com`, password: 'newpass456' });
  check('login works with the new password', r.status === 200 && !!r.json.token, `got ${r.status}`);
  r = await req('POST', '/auth/login', { email: `accta${ts}@example.com`, password: 'secret123' });
  check('old password no longer works (401)', r.status === 401, `got ${r.status}`);

  r = await req('PUT', `/users/${idA}/password`, { currentPassword: 'wrongpass', newPassword: 'another789' }, tokenA);
  check('wrong current password → 401', r.status === 401, `got ${r.status}`);

  r = await req('PUT', `/users/${idA}/password`, { currentPassword: 'newpass456', newPassword: 'short' }, tokenA);
  check('new password too short → 400', r.status === 400, `got ${r.status}`);

  r = await req('PUT', `/users/${idA}/password`, { currentPassword: 'newpass456', newPassword: 'validpass1' });
  check('change password without token → 401', r.status === 401, `got ${r.status}`);

  r = await req('PUT', `/users/${idA}/password`, { currentPassword: 'newpass456', newPassword: 'validpass1' }, tokenB);
  check("B cannot change A's password (403)", r.status === 403, `got ${r.status}`);

  // ── Avatar upload ────────────────────────────────────────────────
  r = await uploadAvatar(idA, null, PNG, 'pic.png', 'image/png');
  check('avatar upload without token → 401', r.status === 401, `got ${r.status}`);

  r = await uploadAvatar(idA, tokenA, PNG, 'pic.png', 'image/png');
  check('avatar upload succeeds (200)', r.status === 200 && (r.json.avatar || '').startsWith('/uploads/avatars/'), `got ${r.status} ${r.json && r.json.avatar}`);
  const firstAvatar = r.json.avatar;
  check('avatar file exists on disk', avatarFileOnDisk(firstAvatar));

  r = await fetch(`${API_ORIGIN}${firstAvatar}`);
  check('uploaded avatar is served at /uploads (200)', r.status === 200, `got ${r.status}`);

  r = await uploadAvatar(idA, tokenA, PNG, 'pic2.png', 'image/png');
  const secondAvatar = r.json.avatar;
  check('replacing avatar returns a new path', r.status === 200 && secondAvatar !== firstAvatar, `got ${r.status}`);
  check('old avatar file is deleted on replace', !avatarFileOnDisk(firstAvatar));
  check('new avatar file exists on disk', avatarFileOnDisk(secondAvatar));

  r = await uploadAvatar(idA, tokenA, TEXT, 'evil.txt', 'text/plain');
  check('non-image upload rejected (400)', r.status === 400, `got ${r.status}`);

  // Validators must run against the parsed multipart body (middleware order:
  // multer → skill parsing → validators), not an empty body.
  const badEnum = new FormData();
  badEnum.append('experienceLevel', 'Expert');
  r = await fetch(`${BASE}/users/${idA}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: badEnum,
  });
  check('invalid experienceLevel via multipart → 400', r.status === 400, `got ${r.status}`);

  const emptyName = new FormData();
  emptyName.append('name', '   ');
  r = await fetch(`${BASE}/users/${idA}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: emptyName,
  });
  check('empty name via multipart → 400', r.status === 400, `got ${r.status}`);

  // ── Delete account (with cascade) ────────────────────────────────
  // Give A and B complementary skills so a swap + review can be created.
  const skills = (await req('GET', '/skills', null, tokenA)).json;
  const sid = (name) => skills.find((s) => s.name === name)._id;
  await req('PUT', `/users/${idA}`, { skillsToTeach: [sid('React')], skillsToLearn: [sid('Docker')] }, tokenA);
  await req('PUT', `/users/${idB}`, { skillsToTeach: [sid('Docker')], skillsToLearn: [sid('React')] }, tokenB);

  r = await req('POST', '/swaps', { receiver: idB, offeredSkill: sid('React'), requestedSkill: sid('Docker') }, tokenA);
  const swapId = r.json._id;
  await req('PUT', `/swaps/${swapId}`, { status: 'Accepted' }, tokenB);
  await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenA);
  await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenB);
  r = await req('POST', '/reviews', { swapRequest: swapId, rating: 5, comment: 'Great teacher!' }, tokenB);
  check('B reviews A (201) before deletion', r.status === 201, `got ${r.status}`);
  r = await req('GET', `/users/${idA}`, null, tokenA);
  check("A's rating is 5.0 before deletion", r.json.rating === 5 && r.json.ratingCount === 1, `got rating=${r.json.rating}`);

  // B uploads an avatar so we can verify file cleanup on delete.
  r = await uploadAvatar(idB, tokenB, PNG, 'bob.png', 'image/png');
  const bobAvatar = r.json.avatar;
  check('B avatar file exists before delete', avatarFileOnDisk(bobAvatar));

  r = await req('DELETE', `/users/${idA}`, null, tokenB);
  check("B cannot delete A's account (403)", r.status === 403, `got ${r.status}`);

  r = await req('DELETE', `/users/${idB}`, null, tokenB);
  check('B deletes own account (200)', r.status === 200, `got ${r.status}`);

  r = await req('GET', `/users/${idB}`, null, tokenA);
  check("deleted user's profile is gone (404)", r.status === 404, `got ${r.status}`);

  r = await req('POST', '/auth/login', { email: `acctb${ts}@example.com`, password: 'secret123' });
  check('deleted user cannot log in (401)', r.status === 401, `got ${r.status}`);

  // Cascade: swaps involving B are gone…
  r = await req('GET', '/swaps', null, tokenA);
  const involvesB = (r.json || []).some(
    (s) => String(s.sender._id || s.sender) === idB || String(s.receiver._id || s.receiver) === idB
  );
  check("B's swap requests are cascade-deleted", r.status === 200 && !involvesB);

  // …reviews by/for B are gone, and A's rating was repaired.
  r = await req('GET', `/reviews/user/${idA}`, null, tokenA);
  check("B's review of A is cascade-deleted", r.status === 200 && r.json.length === 0, `got ${r.status} len=${r.json && r.json.length}`);
  r = await req('GET', `/users/${idA}`, null, tokenA);
  check("A's rating reset to 0 after review deleted", r.json.rating === 0 && r.json.ratingCount === 0, `got rating=${r.json.rating}`);

  // Avatar file cleanup.
  check("B's avatar file deleted from disk", !avatarFileOnDisk(bobAvatar));

  // C (untouched) still works fine.
  r = await req('GET', '/dashboard', null, tokenC);
  check('unrelated user C unaffected (200)', r.status === 200, `got ${r.status}`);

  console.log('\n' + results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => { console.error('Test crashed:', err.message); process.exit(1); });
