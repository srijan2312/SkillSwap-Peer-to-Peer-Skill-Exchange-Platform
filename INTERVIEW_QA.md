# SkillSwap — Interview Q&A

Realistic questions an interviewer can ask about this project, with honest, fresher-friendly answers based on the **actual implementation**. Nothing here describes a feature that doesn't exist.

---

## Project Explanation

### Q1. Explain your SkillSwap project.

**Concept:** SkillSwap is a platform where people exchange skills instead of paying for courses — "I teach you what I know, you teach me what I know."

**Interview Answer (30–60 seconds):**

> "SkillSwap is a full-stack MERN app for peer-to-peer skill exchange. Users create a profile listing skills they can teach and skills they want to learn. The core feature is a matching algorithm that compares users in both directions — it finds people who teach what you want to learn AND want to learn what you teach — and ranks them with a match score. You can then send a swap request, the other person accepts or rejects it, you mark it complete when done, and leave each other a rating and review. It has JWT authentication, a dashboard, search and filters, and a request lifecycle, all with a dark SaaS-style UI."

### Q2. Why did you build this project?

**Interview Answer:**

> "I wanted a project that goes beyond basic CRUD and has a real workflow. SkillSwap gave me authentication, profiles, a matching algorithm I could explain on a whiteboard, a request-and-approval flow with role-based rules, and reviews that feed back into ratings. It let me practice the full MERN stack on one coherent idea instead of disconnected demos."

### Q3. What makes this project different from a normal CRUD application?

**Concept:** CRUD is create/read/update/delete of records. SkillSwap adds decision logic and multi-user workflows on top.

**Interview Answer:**

> "A normal CRUD app just stores and edits records. SkillSwap has a matching algorithm that computes a score from two users' skill sets, a state machine for swap requests — pending, accepted, rejected, completed — with rules like 'only the receiver can accept,' and a review system where the rating is only allowed after completion and updates the user's average. Those rules and relationships are what make it more than CRUD."

### Q4. Who would use SkillSwap?

**Interview Answer:**

> "Students and developers mainly — anyone who knows something useful and wants to learn something else. For example, a frontend developer who wants to learn Docker could swap with a DevOps engineer who wants to learn React. No money changes hands; the exchange is the product."

---

## Architecture

### Q5. Explain the architecture.

**Concept:** Classic MERN separation — React frontend, Express REST API, MongoDB database.

**Interview Answer:**

> "It's a standard three-layer setup. React is a single-page app that talks to an Express REST API over HTTP using axios, sending a JWT as a Bearer token. Express routes hand off to controllers, which use Mongoose models to read and write MongoDB. The frontend never touches the database directly — everything goes through the API."

### Q6. Explain the request-response flow.

**Interview Answer:**

> "Take sending a swap request: the user clicks 'Swap Skills' on a match card, fills in the offered and requested skills, and React POSTs to /api/swaps with the JWT in the header. Express first runs the auth middleware to verify the token, then input validation, then the controller — which checks the receiver exists, blocks self-requests and duplicates — creates the SwapRequest document with status Pending, populates the related users and skills, and returns it as JSON. React then updates the UI."

### Q7. Why MERN?

**Interview Answer:**

> "JavaScript on both ends means one language for the whole stack, JSON flows naturally from MongoDB to the API to React without transformation, and MongoDB's flexible documents fit user profiles where fields like bio or skills vary per user. It also matches the jobs I'm applying for."

### Q8. Why React?

**Interview Answer:**

> "The UI is component-based — match cards, stat cards, skill tags get reused across the dashboard, discover page, and profile pages. State like the logged-in user lives in a context, and React Router gives me protected routes so pages like /dashboard redirect to /login when there's no session."

### Q9. Why Node.js?

**Interview Answer:**

> "It lets me write the backend in JavaScript, it's event-driven so it handles many concurrent API requests well, and the npm ecosystem has everything I needed — Express, Mongoose, bcrypt, JWT — without extra setup."

### Q10. Why Express?

**Interview Answer:**

> "It's minimal and unopinionated. I define routes per resource — auth, users, skills, swaps, reviews, matches, dashboard — attach middleware for auth and validation, and keep the logic in controllers. Nothing more than I need."

### Q11. Why MongoDB?

**Interview Answer:**

> "The data is document-shaped: a user has a profile with nested lists of skill references, a swap request links two users and two skills. MongoDB stores that naturally, and Mongoose gives me schemas, validation, and populate for resolving references — basically joins — in one query."

