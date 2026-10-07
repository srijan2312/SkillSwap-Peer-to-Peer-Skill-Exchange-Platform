// Edge-case tests for SkillSwap backend (supplements live-api.test.js)
const BASE = process.env.API_BASE || 'http://localhost:5000/api';
let passed = 0, failed = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) { passed++; results.push(`  PASS  ${name}`); }
  else { failed++; results.push(`  FAIL  ${name} ${detail}`); }
}
async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}
(async () => {
  console.log('\n=== SkillSwap edge-case tests ===\n');
  const ts = Date.now();
  const mk = async (n) => {
    const r = await req('POST', '/auth/register', { name: n, email: `${n}${ts}@example.com`, password: 'secret123' });
    return { token: r.json.token, id: r.json.user._id };
  };
  const A = await mk('edgea');
  const B = await mk('edgeb');
  const C = await mk('edgec');
  const skills = (await req('GET', '/skills', null, A.token)).json;
  const react = skills.find(s => s.name === 'React')._id;
  const docker = skills.find(s => s.name === 'Docker')._id;
  const fakeId = '000000000000000000000000';

  // Request validation needs real teach lists: A teaches React, B teaches Docker.
  await req('PUT', `/users/${A.id}`, { skillsToTeach: [react] }, A.token);
  await req('PUT', `/users/${B.id}`, { skillsToTeach: [docker], skillsToLearn: [react] }, B.token);

  // validation: short password → 400
  let r = await req('POST', '/auth/register', { name: 'x', email: `short${ts}@example.com`, password: '123' });
  check('short password → 400', r.status === 400, `got ${r.status}`);

  // validation: bad email → 400
  r = await req('POST', '/auth/register', { name: 'x', email: 'not-an-email', password: 'secret123' });
  check('bad email → 400', r.status === 400, `got ${r.status}`);

  // invalid receiver id format → 400
  r = await req('POST', '/swaps', { receiver: 'nope', offeredSkill: react, requestedSkill: docker }, A.token);
  check('malformed receiver id → 400', r.status === 400, `got ${r.status}`);

  // nonexistent receiver → 404
  r = await req('POST', '/swaps', { receiver: fakeId, offeredSkill: react, requestedSkill: docker }, A.token);
  check('nonexistent receiver → 404', r.status === 404, `got ${r.status}`);

  // invalid skill → 400
  r = await req('POST', '/swaps', { receiver: B.id, offeredSkill: fakeId, requestedSkill: docker }, A.token);
  check('invalid skill → 400', r.status === 400, `got ${r.status}`);

  // reject flow: receiver rejects
  r = await req('POST', '/swaps', { receiver: B.id, offeredSkill: react, requestedSkill: docker }, A.token);
  const s1 = r.json._id;
  r = await req('PUT', `/swaps/${s1}`, { status: 'Rejected' }, B.token);
  check('receiver rejects → 200 Rejected', r.status === 200 && r.json.status === 'Rejected', `got ${r.status}`);

  // sender cancels pending
  r = await req('POST', '/swaps', { receiver: B.id, offeredSkill: react, requestedSkill: docker }, A.token);
  const s2 = r.json._id;
  r = await req('PUT', `/swaps/${s2}`, { status: 'Cancelled' }, A.token);
  check('sender cancels pending → 200 Cancelled', r.status === 200 && r.json.status === 'Cancelled', `got ${r.status}`);

  // after reject/cancel, a NEW request with same skills is allowed (partial unique index)
  r = await req('POST', '/swaps', { receiver: B.id, offeredSkill: react, requestedSkill: docker }, A.token);
  check('new request after reject allowed → 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.json)}`);
  const s3 = r.json._id;

  // stranger cannot touch swap → 403
  r = await req('PUT', `/swaps/${s3}`, { status: 'Accepted' }, C.token);
  check('stranger cannot accept → 403', r.status === 403, `got ${r.status}`);

  // non-sender cannot delete → 403
  r = await req('DELETE', `/swaps/${s3}`, null, B.token);
  check('non-sender delete → 403', r.status === 403, `got ${r.status}`);

  // accept then delete attempt on Accepted → 400
  await req('PUT', `/swaps/${s3}`, { status: 'Accepted' }, B.token);
  r = await req('DELETE', `/swaps/${s3}`, null, A.token);
  check('delete accepted swap → 400', r.status === 400, `got ${r.status}`);

  // ?status filter
  r = await req('GET', '/swaps?status=Accepted', null, A.token);
  check('GET /api/swaps?status=Accepted filters', r.status === 200 && r.json.length >= 1 && r.json.every(s => s.status === 'Accepted'), `got ${r.status}`);

  // invalid enum on profile → 400
  r = await req('PUT', `/users/${A.id}`, { experienceLevel: 'Guru' }, A.token);
  check('invalid experienceLevel → 400', r.status === 400, `got ${r.status}`);

  // invalid skill ids on profile → 400
  r = await req('PUT', `/users/${A.id}`, { skillsToTeach: [fakeId] }, A.token);
  check('invalid skill id on profile → 400', r.status === 400, `got ${r.status}`);

  // search + filters
  await req('PUT', `/users/${A.id}`, { skillsToTeach: [react] }, A.token);
  r = await req('GET', '/users?skill=react', null, B.token);
  check('skill search finds user', r.status === 200 && r.json.some(u => u._id === A.id), `got ${r.status}`);
  r = await req('GET', '/users?category=DevOps', null, B.token);
  check('category filter works', r.status === 200 && Array.isArray(r.json), `got ${r.status}`);
  r = await req('GET', '/users?search=edgea', null, B.token);
  check('name search works', r.status === 200 && r.json.some(u => u._id === A.id), `got ${r.status}`);
  r = await req('GET', '/users?search=edgea', null, A.token);
  check('search excludes self', r.status === 200 && !r.json.some(u => u._id === A.id), `got ${r.status}`);

  // review by non-participant → 403 (two-sided completion: A's mark alone
  // keeps the swap Accepted; only after B marks too does it flip to Completed)
  await req('PUT', `/users/${A.id}`, { skillsToTeach: [react, docker] }, A.token);
  await req('PUT', `/users/${B.id}`, { skillsToTeach: [react, docker] }, B.token);
  const done1 = await req('POST', '/swaps', { receiver: B.id, offeredSkill: docker, requestedSkill: react }, A.token);
  check('swap for review test created → 201', done1.status === 201, `got ${done1.status}`);
  await req('PUT', `/swaps/${done1.json._id}`, { status: 'Accepted' }, B.token);
  let rc = await req('PUT', `/swaps/${done1.json._id}`, { status: 'Completed' }, A.token);
  check('one-sided completion keeps status Accepted', rc.status === 200 && rc.json.status === 'Accepted' && rc.json.senderCompleted === true, `got ${rc.status} ${rc.json && rc.json.status}`);
  r = await req('POST', '/reviews', { swapRequest: done1.json._id, rating: 5 }, C.token);
  check('review by non-participant → 403', r.status === 403, `got ${r.status}`);
  rc = await req('PUT', `/swaps/${done1.json._id}`, { status: 'Completed' }, B.token);
  check('two-sided completion flips status to Completed', rc.status === 200 && rc.json.status === 'Completed', `got ${rc.status}`);

  // limit param respected
  const dl = await req('POST', '/auth/login', { email: 'srijan@demo.com', password: 'password123' });
  r = await req('GET', '/matches?limit=2', null, dl.json.token);
  check('matches ?limit=2 respected', r.status === 200 && r.json.length <= 2, `got ${r.json && r.json.length}`);

  // unknown route → 404 JSON
  r = await req('GET', '/nope', null, A.token);
  check('unknown route → 404', r.status === 404, `got ${r.status}`);

  console.log('\n' + results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => { console.error('Test crashed:', err.message); process.exit(1); });
