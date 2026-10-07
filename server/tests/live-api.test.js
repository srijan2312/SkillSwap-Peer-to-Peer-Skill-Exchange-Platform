// Live API test for the SkillSwap backend. Run with: node tests/live-api.test.js
// Requires: mongod running, `npm run seed` done, server on http://localhost:5000
const BASE = process.env.API_BASE || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const results = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push(`  PASS  ${name}`);
  } else {
    failed++;
    results.push(`  FAIL  ${name} ${detail}`);
  }
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
  try {
    json = await res.json();
  } catch (_) { /* non-JSON body */ }
  return { status: res.status, json };
}

(async () => {
  console.log('\n=== SkillSwap live API tests ===\n');

  // 1. Register a brand-new user
  const ts = Date.now();
  const emailA = `testa${ts}@example.com`; // lowercase: express-validator normalizeEmail lowercases on register
  const emailB = `testb${ts}@example.com`;
  let r = await req('POST', '/auth/register', { name: 'Test Alice', email: emailA, password: 'secret123' });
  check('register returns 201 with token + user', r.status === 201 && !!r.json.token && r.json.user.email === emailA, `got ${r.status}`);
  check('register response has no password', r.status === 201 && !('password' in r.json.user));
  const tokenA = r.json.token;
  const userA = r.json.user;

  // 2. Duplicate email → 409
  r = await req('POST', '/auth/register', { name: 'Dup', email: emailA, password: 'secret123' });
  check('duplicate email returns 409', r.status === 409, `got ${r.status}`);

  // 3. Register second user
  r = await req('POST', '/auth/register', { name: 'Test Bob', email: emailB, password: 'secret123' });
  check('second user registers (201)', r.status === 201);
  const tokenB = r.json.token;
  const userB = r.json.user;

  // 4. Login works
  r = await req('POST', '/auth/login', { email: emailA, password: 'secret123' });
  check('login returns 200 + token', r.status === 200 && !!r.json.token, `got ${r.status}`);

  // 5. Bad login → 401
  r = await req('POST', '/auth/login', { email: emailA, password: 'wrongpass' });
  check('bad password returns 401', r.status === 401, `got ${r.status}`);

  // 6. Protected route without token → 401
  r = await req('GET', '/skills');
  check('unauthenticated /api/skills returns 401', r.status === 401, `got ${r.status}`);

  // 7. GET /api/skills with token
  r = await req('GET', '/skills', null, tokenA);
  check('GET /api/skills returns the seeded skills', r.status === 200 && r.json.length >= 12 && !!r.json.find((s) => s.name === 'Docker'), `got ${r.json && r.json.length}`);
  const dockerSkill = r.json.find((s) => s.name === 'Docker');
  const reactSkill = r.json.find((s) => s.name === 'React');

  // 8. PUT own profile → 200 (add skills so matching can be tested)
  r = await req('PUT', `/users/${userA._id}`, { bio: 'I love testing', skillsToTeach: [reactSkill._id], skillsToLearn: [dockerSkill._id] }, tokenA);
  check('PUT own profile returns 200 with updated bio', r.status === 200 && r.json.bio === 'I love testing', `got ${r.status}`);
  check('PUT own profile populates skills', r.status === 200 && r.json.skillsToTeach[0].name === 'React');

  // 8b. Bob gets complementary skills — request validation requires the offered
  // skill to be in the SENDER's teach list and the requested skill in the
  // RECEIVER's teach list.
  r = await req('PUT', `/users/${userB._id}`, { skillsToTeach: [dockerSkill._id], skillsToLearn: [reactSkill._id] }, tokenB);
  check('second user profile gets complementary skills', r.status === 200, `got ${r.status}`);

  // 9. PUT another user's profile → 403
  r = await req('PUT', `/users/${userB._id}`, { bio: 'hacked' }, tokenA);
  check("PUT another user's profile returns 403", r.status === 403, `got ${r.status}`);

  // 10. GET /api/matches — seeded demo users have complementary skills
  const demoLogin = await req('POST', '/auth/login', { email: 'srijan@demo.com', password: 'password123' });
  const demoToken = demoLogin.json.token;
  r = await req('GET', '/matches', null, demoToken);
  const rahulMatch = r.json.find((m) => m.user.name === 'Rahul Sharma');
  check('GET /api/matches returns 200', r.status === 200, `got ${r.status}`);
  check("Rahul is a '2-way match' for Srijan", !!rahulMatch && rahulMatch.strength === '2-way match', JSON.stringify(rahulMatch && rahulMatch.strength));
  // Srijan wants {Docker,AWS} (2), teaches {React,JS,MongoDB} (3); Rahul teaches {Docker,AWS,K8s} (3), wants {React,JS} (2)
  // a = {Docker,AWS}∩{Docker,AWS,K8s} = 2; b = {React,JS}∩{React,JS,MongoDB} = 2
  // score = round((2+2)/(2+2)*100) = 100
  check('Rahul match score is 100', !!rahulMatch && rahulMatch.score === 100, `got ${rahulMatch && rahulMatch.score}`);
  check('match hides email/password of other users', !!rahulMatch && !('email' in rahulMatch.user) && !('password' in rahulMatch.user));
  const sorted = r.json.every((m, i, arr) => i === 0 || arr[i - 1].score >= m.score);
  check('matches sorted by score desc', sorted);

  // 11. POST /api/swaps creates Pending
  r = await req('POST', '/swaps', { receiver: userB._id, offeredSkill: reactSkill._id, requestedSkill: dockerSkill._id, message: 'Teach me Docker?' }, tokenA);
  check('POST /api/swaps returns 201 Pending', r.status === 201 && r.json.status === 'Pending', `got ${r.status}`);
  const swapId = r.json._id;

  // 12. Request to self → 400
  r = await req('POST', '/swaps', { receiver: userA._id, offeredSkill: reactSkill._id, requestedSkill: dockerSkill._id }, tokenA);
  check('swap request to self returns 400', r.status === 400, `got ${r.status}`);

  // 13. Duplicate pending request → 400
  r = await req('POST', '/swaps', { receiver: userB._id, offeredSkill: reactSkill._id, requestedSkill: dockerSkill._id }, tokenA);
  check('duplicate pending request returns 400', r.status === 400, `got ${r.status}`);

  // 14. Accept by non-receiver → 403
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Accepted' }, tokenA);
  check('accept by non-receiver returns 403', r.status === 403, `got ${r.status}`);

  // 15. Accept by receiver → 200 Accepted
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Accepted' }, tokenB);
  check('receiver accepts → 200 Accepted', r.status === 200 && r.json.status === 'Accepted', `got ${r.status} ${r.json && r.json.status}`);

  // 16. Two-sided completion: the sender marks their side first — the swap
  // stays 'Accepted' until the receiver marks their side too.
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenA);
  check(
    'sender marks completed → still Accepted, senderCompleted=true',
    r.status === 200 && r.json.status === 'Accepted' && r.json.senderCompleted === true && r.json.receiverCompleted === false,
    `got ${r.status} ${JSON.stringify(r.json && { status: r.json.status, s: r.json.senderCompleted, rc: r.json.receiverCompleted })}`
  );

  // 16b. Marking your own side twice → 400.
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenA);
  check('double-complete by same user returns 400', r.status === 400, `got ${r.status}`);

  // 16c. The receiver marks their side → now both sides are done → 'Completed'.
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Completed' }, tokenB);
  check(
    'both sides marked → status Completed',
    r.status === 200 && r.json.status === 'Completed' && r.json.receiverCompleted === true,
    `got ${r.status} ${r.json && r.json.status}`
  );

  // 17. Review before completion on a different (pending) swap → 400.
  // (Same skill pair as the finished swap is fine — only Pending duplicates
  // are blocked, and that one is now Completed.)
  r = await req('POST', '/swaps', { receiver: userB._id, offeredSkill: reactSkill._id, requestedSkill: dockerSkill._id, message: 'second' }, tokenA);
  check('second swap with same skills → 201 Pending', r.status === 201 && r.json.status === 'Pending', `got ${r.status}`);
  const pendingSwapId = r.json._id;
  r = await req('POST', '/reviews', { swapRequest: pendingSwapId, rating: 5, comment: 'too early' }, tokenA);
  check('review on non-completed swap returns 400', r.status === 400, `got ${r.status}`);

  // 18. Invalid rating → 400
  r = await req('POST', '/reviews', { swapRequest: swapId, rating: 9, comment: 'bad rating' }, tokenB);
  check('invalid rating returns 400', r.status === 400, `got ${r.status}`);

  // 19. Valid review → 201, updates average rating
  r = await req('POST', '/reviews', { swapRequest: swapId, rating: 5, comment: 'Excellent teacher!' }, tokenB);
  check('valid review returns 201', r.status === 201 && r.json.rating === 5, `got ${r.status}`);
  const profile = await req('GET', `/users/${userA._id}`, null, tokenB);
  check("review updates reviewed user's average rating", profile.json.rating === 5 && profile.json.ratingCount === 1, `got rating=${profile.json && profile.json.rating}`);

  // 20. Duplicate review → 400
  r = await req('POST', '/reviews', { swapRequest: swapId, rating: 4, comment: 'again' }, tokenB);
  check('duplicate review returns 400', r.status === 400, `got ${r.status}`);

  // 21. GET /api/reviews/user/:userId
  r = await req('GET', `/reviews/user/${userA._id}`, null, tokenB);
  check('GET user reviews returns the review', r.status === 200 && r.json.length === 1 && r.json[0].comment === 'Excellent teacher!', `got ${r.status}`);

  // 22. GET /api/dashboard stats
  r = await req('GET', '/dashboard', null, tokenA);
  check('dashboard returns 200', r.status === 200, `got ${r.status}`);
  check('dashboard stats correct', r.status === 200 && r.json.stats.skillsToTeach === 1 && r.json.stats.skillsToLearn === 1 && r.json.stats.completedSwaps === 1 && r.json.stats.pendingSent === 1, JSON.stringify(r.json && r.json.stats));
  check('dashboard has topMatches + recentActivity', r.status === 200 && Array.isArray(r.json.topMatches) && Array.isArray(r.json.recentActivity));

  // 23. DELETE a pending sent swap → 200
  r = await req('DELETE', `/swaps/${pendingSwapId}`, null, tokenA);
  check('sender deletes pending swap → 200', r.status === 200, `got ${r.status}`);
  r = await req('GET', '/swaps', null, tokenA);
  check('deleted swap no longer listed', r.status === 200 && !r.json.some((s) => s._id === pendingSwapId));

  // 24. GET /api/users/:id hides email/password of others
  r = await req('GET', `/users/${userB._id}`, null, tokenA);
  check('public profile hides email + password', r.status === 200 && !('email' in r.json) && !('password' in r.json), `got ${r.status}`);
  r = await req('GET', `/users/${userA._id}`, null, tokenA);
  check('own profile includes email', r.status === 200 && r.json.email === emailA);

  // 25. Invalid status transition → 400 (Completed → Accepted)
  r = await req('PUT', `/swaps/${swapId}`, { status: 'Accepted' }, tokenB);
  check('invalid transition Completed→Accepted returns 400', r.status === 400, `got ${r.status}`);

  // 26. /api/auth/me works
  r = await req('GET', '/auth/me', null, tokenA);
  check('/api/auth/me returns current user', r.status === 200 && r.json.email === emailA, `got ${r.status}`);

  // 27. POST /api/skills creates a new skill in the catalog
  const newSkillName = `E2E Skill ${ts}`;
  r = await req('POST', '/skills', { name: newSkillName, category: 'Programming' }, tokenA);
  check('POST /api/skills returns 201 with the skill', r.status === 201 && !!r.json._id && r.json.name === newSkillName, `got ${r.status}`);
  const newSkillId = r.json && r.json._id;

  // 28. Duplicate skill name (case-insensitive) → 409 with the existing skill
  r = await req('POST', '/skills', { name: newSkillName.toLowerCase(), category: 'Programming' }, tokenA);
  check('duplicate skill name returns 409', r.status === 409 && !!r.json.skill, `got ${r.status}`);

  // 29. Skill creation requires auth → 401
  r = await req('POST', '/skills', { name: 'Nope Skill' });
  check('POST /api/skills without token returns 401', r.status === 401, `got ${r.status}`);

  // 30. Request validation: can't offer a skill you don't teach → 400
  r = await req('POST', '/swaps', { receiver: userB._id, offeredSkill: newSkillId, requestedSkill: dockerSkill._id }, tokenA);
  check('offering a skill you do not teach returns 400', r.status === 400, `got ${r.status}`);

  // 31. Request validation: can't request a skill they don't teach → 400
  r = await req('POST', '/swaps', { receiver: userB._id, offeredSkill: reactSkill._id, requestedSkill: newSkillId }, tokenA);
  check('requesting a skill they do not teach returns 400', r.status === 400, `got ${r.status}`);

  // 32. Profile skill arrays are deduped + empties dropped server-side
  r = await req('PUT', `/users/${userA._id}`, { skillsToTeach: [reactSkill._id, reactSkill._id, ''] }, tokenA);
  check('duplicate/empty skill ids are cleaned', r.status === 200 && r.json.skillsToTeach.length === 1, `got ${r.status} len=${r.json && r.json.skillsToTeach && r.json.skillsToTeach.length}`);

  // 33. Invalid avatar URL → 400
  r = await req('PUT', `/users/${userA._id}`, { avatar: 'not-a-url' }, tokenA);
  check('invalid avatar URL returns 400', r.status === 400, `got ${r.status}`);

  console.log('\n' + results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('Test crashed:', err.message);
  process.exit(1);
});