### Q12. Why a REST API?

**Interview Answer:**

> "REST maps cleanly onto what the app does — GET /api/matches to read matches, POST /api/swaps to create a request, PUT /api/swaps/:id to accept it. Each endpoint is stateless, uses standard HTTP methods and status codes, and any client could consume it, not just my React app."

### Q13. Why did you separate controllers, routes, and models?

**Interview Answer:**

> "So each file has one job. Routes declare the endpoint and its validation, controllers hold the request logic, and models define the data shape and hooks like password hashing. If something breaks, I know exactly which layer to look in — and I can explain the codebase file by file in an interview."

### Q14. How does the frontend communicate with the backend?

**Interview Answer:**

> "Through one axios instance in services/api.js. It sets the base URL from an env variable and has an interceptor that attaches the JWT from localStorage as an Authorization Bearer header on every request. Components call it, handle loading and error states, and render the JSON the API returns."

---

## Matching Algorithm

### Q15. How does SkillSwap find matches?

**Interview Answer:**

> "For the logged-in user and every other user, it computes two overlaps: skills I want that they teach, and skills they want that I teach — both by comparing skill IDs as sets. If both overlaps are non-zero it's a 2-way match; if only one side overlaps it's a 1-way match. Then it scores and sorts them."

### Q16. Explain the matching algorithm.

**Concept:** Two set intersections, one score formula.

**Interview Answer:**

> "Let a be the number of skills I want that the candidate teaches, and b be the number they want that I teach. If a plus b is zero, skip them. Strength is '2-way match' when both a and b are positive, else '1-way match'. The score is (a + b) divided by the total skills both sides are looking for, times 100, rounded and capped at 100. So if I'm looking for 2 skills and they're looking for 2, and we cover all 4 between us, that's 100."

### Q17. How is the match score calculated?

**Interview Answer:**

> "Score equals (a + b) / (|my wants| + |their wants|) × 100, rounded. For example, I want Docker and AWS, Rahul teaches Docker, AWS, and Kubernetes and wants React and JavaScript, which I teach. a is 2, b is 2, denominator is 2 + 2, so the score is 100. It answers: 'of everything the two of you are looking for, what percentage can you teach each other?'"

### Q18. Why did you not use AI?

**Interview Answer:**

> "It would be overkill. The rule is exact — a good swap is when each person teaches what the other wants — and set intersection expresses that perfectly. It's deterministic, needs no training data, runs in linear time per candidate, and I can explain it on a whiteboard in a minute."

### Q19. What happens if only one skill matches?

**Interview Answer:**

> "Then it's a 1-way match. Say you teach Docker which I want, but nothing I teach is on your want list — a is 1, b is 0, so the score is lower and the badge says '1-way match'. It's still shown because a one-sided connection can still lead to a swap."

### Q20. How would you improve the algorithm?

**Interview Answer:**

> "A few honest options: weight skills by the user's experience level, factor in the average rating so reliable swappers rank higher, or boost people with matching availability. At larger scale I'd precompute matches in the background instead of on every request. I kept the shipped version simple on purpose."

### Q21. What is the time complexity of your matching approach?

**Interview Answer:**

> "For each candidate it's O(n) where n is the number of skills involved — just set intersections. Over U users that's O(U × n), which is fine for hundreds or thousands of users. For millions I'd index it — for example, an aggregation that finds users teaching my wanted skills first, so I never scan everyone."

### Q22. How would you scale matching if there were millions of users?

**Interview Answer:**

> "I wouldn't compare against every user. I'd query MongoDB for only users who teach at least one skill I want — that's an indexed lookup — then score just those candidates. I could also cache match results and recompute them in a background job when profiles change instead of on every page load."

---

## MongoDB

### Q23. What collections do you have?

**Interview Answer:**

> "Four: users, skills, swaprequests, and reviews. Users reference skills in their teach and learn lists, swap requests reference two users and two skills, and reviews reference the reviewer, the reviewed user, and the swap."

### Q24. Why MongoDB?

**Interview Answer:**

> "The data fits documents — a user profile with lists of skill references, a swap request embedding its lifecycle. I don't need complex joins or transactions, and Mongoose populate resolves the references when I need the full objects. It's also what the MERN stack pairs with."

### Q25. Explain the User schema.

**Interview Answer:**

