// End-to-end flow test for SkillSwap (spec section 20): the full user journey
// with real database data — register → skills → discover → request → accept →
// two-sided complete → review → rating + dashboard stats.
// Run with: node tests/e2e-flow.test.js (mongod + seeded server required)
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
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

(async () => {
  console.log('\n=== SkillSwap end-to-end flow test ===\n');
  const ts = Date.now();

  // 1+2. Register User A and User B
  let r = await req('POST', '/auth/register', { name: 'Flow Alice', email: `flowa${ts}@example.com`, password: 'secret123' });
  check('1. User A registers (201)', r.status === 201 && !!r.json.token, `got ${r.status}`);
  const tokenA = r.json.token, idA = r.json.user._id;

  r = await req('POST', '/auth/register', { name: 'Flow Bob', email: `flowb${ts}@example.com`, password: 'secret123' });
  check('2. User B registers (201)', r.status === 201 && !!r.json.token, `got ${r.status}`);
  const tokenB = r.json.token, idB = r.json.user._id;

  // Skill ids from the seeded catalog
  const skills = (await req('GET', '/skills', null, tokenA)).json;
  const sid = (name) => skills.find((s) => s.name === name)._id;
  const react = sid('React'), js = sid('JavaScript'), docker = sid('Docker'), aws = sid('AWS');

  // 3+4. A adds teach + learn skills
  r = await req('PUT', `/users/${idA}`, { skillsToTeach: [react, js], skillsToLearn: [docker, aws] }, tokenA);
  check('3. A adds skills she can teach', r.status === 200 && r.json.skillsToTeach.length === 2, `got ${r.status}`);
  check('4. A adds skills she wants to learn', r.status === 200 && r.json.skillsToLearn.length === 2, `got ${r.status}`);

  // 5. B adds teach + learn skills (complementary to A)
  r = await req('PUT', `/users/${idB}`, { skillsToTeach: [docker, aws], skillsToLearn: [react] }, tokenB);
  check('5. B adds complementary teach/learn skills', r.status === 200, `got ${r.status}`);

  // 6+7. A opens Discover and sees B as a compatible partner
  r = await req('GET', '/matches', null, tokenA);
  const matchB = (r.json || []).find((m) => m.user._id === idB);
  check('6. Discover (matches) returns 200 for A', r.status === 200, `got ${r.status}`);
  check("7. A sees B as a '2-way match' with score 100",
    !!matchB && matchB.strength === '2-way match' && matchB.score === 100,
    `got ${JSON.stringify(matchB && { strength: matchB.strength, score: matchB.score })}`);
  check('7b. A does not appear in her own Discover results',
    !(r.json || []).some((m) => m.user._id === idA));

  // 8. A opens B's public profile
  r = await req('GET', `/users/${idB}`, null, tokenA);
  check("8. A's view of B's profile shows skills, hides email/password",
    r.status === 200 && r.json.skillsToTeach.length === 2 && !('email' in r.json) && !('password' in r.json),
    `got ${r.status}`);

  // 9. A sends a swap request: offers React (she teaches), requests Docker (he teaches)
  r = await req('POST', '/swaps', {
    receiver: idB, offeredSkill: react, requestedSkill: docker, message: 'Trade React for Docker?',
  }, tokenA);
  check('9. A sends a swap request (201 Pending)', r.status === 201 && r.json.status === 'Pending', `got ${r.status}`);
  const swapId = r.json._id;

  // 10. B sees the request under Incoming
  r = await req('GET', '/swaps', null, tokenB);
  const incoming = (r.json || []).filter((s) => {
    const receiverId = s.receiver && s.receiver._id ? s.receiver._id : s.receiver;
    return String(receiverId) === idB && s.status === 'Pending';
  });
  check('10. B sees the request as incoming Pending', incoming.length === 1, `got ${incoming.length}`);

  // 11. B accepts
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Accepted' }, tokenB);
  check('11. B accepts the request (200 Accepted)', r.status === 200 && r.json.status === 'Accepted', `got ${r.status}`);

  // 12. Both see the swap under Active
  const activeA = (await req('GET', '/swaps?status=Accepted', null, tokenA)).json;
  const activeB = (await req('GET', '/swaps?status=Accepted', null, tokenB)).json;
  check('12. Both A and B see the swap as Active',
    activeA.some((s) => s._id === swapId) && activeB.some((s) => s._id === swapId));

  // 13. Two-sided completion: A marks her side…
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenA);
  check('13a. A marks completed → still Active (waiting on B)',
    r.status === 200 && r.json.status === 'Accepted' && r.json.senderCompleted === true, `got ${r.status} ${r.json && r.json.status}`);
  // …then B marks his side → Completed
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenB);
  check('13b. B marks completed → swap becomes Completed',
    r.status === 200 && r.json.status === 'Completed', `got ${r.status}`);

  // 14. Swap moved to Completed (verified above) — both see it there
  const completedA = (await req('GET', '/swaps?status=Completed', null, tokenA)).json;
  check('14. A sees the swap under Completed', completedA.some((s) => s._id === swapId));

  // 15. A reviews B
  r = await req('POST', '/reviews', { swapRequest: swapId, rating: 5, comment: 'Excellent Docker walkthrough!' }, tokenA);
  check('15. A reviews B after completion (201)', r.status === 201 && r.json.rating === 5, `got ${r.status}`);

  // 16. B's rating/review appear on his profile
  r = await req('GET', `/users/${idB}`, null, tokenA);
  check("16a. B's profile shows average rating 5.0", r.json.rating === 5 && r.json.ratingCount === 1, `got rating=${r.json.rating}`);
  r = await req('GET', `/reviews/user/${idB}`, null, tokenA);
  check("16b. B's review is listed", r.status === 200 && r.json.length === 1 && r.json[0].comment === 'Excellent Docker walkthrough!', `got ${r.status}`);

  // 17. Dashboard statistics are real and correct
  const dashA = (await req('GET', '/dashboard', null, tokenA)).json;
  const dashB = (await req('GET', '/dashboard', null, tokenB)).json;
  check('17a. A dashboard stats correct',
    dashA.stats.skillsToTeach === 2 && dashA.stats.skillsToLearn === 2 &&
    dashA.stats.completedSwaps === 1 && dashA.stats.activeSwaps === 0 && dashA.stats.pendingIncoming === 0,
    JSON.stringify(dashA.stats));
  check('17b. B dashboard stats correct',
    dashB.stats.skillsToTeach === 2 && dashB.stats.skillsToLearn === 1 && dashB.stats.completedSwaps === 1,
    JSON.stringify(dashB.stats));
  check('17c. Recent activity mentions the completed swap',
    dashA.recentActivity.some((a) => a.text.includes('completed a skill swap')),
    JSON.stringify(dashA.recentActivity.map((a) => a.text)));

  console.log('\n' + results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => { console.error('Test crashed:', err.message); process.exit(1); });
