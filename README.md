# SkillSwap — Peer-to-Peer Skill Exchange Platform

> A full-stack MERN application where people exchange skills with each other instead of paying for courses. **"I teach you what I know, and you teach me what you know."**

---

## 1. Project Overview

**The 30–60 second explanation:**

SkillSwap is a platform where users list the skills they can teach and the skills they want to learn, and the app finds people with complementary skills so they can exchange knowledge. For example, if I know React and want to learn Docker, and you know Docker and want to learn React, SkillSwap identifies us as a strong match and lets me send you a swap request. You can accept or reject it, mark the exchange complete when you're done, and leave each other a rating and review.

**What problem it solves:** Finding someone to learn from usually means paying for a course or getting lucky on a forum. There is no simple way to find a person who wants exactly what you know and knows exactly what you want.

**Who uses it:** Students, developers, designers — anyone who has a skill to share and something they want to learn.

**Why I built it:** To learn full-stack development by building something with a real workflow — authentication, profiles, search, a matching algorithm, a request/approval flow, and reviews — instead of another basic to-do CRUD app.

**What makes it different from a normal CRUD project:** The core feature is a **matching algorithm** that compares two users' skill sets in both directions and scores how good a swap would be. On top of that there is a full request lifecycle (pending → accepted/rejected → completed), role-based authorization (only the receiver can accept), and a review system that feeds back into user ratings.

---

## 2. Problem Statement

Learning a new skill usually costs money (courses, bootcamps) or a lot of time searching for free resources. At the same time, everyone already knows something valuable — a developer knows React, a designer knows Figma, a DevOps engineer knows Docker. There is no easy way to discover that *the person who can teach you is also looking to learn what you know*. SkillSwap exists to make that two-way discovery trivial.

## 3. Solution

Every user creates a profile with two lists: **skills I can teach** and **skills I want to learn**. SkillSwap's matching algorithm compares every pair of users in both directions and ranks candidates by a match score. Users can browse matches, search and filter by skill/category/experience/availability, view public profiles, send swap requests ("I'll teach you React if you teach me Docker"), accept or reject incoming requests, mark swaps complete, and leave ratings and reviews that build each user's reputation.

## 4. Example

**Person A — Srijan:**
- Teaches: React, JavaScript, MongoDB
- Wants to learn: Docker, AWS

**Person B — Rahul:**
- Teaches: Docker, AWS, Kubernetes
- Wants to learn: React, JavaScript

SkillSwap sees that Rahul teaches 2 skills Srijan wants (Docker, AWS) and Srijan teaches 2 skills Rahul wants (React, JavaScript) — a **2-way match with a score of 100**. Srijan sends a swap request offering React and requesting Docker; Rahul accepts; they exchange knowledge; both mark it complete and leave reviews.

## 5. Key Features

- **Authentication** — register, login, logout with JWT; passwords hashed with bcrypt; protected frontend routes and protected API routes. Logout returns you to the landing page.
- **User profiles** — name, bio, location, avatar image upload, experience level (Beginner/Intermediate/Advanced), availability (Weekdays/Weekends/Evenings/Flexible), average rating, completed-swap count — plus change-password and delete-account (with cascade cleanup) sections.
- **My Skills page** — the dedicated place to manage "Skills I can teach" and "Skills I want to learn": pick from the catalog dropdown (grouped by category), create a brand-new skill inline when it's missing, remove with one click; duplicates impossible. Every add/remove saves to the database immediately (no separate save button — what you see is what's stored), with saves queued so rapid clicks can't race.
- **Skill matching** — deterministic matching algorithm that finds complementary users and scores them 0–100 with a "2-way match" / "1-way match" strength label.
- **Discover page** — search by name or skill; filter by skill category, experience level, and availability. Feels live: the match list re-fetches every 10 seconds (short polling, not WebSockets), with a "Live" indicator showing the last-updated time and a manual Refresh button.
- **Swap requests** — send requests via a modal ("I want to learn" from *their* teaching skills, "I can teach" from *yours*, optional message); request lifecycle: Pending → Accepted/Rejected → Completed (or Cancelled). Completion is two-sided: each participant marks their own side, and the swap completes only when both have.
- **My Swaps page** — tabs for Incoming, Sent, Active, and Completed swaps with the right actions on each (accept/reject with confirm, cancel/delete, per-side mark complete, leave review). A pending-request badge on the nav's "My Swaps" link.
- **Avatar upload** — upload a profile picture (jpeg/png/webp/gif, max 2MB) stored on the server and served at `/uploads`; safe generated filenames; the old file is deleted when replaced. The frontend sends the multipart request with native `fetch` (axios would override the Content-Type and break the multipart boundary multer needs). A broken or missing avatar never shows a broken image — an initials badge renders instead.
- **Reviews & ratings** — 1–5 star rating plus comment, allowed only after a swap is completed, once per participant per swap; the reviewed user's average rating updates automatically.
- **Dashboard** — stat cards (skills taught/wanted, pending/active/completed counts), top 5 recommended partners, and a recent-activity feed.
- **Responsive UI** — dark developer/SaaS aesthetic that works on mobile, tablet, and desktop; proper loading, empty, and error states on every page.