> "Name, email which is unique, password which is hidden from queries by default and hashed with bcrypt in a pre-save hook. Then profile fields — avatar URL, bio, location, experience level and availability enums — plus skillsToTeach and skillsToLearn as arrays of ObjectIds referencing the Skill collection, and a denormalized rating and ratingCount that get recalculated whenever a review is added."

### Q26. Explain SwapRequest.

**Interview Answer:**

> "It stores sender and receiver as user references, offeredSkill — what the sender teaches — and requestedSkill — what the sender wants to learn — as skill references, an optional message, and a status enum: Pending, Accepted, Rejected, Completed, Cancelled. Completion is two-sided: senderCompleted and receiverCompleted booleans track each side separately, and the status only flips to Completed when both are true — one side marking it done leaves the swap Active. There's also a partial unique index so the same pending request can't be created twice."

### Q27. Explain Review.

**Interview Answer:**

> "Reviewer, reviewedUser, and the swapRequest it belongs to — all references — plus a rating from 1 to 5 and an optional comment. A compound unique index on reviewer plus swapRequest enforces one review per participant per swap, and creating a review recalculates the reviewed user's average rating."

### Q28. How are users associated with requests?

**Interview Answer:**

> "Through the sender and receiver ObjectId references on the SwapRequest. To get 'my swaps' the API queries where sender equals my id OR receiver equals my id, then populates both sides so the frontend gets names and avatars without extra requests."

### Q29. Why use ObjectId references?

**Interview Answer:**

> "So there's a single source of truth. If a skill is renamed, every user's reference still resolves to the updated document — no duplicated strings drifting out of sync. References also let me populate related documents in one query and let MongoDB index the links for fast lookups."

### Q30. How do you query matching users?

**Interview Answer:**

> "The API loads the current user with populated skills, loads all other users with populated skills, and the matching function compares skill ID sets in JavaScript — no fancy query needed. For the discover page's search and filters, MongoDB does the work: regex on name, skill IDs matched by name or category, and direct matches on experience and availability."

### Q31. How do you prevent duplicate requests?

**Interview Answer:**

> "Two layers. The controller checks for an existing Pending request with the same sender, receiver, offered and requested skills and returns a 400 with a friendly message. Behind that, a partial unique index on those fields for Pending status enforces it at the database level even under race conditions."

---

## Authentication

### Q32. How does JWT work?

**Concept:** A signed token that proves identity without server-side sessions.

**Interview Answer:**

> "At login the server signs a token containing just the user id with a secret key and returns it. The frontend stores it and sends it back in the Authorization header as a Bearer token. The protect middleware verifies the signature on every request — if it's valid and not expired, the request continues with req.user.id set. The server never stores sessions."

### Q33. Why bcrypt?

**Interview Answer:**

> "Because passwords must never be stored in plain text. bcrypt hashes the password with a salt — ten rounds in my case — so even if someone reads the database they can't recover the original password. At login I compare the entered password against the hash with bcrypt.compare."

### Q34. How does protected routing work?

**Interview Answer:**

> "Two layers. On the frontend, a ProtectedRoute component checks the auth context — no logged-in user means redirect to /login. On the backend, the protect middleware rejects requests without a valid Bearer token with 401. The frontend check is for UX; the backend check is the real security."

### Q35. How does backend authorization work?

**Interview Answer:**

> "After authentication proves who you are, controllers check what you're allowed to do. Updating a profile compares the token's user id to the URL id — mismatch is 403. For swaps, accepting or rejecting requires you to be the receiver; completing or cancelling requires you to be a participant. Strangers get 403."

### Q36. How do you prevent users from modifying another user's data?

**Interview Answer:**

> "Every write endpoint checks ownership against req.user.id from the verified token — never against anything the client claims in the body. Profile updates, swap status changes, and deletions all verify the caller is the owner or a participant first."

### Q37. Why should passwords never be stored directly?

**Interview Answer:**

> "Because databases leak — backups, breaches, even a developer glancing at the data. A hash can't be reversed, so a stolen database doesn't hand over everyone's password, especially since people reuse passwords across sites."

### Q38. Why use environment variables?

**Interview Answer:**

> "Secrets like the JWT secret and the MongoDB connection string change between environments and must never be committed to git. Env vars keep them out of the codebase — .env is gitignored and only .env.example is committed as documentation."

---

## React

### Q39. How did you structure components?

