// ─── SkillSwap matching algorithm ────────────────────────────────────────────
// Whiteboard version:
//   1. Take what the current user WANTS to learn and what each candidate TEACHES.
//      Every overlap is a skill "you can learn from them"  →  a
//   2. Take what the candidate WANTS to learn and what the current user TEACHES.
//      Every overlap is a skill "they can learn from you"  →  b
//   3. If a and b are both > 0, it is a "2-way match" (both sides benefit).
//      If only one side overlaps, it is a "1-way match" (still worth showing).
//   4. Score = (a + b) / (yourWants + theirWants) × 100, rounded, capped at 100.
//      It answers: "of all the skills the two of you are looking for, what
//      percentage can you teach each other?"
// No AI/ML — just set intersection on skill ids. Deterministic, O(n) per
// candidate where n is the number of skills involved.

const toIdSet = (skills) => new Set((skills || []).map((s) => String(s._id || s)));

function computeMatches(currentUser, candidates, limit = 20) {
  const userTeach = toIdSet(currentUser.skillsToTeach);
  const userLearn = toIdSet(currentUser.skillsToLearn);

  // Skill id -> name lookup so the response can include human-readable names.
  const nameOf = {};
  for (const s of [...(currentUser.skillsToTeach || []), ...(currentUser.skillsToLearn || [])]) {
    nameOf[String(s._id || s)] = s.name || s;
  }

  const results = [];

  for (const candidate of candidates) {
    const candTeach = toIdSet(candidate.skillsToTeach);
    const candLearn = toIdSet(candidate.skillsToLearn);

    // a: skills YOU want that THEY teach — what you can learn from them.
    const skillsYouCanLearn = [...userLearn].filter((id) => candTeach.has(id));
    // b: skills THEY want that YOU teach — what they can learn from you.
    const skillsTheyCanLearn = [...candLearn].filter((id) => userTeach.has(id));

    const a = skillsYouCanLearn.length;
    const b = skillsTheyCanLearn.length;
    if (a + b === 0) continue; // no overlap at all — not a match

    // Denominator: every skill either side is looking for. Guard against
    // division by zero when both want-lists are empty (can't happen here
    // since a + b > 0 implies at least one want-list is non-empty, but be safe).
    const denominator = userLearn.size + candLearn.size;
    if (denominator === 0) continue;

    const raw = ((a + b) / denominator) * 100;
    const score = Math.min(100, Math.round(raw));

    for (const s of [...(candidate.skillsToTeach || []), ...(candidate.skillsToLearn || [])]) {
      nameOf[String(s._id || s)] = s.name || s;
    }

    results.push({
      user: candidate,
      score,
      strength: a > 0 && b > 0 ? '2-way match' : '1-way match',
      teachOverlap: a,
      learnOverlap: b,
      skillsYouCanLearn: skillsYouCanLearn.map((id) => nameOf[id]).filter(Boolean),
      skillsTheyCanLearn: skillsTheyCanLearn.map((id) => nameOf[id]).filter(Boolean),
    });
  }

  // Best matches first.
  results.sort((x, y) => y.score - x.score);
  return results.slice(0, limit);
}

module.exports = { computeMatches };