## 6. Tech Stack

| Technology | Why it's used |
|---|---|
| React 18 + Vite | Component-based UI; Vite gives a fast dev server and build. |
| React Router v6 | Client-side routing for pages (dashboard, discover, profile, swaps) plus protected routes. |
| Tailwind CSS v3 | Utility-first styling for the dark SaaS design without writing custom CSS files. |
| Axios | HTTP client with a single configured instance (base URL + JWT interceptor). |
| Node.js + Express 4 | REST API server; Express routing keeps each resource in its own route file. |
| MongoDB + Mongoose 8 | Document database; Mongoose schemas model the relationships (users ↔ skills ↔ swaps ↔ reviews) and enforce validation. |
| bcryptjs | Password hashing — passwords are never stored in plain text. |
| jsonwebtoken | Stateless authentication — the server issues a signed token at login; the client sends it as a Bearer token. |
| express-validator | Input validation on every write endpoint (email format, rating range, valid ids, enums). |
| multer | Avatar image uploads — disk storage, image-only filter, 2MB cap, safe generated filenames. |
| Docker / Compose | Optional one-command run of MongoDB + API + frontend. |

## 7. Architecture

```text
React (Vite SPA)
   │  axios, Authorization: Bearer <JWT>
   ▼
REST API (/api/...)
   │
   ▼
Express — routes → controllers → Mongoose models
   │
   ▼
MongoDB (users, skills, swaprequests, reviews)
```

**Request–response flow (example: sending a swap request):**
1. The user clicks "Swap Skills" on a match card; React opens a modal with the offered/requested skill dropdowns.
2. On submit, axios POSTs to `/api/swaps` with the JWT in the `Authorization` header.
3. Express runs `protect` (verifies the token), then `express-validator` checks, then `createSwap` in the controller.
4. The controller verifies the receiver exists, blocks self-requests, checks the offered skill is in the sender's teach list and the requested skill is in the receiver's teach list, blocks duplicate pending requests, and creates a `SwapRequest` document with status `Pending`.
5. Mongoose populates sender/receiver/skills and the API returns the created swap as JSON; React updates the UI.

## 8. Matching Algorithm

This is the heart of SkillSwap. It lives in `server/src/utils/match.js` and is used by both `GET /api/matches` and `GET /api/dashboard`.

**Step by step, for the logged-in user U and each other user C:**

1. **a = skills U wants ∩ skills C teaches** — "what you can learn from them."
2. **b = skills C wants ∩ skills U teaches** — "what they can learn from you."
3. If `a + b == 0`, skip C (no overlap, not a match).
4. **strength** = `"2-way match"` if `a > 0` **and** `b > 0`, otherwise `"1-way match"`.
5. **score** = `round((a + b) / (|U.wants| + |C.wants|) × 100)`, capped at 100.
   It answers: *"of all the skills the two of you are looking for, what percentage can you teach each other?"*
6. Sort all candidates by score, highest first; return the top N (`?limit=`, default 20).

**Worked example (Srijan vs Rahul):**
- Srijan wants {Docker, AWS} (2), teaches {React, JavaScript, MongoDB}
- Rahul teaches {Docker, AWS, Kubernetes}, wants {React, JavaScript} (2)
- a = {Docker, AWS} → 2, b = {React, JavaScript} → 2
- score = (2 + 2) / (2 + 2) × 100 = **100**, strength = **2-way match**