**Interview Answer:**

> "Pages own the data fetching — Dashboard, Discover, My Swaps — and reusable presentational components render it: UserCard for a match, SkillTag for a skill pill, StatCard for dashboard numbers, plus shared EmptyState, Loader, and Modal components. Layout pieces like the Navbar and ProtectedRoute wrap the protected pages."

### Q40. How did you manage state?

**Interview Answer:**

> "Global auth state — user, token, login/logout — lives in an AuthContext so any component can read it. Page-level data like matches or swaps lives in useState inside each page with useEffect fetching it on mount. No Redux — the state needs are simple enough that context plus local state covers them."

### Q41. How do forms work?

**Interview Answer:**

> "Controlled inputs tied to useState, client-side validation before submit — required fields, email format, minimum password length — and the API's error message is displayed if the server rejects it. The swap-request modal is a form that posts the selected offered and requested skills."

### Q42. How do you fetch matches?

**Interview Answer:**

> "The Discover page calls GET /api/matches on mount through the axios instance, which attaches the JWT automatically. While it loads I show a loader, if the list is empty I show an empty state, and each match renders as a card with the score, strength badge, and overlapping skills."

### Q43. How do you handle loading?

**Interview Answer:**

> "Every data page has a loading flag set before the request and cleared after — rendering a spinner component in between. That way the UI never shows a half-empty page or stale data while fetching."

### Q44. How do you handle errors?

**Interview Answer:**

> "API calls are wrapped in try/catch; on failure I show the message the API returned — like 'You already have a pending request' — in an error banner or under the form. Network-level failures get a generic message. The backend always returns JSON errors with proper status codes, so the frontend can rely on the shape."

### Q45. How does filtering work?

**Interview Answer:**

> "The filter controls — search text, category, experience, availability — are component state. Changing them refetches GET /api/users with those values as query parameters, and the backend applies them in the MongoDB query: regex for the name search, skill lookups for the skill/category filters, direct matches for the enums."

### Q46. How do protected frontend routes work?

**Interview Answer:**

> "A ProtectedRoute wrapper reads the auth context. If there's no user — meaning no valid token — it navigates to /login. Otherwise it renders the page. On app load the context tries to restore the session by calling GET /api/auth/me with any stored token."

---

## CRUD

### Q47. Explain CRUD using SkillSwap examples.

**Interview Answer:**

> "- **Create:** sending a swap request — POST /api/swaps creates a Pending SwapRequest document.
> - **Read:** viewing your requests — GET /api/swaps returns them with populated users and skills.
> - **Update:** accepting or rejecting — PUT /api/swaps/:id changes the status, with role checks.
> - **Delete:** cancelling a sent request — DELETE /api/swaps/:id removes it, allowed only for the sender while it's still pending.
>
> Profile CRUD is the same idea: the profile page reads it, the edit form updates it via PUT /api/users/:id."

---

## Reviews

### Q48. Why did you add reviews?

**Interview Answer:**

> "Because an exchange platform needs trust. Ratings give users a reputation — a 4.8 with 'great at explaining React' tells the next person this swap is worth their time. Technically it also demonstrates another MongoDB relationship and derived data."

### Q49. When can a user leave a review?

**Interview Answer:**

> "Only after the swap's status is Completed, and only if you're one of the two participants. The controller rejects reviews on pending or active swaps with a 400 — you can't review an exchange that never happened."

### Q50. How is the rating stored?

**Interview Answer:**

> "Each Review document stores a rating from 1 to 5. The User document also keeps a denormalized rating and ratingCount — the average, rounded to one decimal — so profile pages don't have to aggregate reviews on every read."

### Q51. How is average rating calculated?

**Interview Answer:**

> "When a review is created, the controller fetches all reviews for the reviewed user, averages their ratings, rounds to one decimal place, and updates the user's rating and ratingCount fields."

### Q52. How do you prevent invalid ratings?

**Interview Answer:**

> "The route validates that rating is an integer between 1 and 5 with express-validator, and the Mongoose schema also enforces min 1 and max 5 — so it's checked at both the API boundary and the database layer."

### Q53. How do you prevent reviewing an incomplete swap?

**Interview Answer:**

> "The controller loads the swap and returns 400 unless its status is Completed. It also verifies the reviewer is a participant, and the unique index on reviewer plus swapRequest stops a second review of the same swap."

---

## Security