**Why no AI/ML:** the rule is exact and explainable — two users are a good swap when each one teaches what the other wants. A percentage over set intersections is deterministic, needs no training data, and runs in O(n) per candidate.

## 9. Database Schema

Four collections, linked with ObjectId references:

**User**
| Field | Type | Notes |
|---|---|---|
| name / email / password | String | email unique; password `select: false` (never returned), bcrypt-hashed |
| avatar / bio / location | String | optional profile info |
| experienceLevel | String | `Beginner` / `Intermediate` / `Advanced` |
| availability | String | `Weekdays` / `Weekends` / `Evenings` / `Flexible` |
| skillsToTeach / skillsToLearn | ObjectId[] | references → `Skill` |
| rating / ratingCount | Number | denormalized average, recomputed on each review |

**Skill** — `{ name (unique), category }`. Category is one of Frontend, Backend, Database, Cloud, DevOps, Programming, Design, Marketing, Other.

**SwapRequest** — `{ sender → User, receiver → User, offeredSkill → Skill, requestedSkill → Skill, message, status, senderCompleted, receiverCompleted }`. Status is `Pending` / `Accepted` / `Rejected` / `Completed` / `Cancelled`. Completion is **two-sided**: each participant marks only their own side (`senderCompleted` / `receiverCompleted`), and status flips to `Completed` only when **both** are true — an `Accepted` swap with one side done is still an active swap. A partial unique index on `(sender, receiver, offeredSkill, requestedSkill)` where `status = 'Pending'` prevents duplicate pending requests at the database level.

**Why no separate `Swaps` collection or `UserSkills` join table?** Deliberate simplicity: an `Accepted` SwapRequest already *is* the active swap record (both participants, both skills, both completion flags in one document), and `skillsToTeach` / `skillsToLearn` are plain ObjectId-ref arrays on User — no join collection needed for a many-to-many link in MongoDB. Fewer collections, same relationships, easier to explain.

**Review** — `{ reviewer → User, reviewedUser → User, swapRequest → SwapRequest, rating (1–5), comment }`. A compound unique index on `(reviewer, swapRequest)` guarantees one review per participant per swap.

**Relationships:** a User *has many* skills to teach/learn (references), *has many* sent and received swap requests (queried by `sender`/`receiver`), and *has many* received reviews (queried by `reviewedUser`). Skills are referenced rather than embedded so renames stay consistent and `populate()` resolves them in a single query.

## 10. API Documentation

Base URL: `http://localhost:5000/api`. All routes except register/login require `Authorization: Bearer <token>`. Errors are always `{ message }` JSON.

### Authentication

| Method | Endpoint | Purpose | Auth | Body | Response |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | Create account | No | `{ name, email, password }` | `201 { token, user }` — `409` if email exists |
| POST | `/api/auth/login` | Sign in | No | `{ email, password }` | `200 { token, user }` — `401` on bad credentials |
| GET | `/api/auth/me` | Restore session from token | Yes | — | `200 user` |

### Users

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/users` | Browse users | Yes | Query: `search` (name), `skill` (skill name), `category`, `experienceLevel`, `availability`. Email hidden for other users. |
| GET | `/api/users/:id` | Public profile | Yes | Adds `completedSwaps` count. Email shown only for your own profile. |
| PUT | `/api/users/:id` | Edit profile | Yes | `403` unless it's your own id. Accepts JSON **or** `multipart/form-data` (when an `avatar` image is uploaded: jpeg/png/webp/gif, max 2MB, stored under `/uploads/avatars/`; the previous local file is deleted on replace). With multipart, `skillsToTeach`/`skillsToLearn` arrive JSON-encoded and are parsed back into arrays. Body: `name, bio, location, avatar, experienceLevel, availability, skillsToTeach[], skillsToLearn[]`. Skill arrays are deduped and empties dropped server-side; every id must be a real skill; avatar must be a valid URL or an `/uploads/` path if provided. |
| PUT | `/api/users/:id/password` | Change password | Yes | `403` unless it's your own id. Body: `{ currentPassword, newPassword }`. `401` if the current password is wrong; `400` if the new password is under 6 characters. The new password is bcrypt-hashed by the User model's pre-save hook. |
| DELETE | `/api/users/:id` | Delete account | Yes | `403` unless it's your own id. Cascade: deletes all swap requests where you are sender or receiver, all reviews you gave or received (recomputing the average rating of anyone you reviewed), and your uploaded avatar file. |

### Skills

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/skills` | List all skills | Yes | Query: `category`. Sorted by name. |
| POST | `/api/skills` | Add a new skill to the catalog | Yes | `{ name, category? }` → `201`. `409` (with the existing skill) if the name already exists (case-insensitive). |

### Matches

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/matches` | Ranked skill partners | Yes | Query: `limit` (default 20). Returns `{ user, score, strength, teachOverlap, learnOverlap, skillsYouCanLearn[], skillsTheyCanLearn[] }`. |

### Swap Requests

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/swaps` | My swaps (sent + received) | Yes | Query: `status`. Populated sender/receiver/skills. |
| POST | `/api/swaps` | Send a request | Yes | `{ receiver, offeredSkill, requestedSkill, message? }` → `201` (Pending). `400` for: self-requests, duplicate pending requests, invalid skill ids, offering a skill you don't teach, requesting a skill they don't teach. |
| PUT | `/api/swaps/:id` | Accept / reject / complete / cancel | Yes | `{ status }`. Only the receiver can accept/reject (`403` otherwise). Completing is two-sided: each participant marks only their own side (`senderCompleted` / `receiverCompleted`); status becomes `Completed` only when both sides are done — marking your own side twice is a `400`. Cancelling is open to either participant (from Pending/Accepted). Invalid transitions → `400`. |
| DELETE | `/api/swaps/:id` | Delete a request | Yes | Only the sender, only when Pending/Rejected/Cancelled. |

### Reviews

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| POST | `/api/reviews` | Leave a review | Yes | `{ swapRequest, rating (1–5), comment? }` → `201`. Only for Completed swaps, only by a participant, only once per participant per swap. Updates the reviewed user's average rating. |
| GET | `/api/reviews/user/:userId` | Reviews for a user | Yes | Reviewer populated, newest first. |

### Dashboard

| Method | Endpoint | Purpose | Auth | Notes |
|---|---|---|---|---|
| GET | `/api/dashboard` | Dashboard data | Yes | `{ stats: { skillsToTeach, skillsToLearn, pendingIncoming, pendingSent, activeSwaps, completedSwaps }, topMatches[5], recentActivity[5] }` |

## 11. Authentication