### Q54. How do you protect API routes?

**Interview Answer:**

> "The protect middleware on every route except register and login verifies the JWT signature and expiry. No token or a bad token means an immediate 401, before any controller logic runs."

### Q55. How do you prevent unauthorized profile updates?

**Interview Answer:**

> "PUT /api/users/:id compares the id from the verified token with the id in the URL. If they don't match, it's a 403. And only whitelisted fields can be updated — you can't sneak in extra fields through the request body."

### Q56. How do you prevent one user from modifying another user's swap?

**Interview Answer:**

> "The swap controller checks that the caller is the sender or receiver — anyone else gets 403. Then it checks the role for the specific action: only the receiver can accept or reject, either participant can complete or cancel. Wrong role or wrong state means rejection."

### Q57. Why hash passwords?

**Interview Answer:**

> "So a database breach doesn't expose usable passwords. bcrypt is a one-way salted hash — verification works by comparing, but the original password can't be recovered from the stored value."

### Q58. Why JWT?

**Interview Answer:**

> "It's stateless — the server doesn't keep a session store, it just verifies the token's signature on each request. That keeps the API simple and horizontally scalable, and the token carries the user id the controllers need for authorization checks."

### Q59. What information should never be returned from an API?

**Interview Answer:**

> "Passwords, first of all — the schema hides them with select: false and I delete the field as a backstop. Also other users' emails — the profile endpoint only includes the email when you're viewing your own profile. And secrets like the JWT secret never leave the server at all."

---

## Challenges

### Q60. What was the hardest part?

**Interview Answer:**

> "Getting the swap lifecycle rules right — who can do what, in which state. I ended up separating the role check from the transition check in the controller: first verify you're the receiver for accept/reject, then verify the swap is in Pending. Writing it as two explicit checks made the logic easy to test and explain."

### Q61. How did you implement the matching algorithm?

**Interview Answer:**

> "It's a small pure function in utils/match.js. It converts each user's teach and learn lists into sets of skill IDs, intersects them in both directions, computes the score with the formula, and sorts. Keeping it separate from the controller meant both the matches endpoint and the dashboard could reuse it — and I could reason about it without any HTTP code in the way."

### Q62. What bugs did you encounter?

**Interview Answer:**

> "A couple of good ones. My test compared the registered email case-sensitively, but express-validator's normalizeEmail lowercases it — the API was right, my test was wrong. I also caught an authorization subtlety early: my first version returned 400 for every bad swap transition, but 'the sender tried to accept their own request' is really a 403 — wrong role, not wrong state — so I split the role check from the transition check. The trickiest one was a UI bug: my Avatar component kept a `failed` flag once an image errored, and it never reset — so if your old picture 404'd even once, every avatar on screen got stuck on initials, and new uploads looked broken until you logged out and back in. The fix was three lines: reset the flag whenever the image source changes. All of them taught me to verify with real requests rather than assume."

### Q63. How did you debug them?

**Interview Answer:**

> "I wrote a live API test script that hits the real server and asserts status codes and response shapes — register, login, the whole swap lifecycle, reviews, auth guards. Running it after every change caught regressions immediately instead of clicking through the UI."

### Q64. What did you learn?

**Interview Answer:**

> "How authorization differs from authentication — it's not enough to know who the user is, every endpoint has to check what they're allowed to touch. I also learned to keep derived data like the average rating denormalized deliberately, and that a simple deterministic algorithm beats a clever one you can't explain."

### Q65. What would you change if you rebuilt the project?

**Interview Answer:**

> "I'd add refresh tokens instead of a single long-lived JWT, paginate the matches endpoint from the start, and write the API tests first — they saved me a lot of time once they existed. I might also move the matching into a MongoDB aggregation so the database does the filtering before scoring."

### Q66. What would you add in the future?

**Interview Answer:**

> "Real-time chat for swap partners, session scheduling, and notifications when a request arrives — those are the natural next steps. I deliberately left them out to keep the project something I can fully explain, but the data model already supports building them on top."

---

## Skill Management & Completion

### Q67. How does a swap get completed? Why two-sided?

**Interview Answer:**

> "Each participant marks only their own side as done — PUT /api/swaps/:id with status Completed sets senderCompleted if you're the sender, receiverCompleted if you're the receiver. The status stays Accepted until both flags are true, then flips to Completed. One-sided completion would let someone close a swap their partner never finished, so the swap is only done when both sides agree it's done. Marking your own side twice is a 400."