1. **Register/Login:** the server validates input, bcrypt-compares (login) or bcrypt-hashes (register, via the User model's `pre('save')` hook) the password, and signs a JWT containing only the user id (`{ id }`), expiring in 7 days by default.
2. **Using the API:** the React app stores the token in `localStorage` and an axios interceptor attaches it as `Authorization: Bearer <token>` on every request.
3. **Protecting routes:** the `protect` middleware (backend) verifies the token's signature with `JWT_SECRET` and sets `req.user.id`; without a valid token the API returns `401`. The frontend's `ProtectedRoute` component redirects to `/login` when there is no logged-in user.
4. **Authorization:** beyond authentication, controllers check *ownership* — e.g. `PUT /api/users/:id` returns `403` unless the token id matches the URL id, and swap updates check that the caller is the sender/receiver with the right role.

## 12. Folder Structure

```text
skillswap/
├── README.md / INTERVIEW_QA.md / .env.example / .gitignore / docker-compose.yml
├── server/
│   ├── package.json            # express, mongoose, bcryptjs, jsonwebtoken, multer, ...
│   ├── Dockerfile / .dockerignore
│   ├── uploads/avatars/        # uploaded profile pictures (gitignored; served at /uploads)
│   └── src/
│       ├── server.js           # app setup, /uploads static serving, route mounting, error handler
│       ├── config/db.js        # MongoDB connection
│       ├── models/             # User, Skill, SwapRequest, Review (Mongoose schemas)
│       ├── middleware/         # auth.js (JWT protect), upload.js (multer avatar config)
│       ├── routes/             # auth, users, skills, swaps, reviews, matches, dashboard
│       ├── controllers/        # request handlers (one file per resource)
│       ├── utils/              # match.js (matching algorithm), helpers.js, seed.js
│       └── tests/              # live-api, edge-cases, e2e-flow, account tests (run against a live server)
└── client/
    ├── package.json            # react, react-router-dom, axios, tailwindcss
    ├── Dockerfile / .dockerignore / .env.example / nginx.conf
    ├── vite.config.js / tailwind.config.js / postcss.config.js
    └── src/
        ├── main.jsx / App.jsx / index.css
        ├── context/AuthContext.jsx   # user, token, login/register/logout, session restore
        ├── services/api.js           # axios instance + JWT interceptor (+ FormData fix)
        ├── hooks/useSwapRequest.js   # shared send-request logic (Discover + profile)
        ├── utils/                    # avatar initials + /uploads URL resolver, date formatting
        ├── components/               # Navbar, Layout, ProtectedRoute, UserCard, SkillTag,
        │                             # StatCard, EmptyState, Loader, Stars, Modal,
        │                             # SwapRequestForm, ReviewForm, SkillPicker, Avatar
        └── pages/                    # Landing, Login, Register, Dashboard,
                                      # Discover, MySkills, UserProfile, Profile (edit), Swaps
```

Routes, controllers, and models are separated so each file has one job: routes declare endpoints + validation, controllers contain the logic, models define the data shape. That separation is what makes the codebase easy to explain file by file.

## 13. Installation

```bash
# 1. Clone and enter the project
git clone <your-repo-url> skillswap
cd skillswap

# 2. Backend
cd server
npm install
cp ../.env.example .env   # then edit .env (at least JWT_SECRET and MONGO_URI)

# 3. Frontend (new terminal)
cd client
npm install
cp .env.example .env      # VITE_API_URL defaults to http://localhost:5000/api
```

Requirements: Node.js 18+, MongoDB running locally (or `docker compose up` — see §16).

## 14. Environment Variables

See `.env.example` at the repo root (documented). The server reads `server/.env`:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Port the API listens on |
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret used to sign JWTs — use a long random string |
| `JWT_EXPIRE` | No | `7d` | Token lifetime |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed CORS origin |

The client reads `client/.env`:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL of the API |

`.env` files are gitignored — only `.env.example` is committed.

## 15. Running the Application

```bash
# Terminal 1 — seed demo data (optional, run once)
cd server
npm run seed
# Creates 12 skills, 6 demo users (password: password123 for all),
# plus one completed swap with a review.

# Terminal 1 — start the API
npm run dev        # with auto-reload (node --watch)
# or: npm start

# Terminal 2 — start the frontend
cd client
npm run dev        # → http://localhost:5173
```

Demo logins after seeding: `srijan@demo.com`, `rahul@demo.com`, `priya@demo.com`, `arjun@demo.com`, `sneha@demo.com`, `vikram@demo.com` — password `password123` for all. (These exist only in the seed script, clearly marked as demo data.)

Uploaded avatars are served by the API server itself at `http://localhost:5000/uploads/avatars/<filename>` (via `express.static`); the files live in `server/uploads/` and are gitignored.

## 16. Docker

A minimal `docker-compose.yml` runs all three pieces: MongoDB, the API, and the frontend.

```bash
docker compose up --build
# Frontend → http://localhost
# API      → http://localhost:5000

# Seed demo data inside the stack:
docker compose exec server npm run seed
```

`server/Dockerfile` installs production dependencies and runs `node src/server.js`; `client/Dockerfile` is a two-stage build (Node builds the Vite app, nginx serves the static files).

## 17. Future Improvements

Ideas I deliberately did **not** build (kept out to stay simple and explainable):

- Real-time chat between swap partners (would need WebSockets)
- Live updates via WebSockets — Discover currently re-fetches matches every 10 seconds (short polling), which is simpler, stateless, and easy to explain; true push updates are a future step
- Session scheduling / calendar integration
- Video sessions
- Skill verification or endorsements
- Smarter recommendations (weighted skills, collaborative filtering)
- Notifications (email/push) for new requests
- Password reset via email