### Q68. Why is there no separate Swaps collection for active swaps?

**Interview Answer:**

> "Because an Accepted SwapRequest already has everything an active swap needs — both participants, both skills, the message, and the two completion flags. A separate collection would duplicate that data and need keeping in sync. Same reason there's no UserSkills join table: teach and learn are just ObjectId arrays on the user. Fewer collections, same relationships, easier to explain."

### Q69. How do users manage their skills?

**Interview Answer:**

> "There's a dedicated My Skills page with one picker per list — teach and learn. Each picker has a dropdown of the skill catalog grouped by category, plus an inline form to create a new skill with a name and category — POST /api/skills, which returns 409 if the name already exists. Selected skills show as removable chips, and the dropdown only offers skills you haven't picked, so duplicates are impossible in the UI. Every add and remove saves to the database immediately through PUT /api/users/:id — there's deliberately no save button, because an earlier version had one and users lost skills by navigating away before clicking it. Rapid clicks are safe: saves are queued with a promise chain so the last change always wins on the server, and the response refreshes the auth state so the navbar and dashboard update too."

### Q70. What stops someone from sending a bogus swap request?

**Interview Answer:**

> "The backend checks everything the form promises. The receiver must exist, it can't be yourself, the offered skill must be in your teach list and the requested skill in their teach list — so you can't offer React if you never listed it. Then a duplicate check plus a partial unique index block a second pending request for the same skill pair. The request modal only offers valid choices, but the API re-validates because a client can always be bypassed."

### Q71. How does Discover feel real-time without WebSockets?

**Interview Answer:**

> "Short polling. The Discover page re-fetches GET /api/matches every 10 seconds with setInterval, plus a manual Refresh button and a Live indicator showing the last-updated time. The interval is created in a useEffect and cleared on unmount, so polling is scoped to Discover only. When another user adds a skill, the next poll picks it up and their match card appears. I deliberately didn't use WebSockets — polling is stateless, needs no extra server or library, and I can explain it in one sentence. WebSockets are on the future-improvements list for true push updates."

### Q72. How does avatar upload work?

**Interview Answer:**

> "The profile page has a file input with an instant client-side preview via URL.createObjectURL. On save, the frontend sends multipart/form-data with native fetch — not axios, because axios force-defaults the Content-Type of PUT requests to application/x-www-form-urlencoded when none is set, which stops the browser from generating the multipart boundary multer needs; the file would silently never arrive even though the request returns 200. That was a real bug I hit: uploads looked successful but the picture never changed. On the backend, multer handles the single 'avatar' field: disk storage under server/uploads/avatars/, image mimetypes plus extension whitelist, 2MB cap, and filenames are generated as userId plus timestamp — never the client's filename. The file is served back by express.static at /uploads, and the Avatar component prefixes relative /uploads paths with the API origin. When an avatar is replaced or the account deleted, the old file is removed from disk; if validation fails after multer saved a file, the controller deletes the orphan."

### Q73. How does change password work?

**Interview Answer:**

> "PUT /api/users/:id/password with the current and new password. It's auth-protected and 403s unless the id matches your token. The controller loads the user with the password hash, bcrypt-compares the current password — 401 if it's wrong — and saves the new one, which the User model's pre-save hook hashes automatically. express-validator enforces the 6-character minimum. The frontend asks for current, new, and confirm, and shows success or error feedback."

### Q74. What happens when a user deletes their account?

**Interview Answer:**

> "DELETE /api/users/:id, own account only, after a confirm dialog. The backend cascades: it deletes every swap request where the user is sender or receiver, deletes every review they gave or received, and recomputes the average rating of anyone they reviewed so no stale score remains. Their uploaded avatar file is removed from disk, then the user document is deleted. The frontend clears the token, navigates to the landing page, and shows a 'Your account has been deleted' notice passed via router state."

### Q75. What bug did the multipart validation order cause?

**Interview Answer:**

> "When I added avatar upload, I put multer after the express-validator checks in the route chain. With multipart/form-data, req.body is empty until multer parses it — so every body validator silently passed and a client could send an invalid experience level or an empty name straight through to the database. The fix was ordering: multer first, then a small middleware that JSON-parses the skill arrays, then the validators. I added regression tests that send bad values as multipart and expect 400s. The lesson: middleware order is part of the security model, not just plumbing."
