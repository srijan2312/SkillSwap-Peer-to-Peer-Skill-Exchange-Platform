# SkillSwap — Peer-to-Peer Skill Exchange Platform

> A full-stack MERN application where people exchange skills with each other instead of paying for courses.
> **"I teach you what I know, and you teach me what you know."**

[![Live Demo](https://img.shields.io/badge/Live-Demo-000000?style=for-the-badge)](https://skill-swap-peer-to-peer-skill-excha-lovat.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel)](https://skill-swap-peer-to-peer-skill-excha-lovat.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://skillswap-api-ul44.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Example](#example)
- [Key Features](#key-features)
- [User Workflow](#user-workflow)
- [Matching System](#matching-system)
- [Swap Request Lifecycle](#swap-request-lifecycle)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Design](#database-design)
- [Authentication and Security](#authentication-and-security)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Docker](#docker)
- [Testing](#testing)
- [Deployment](#deployment)
- [Engineering Decisions](#engineering-decisions)
- [Challenges and Solutions](#challenges-and-solutions)
- [Future Improvements](#future-improvements)
- [Current Project Scope](#current-project-scope)
- [Author](#author)

---

## Overview

SkillSwap is a full-stack peer-to-peer skill exchange platform built with the MERN stack.

Instead of paying for a course or searching through unrelated communities, users can find people who:

- Have skills they want to learn
- Want to learn skills they already know
- Are available for a skill exchange

For example:

> I know React and want to learn Docker.
> Another user knows Docker and wants to learn React.
> SkillSwap identifies the complementary match and allows both users to start a skill swap.

The application supports the complete workflow:

**Register → Build Profile → Add Skills → Discover Matches → Send Swap Request → Accept/Reject → Complete Swap → Review**

The project was designed to demonstrate real full-stack development concepts rather than only basic CRUD operations.

---

## Problem Statement

Learning a new skill often requires:

- Paying for courses
- Searching through multiple platforms
- Finding instructors
- Joining communities
- Spending time looking for the right person

At the same time, most people already have useful skills that they could teach to someone else.

The problem is that there is no simple way to discover:

> "Someone who can teach me what I want to learn and also wants to learn what I already know."

SkillSwap solves this by matching users based on complementary skill sets.

---

## Solution

Every user maintains two skill lists:

- **Skills I Can Teach**
- **Skills I Want to Learn**

The matching system compares these lists between users.

If:

- User A can teach something User B wants
- User B can teach something User A wants

then they form a strong two-way match.

Users can then:

1. View the matched profile
2. Select the skills involved in the exchange
3. Send a swap request
4. Accept or reject the request
5. Complete the swap
6. Leave a rating and review

---

## Example

### Person A

**Teaches**

- React
- JavaScript
- MongoDB

**Wants to Learn**

- Docker
- AWS

### Person B

**Teaches**

- Docker
- AWS
- Kubernetes

**Wants to Learn**

- React
- JavaScript

SkillSwap detects:

- Docker and AWS → skills Person A wants
- React and JavaScript → skills Person B wants

This creates a:

**2-way match**

with a high match score.

Person A can send a request such as:

> "I'll teach you React if you teach me Docker."

Person B can accept the request and the exchange moves through the swap lifecycle.

---

## Key Features

### Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing with bcrypt
- Protected frontend routes
- Protected backend routes
- Session restoration
- Secure logout flow

### User Profiles

Users can manage:

- Name
- Bio
- Location
- Profile avatar
- Experience level
- Availability
- Skills they can teach
- Skills they want to learn
- Ratings
- Completed swaps

Users can also:

- Change their password
- Delete their account

Account deletion performs server-side cleanup of associated data.

### Skill Management

The My Skills page allows users to:

- Add skills they can teach
- Add skills they want to learn
- Select skills from the skill catalog
- Create a new skill when necessary
- Remove skills
- Prevent duplicate skills
- Save changes directly to the database

### Skill Matching

SkillSwap uses a deterministic matching algorithm.

The algorithm:

- Compares the current user's desired skills with another user's teaching skills
- Compares the other user's desired skills with the current user's teaching skills
- Calculates a match score
- Identifies one-way and two-way matches
- Sorts candidates by match score

This makes the recommendation system explainable and predictable.

### Discover

Users can discover other users using:

- Name search
- Skill search
- Skill category
- Experience level
- Availability

The Discover page periodically refreshes match data so users can see recent changes without manually refreshing the browser.

### Swap Requests

Users can send skill exchange requests containing:

- Receiver
- Skill they want to learn
- Skill they can teach
- Optional message

The system validates that:

- The sender exists
- The receiver exists
- The sender is not requesting themselves
- The offered skill belongs to the sender
- The requested skill belongs to the receiver
- A duplicate pending request does not already exist

### Swap Management

Users can:

- View incoming requests
- View sent requests
- Accept requests
- Reject requests
- Cancel eligible requests
- Mark their side of a swap as complete
- View active swaps
- View completed swaps
- Leave reviews

### Two-Sided Completion

A swap does not become completed when only one person marks it complete.

Instead:

```text
Sender completes
       +
Receiver completes
       ↓
Swap becomes Completed
```

### Reviews and Ratings

After a swap is completed, participants can:

- Give a rating from 1–5
- Add a written review

The system prevents duplicate reviews from the same participant for the same swap.

The reviewed user's average rating is updated automatically.

### Avatar Uploads

Profile avatars support:

- JPEG
- PNG
- WebP
- GIF

Maximum upload size:

**2 MB**

Images are uploaded to **Cloudinary** rather than being stored permanently on the application server.

The database stores the secure Cloudinary URL.

### Dashboard

The dashboard provides:

- Skills the user teaches
- Skills the user wants to learn
- Pending incoming swaps
- Pending sent swaps
- Active swaps
- Completed swaps
- Recommended users
- Recent activity

### Account Deletion

Users can permanently delete their account through a custom confirmation dialog.

The deletion flow:

```text
Confirm deletion
       ↓
Delete related swap requests
       ↓
Delete related reviews
       ↓
Delete Cloudinary avatar
       ↓
Delete user account
       ↓
Logout
       ↓
Return to landing page
```

Deleted credentials cannot be used to log in again.

If the same email is later registered again, it creates a completely new account.

### Responsive UI

The application is designed for:

- Desktop
- Tablet
- Mobile

The interface includes:

- Loading states
- Empty states
- Error states
- Responsive navigation
- Responsive cards
- Mobile-friendly forms
- Responsive modals

---

## User Workflow

### 1. Register

The user creates an account with:

- Name
- Email
- Password

### 2. Complete Profile

The user adds:

- Bio
- Location
- Experience
- Availability
- Avatar

### 3. Add Skills

The user chooses:

- Skills they can teach
- Skills they want to learn

### 4. Discover People

The user browses recommended skill partners.

### 5. Check Match

The matching system shows:

- Match score
- Match strength
- Skills the user can learn
- Skills the other person can learn

### 6. Send Swap Request

The user selects:

- Skill they want to learn
- Skill they can teach
- Optional message

### 7. Accept or Reject

The receiver can:

- Accept
- Reject

Only the receiver has permission to accept or reject an incoming request.

### 8. Complete the Exchange

Both participants independently mark their side as complete.

### 9. Leave a Review

After both participants complete the exchange, they can review each other.

---

## Matching System

The matching algorithm is implemented in:

```text
server/src/utils/match.js
```

It is used by the matching and dashboard functionality.

For the logged-in user `U` and candidate user `C`:

### Step 1 — Find What U Can Learn

```text
U wants ∩ C teaches
```

This represents skills that the current user wants to learn and the candidate can teach.

### Step 2 — Find What C Can Learn

```text
C wants ∩ U teaches
```

This represents skills that the candidate wants to learn and the current user can teach.

### Step 3 — Ignore Non-Matches

If there is no overlap in either direction:

```text
a + b = 0
```

the candidate is not considered a match.

### Step 4 — Determine Match Strength

If both directions have an overlap:

```text
2-way match
```

Otherwise:

```text
1-way match
```

### Step 5 — Calculate Score

The score is calculated as:

```text
score =
round(
  (a + b) /
  (|U.wants| + |C.wants|)
  × 100
)
```

The score is capped at 100.

### Example

User A:

```text
Wants:   Docker, AWS
Teaches: React, JavaScript, MongoDB
```

User B:

```text
Wants:   React, JavaScript
Teaches: Docker, AWS, Kubernetes
```

The intersections are:

```text
A can learn from B:
Docker, AWS
= 2

B can learn from A:
React, JavaScript
= 2
```

Therefore:

```text
score = (2 + 2) / (2 + 2) × 100
      = 100
```

Result:

```text
100% — 2-way match
```

### Why a Deterministic Algorithm?

No AI or machine learning is required for the core matching problem.

The matching rule is:

> A good skill exchange exists when both users can teach something the other person wants to learn.

This approach is:

- Easy to understand
- Easy to test
- Deterministic
- Explainable in an interview
- Fast enough for the project's current scale
- Free from training-data requirements

---

## Swap Request Lifecycle

A swap request follows this lifecycle:

```text
Pending
   │
   ├── Accept ──→ Accepted
   │                 │
   │                 ├── Both complete ──→ Completed
   │                 │
   │                 └── One complete ──→ Still Active
   │
   └── Reject ──→ Rejected
```

A pending request can also be cancelled by the appropriate participant.

### Important Authorization Rules

- Only the receiver can accept a request.
- Only the receiver can reject a request.
- Either participant can cancel an eligible request.
- Each participant can mark only their own completion flag.
- A participant cannot mark their side complete twice.
- A review is allowed only after completion.
- A participant can review a swap only once.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | Frontend UI |
| Vite | Frontend development and build tooling |
| React Router | Client-side routing |
| Tailwind CSS | Styling and responsive UI |
| Axios | HTTP requests and JWT interceptor |
| Node.js | Backend runtime |
| Express.js | REST API |
| MongoDB | Database |
| Mongoose | MongoDB ODM and schema validation |
| bcryptjs | Password hashing |
| JSON Web Token | Authentication |
| express-validator | API input validation |
| Multer | Multipart image upload handling |
| Cloudinary | Production avatar image storage |
| Docker | Containerization |
| Docker Compose | Local multi-container development |
| Vercel | Frontend deployment |
| Render | Backend deployment |

---

## System Architecture

```text
                    ┌─────────────────────┐
                    │       React         │
                    │      Vite SPA       │
                    └──────────┬──────────┘
                               │
                               │ Axios
                               │ Bearer JWT
                               ▼
                    ┌─────────────────────┐
                    │    Express API      │
                    │    /api/...         │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
             Middleware     Routes       Controllers
                 │                           │
                 │                           ▼
                 │                       Mongoose
                 │                           │
                 └──────────────┬────────────┘
                                ▼
                         ┌──────────────┐
                         │   MongoDB    │
                         └──────────────┘

                         Avatar Upload
                              │
                              ▼
                         ┌──────────────┐
                         │  Cloudinary  │
                         └──────────────┘
```

---

## Request-Response Flow

Example: sending a swap request.

### 1. User Action

The user clicks:

```text
Swap Skills
```

### 2. Frontend

React opens the swap request form.

The user selects:

```text
I want to learn → Docker
I can teach → React
```

### 3. API Request

The frontend sends:

```http
POST /api/swaps
Authorization: Bearer <JWT>
```

with the selected skill IDs.

### 4. Authentication

The backend verifies the JWT.

### 5. Validation

The request is checked using:

- Authentication middleware
- Input validation
- Controller-level business rules

### 6. Business Logic

The controller verifies:

- Receiver exists
- Sender is not the receiver
- Sender teaches the offered skill
- Receiver teaches the requested skill
- Duplicate pending request does not exist

### 7. Database

A new `SwapRequest` document is created.

### 8. Response

The API returns the created swap.

### 9. Frontend

React updates the UI with the new request.

---

## Database Design

SkillSwap currently uses four primary MongoDB collections.

### User

```text
User
├── name
├── email
├── password
├── avatar
├── bio
├── location
├── experienceLevel
├── availability
├── skillsToTeach[]
├── skillsToLearn[]
├── rating
└── ratingCount
```

Passwords are excluded from normal queries and stored using bcrypt hashing.

### Skill

```text
Skill
├── name
└── category
```

Skill names are unique.

Example categories include:

```text
Frontend
Backend
Database
Cloud
DevOps
Programming
Design
Marketing
Other
```

### SwapRequest

```text
SwapRequest
├── sender
├── receiver
├── offeredSkill
├── requestedSkill
├── message
├── status
├── senderCompleted
└── receiverCompleted
```

Possible statuses:

```text
Pending
Accepted
Rejected
Completed
Cancelled
```

Completion is two-sided.

### Review

```text
Review
├── reviewer
├── reviewedUser
├── swapRequest
├── rating
└── comment
```

A compound unique constraint prevents the same participant from reviewing the same swap more than once.

---

## Why There Is No Separate Swap Collection

The project intentionally keeps the database model simple.

An accepted `SwapRequest` already contains:

- Sender
- Receiver
- Offered skill
- Requested skill
- Completion state
- Status

Therefore, another `Swap` collection would duplicate information unnecessarily.

Similarly, a separate `UserSkills` join collection is not required because MongoDB can store the skill references directly in:

```text
skillsToTeach[]
skillsToLearn[]
```

This keeps the architecture easier to understand while remaining appropriate for the current scale.

---

## Authentication and Security

### Authentication Flow

```text
Register / Login
       ↓
Validate credentials
       ↓
Hash / compare password
       ↓
Create JWT
       ↓
Store token on client
       ↓
Send Bearer token with API requests
       ↓
Backend verifies JWT
       ↓
Protected route continues
```

### Password Security

Passwords are:

- Never stored as plain text
- Hashed using bcrypt
- Excluded from normal user queries

### JWT

The JWT contains the user's ID.

Example payload:

```json
{
  "id": "user_id"
}
```

The token has an expiration period configured through:

```env
JWT_EXPIRE=7d
```

### Protected API Routes

The backend uses authentication middleware to verify the token.

Invalid or missing tokens return:

```http
401 Unauthorized
```

### Authorization

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to perform this action?

For example:

```text
PUT /api/users/:id
```

is allowed only when the authenticated user's ID matches the requested user ID.

Swap actions also check whether the authenticated user is the sender or receiver before allowing the operation.

---

## API Overview

Base URL for local development:

```text
http://localhost:5000/api
```

All protected endpoints require:

```http
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Restore current session | Yes |

### Users

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/users` | Browse users | Yes |
| GET | `/api/users/:id` | View public profile | Yes |
| PUT | `/api/users/:id` | Update profile | Yes |
| PUT | `/api/users/:id/password` | Change password | Yes |
| DELETE | `/api/users/:id` | Delete account | Yes |

### Skills

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/skills` | Get skill catalog | Yes |
| POST | `/api/skills` | Create a skill | Yes |

### Matches

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/matches` | Get ranked skill matches | Yes |

Optional query:

```text
/api/matches?limit=20
```

### Swap Requests

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/swaps` | Get current user's swaps | Yes |
| POST | `/api/swaps` | Send swap request | Yes |
| PUT | `/api/swaps/:id` | Update swap status | Yes |
| DELETE | `/api/swaps/:id` | Delete eligible request | Yes |

### Reviews

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/reviews` | Create review | Yes |
| GET | `/api/reviews/user/:userId` | Get user's reviews | Yes |

### Dashboard

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/dashboard` | Get dashboard data | Yes |

---

## Project Structure

```text
skillswap/
│
├── README.md
├── .env.example
├── .gitignore
├── docker-compose.yml
│
├── server/
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   │
│   └── src/
│       ├── server.js
│       │
│       ├── config/
│       │   └── db.js
│       │
│       ├── models/
│       │   ├── User.js
│       │   ├── Skill.js
│       │   ├── SwapRequest.js
│       │   └── Review.js
│       │
│       ├── middleware/
│       │   ├── auth.js
│       │   └── upload.js
│       │
│       ├── routes/
│       │   ├── auth.js
│       │   ├── users.js
│       │   ├── skills.js
│       │   ├── swaps.js
│       │   ├── reviews.js
│       │   ├── matches.js
│       │   └── dashboard.js
│       │
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── skillController.js
│       │   ├── swapController.js
│       │   ├── reviewController.js
│       │   ├── matchController.js
│       │   └── dashboardController.js
│       │
│       ├── utils/
│       │   ├── match.js
│       │   ├── helpers.js
│       │   └── seed.js
│       │
│       └── tests/
│
└── client/
    ├── package.json
    ├── Dockerfile
    ├── .dockerignore
    ├── .env.example
    ├── nginx.conf
    ├── vercel.json
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        │
        ├── context/
        │   └── AuthContext.jsx
        │
        ├── services/
        │   └── api.js
        │
        ├── hooks/
        │   └── useSwapRequest.js
        │
        ├── utils/
        │
        ├── components/
        │   ├── Navbar
        │   ├── Layout
        │   ├── ProtectedRoute
        │   ├── UserCard
        │   ├── SkillTag
        │   ├── StatCard
        │   ├── EmptyState
        │   ├── Loader
        │   ├── Stars
        │   ├── Modal
        │   ├── SwapRequestForm
        │   ├── ReviewForm
        │   ├── SkillPicker
        │   └── Avatar
        │
        └── pages/
            ├── Landing
            ├── Login
            ├── Register
            ├── Dashboard
            ├── Discover
            ├── MySkills
            ├── UserProfile
            ├── Profile
            └── Swaps
```

---

## Getting Started

### Requirements

Install:

- Node.js 18+
- MongoDB
- Git

Alternatively, MongoDB can be run through Docker.

### Clone the Repository

```bash
git clone https://github.com/srijan2312/SkillSwap-Peer-to-Peer-Skill-Exchange-Platform.git

cd SkillSwap-Peer-to-Peer-Skill-Exchange-Platform
```

### Install Backend Dependencies

```bash
cd server
npm install
```

### Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

---

## Environment Variables

### Backend

Create:

```text
server/.env
```

Example:

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/skillswap

JWT_SECRET=your-long-random-secret
JWT_EXPIRE=7d

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Frontend

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit real `.env` files.

They are excluded through `.gitignore`.

---

## Running the Application

### Start Backend

From the `server` directory:

```bash
npm run dev
```

or:

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

### Start Frontend

From the `client` directory:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The complete local flow is:

```text
Browser
   ↓
React / Vite
   ↓
Express API
   ↓
MongoDB
```

Avatar uploads additionally use:

```text
React
   ↓
Express + Multer
   ↓
Cloudinary
   ↓
Secure image URL
   ↓
MongoDB User document
```

---

## Docker

The project includes Docker configuration for running the application with containers.

Start the stack:

```bash
docker compose up --build
```

Typical local services:

```text
Frontend → http://localhost
Backend  → http://localhost:5000
MongoDB  → MongoDB container
```

Stop the stack:

```bash
docker compose down
```

---

## Data Refresh Strategy

SkillSwap does not use WebSockets or Socket.IO.

Instead, selected pages use lightweight polling.

Current approach:

```text
Dashboard
    ↓
Periodic API refresh

User Profile
    ↓
Periodic API refresh

My Swaps
    ↓
More frequent API refresh

Discover
    ↓
Periodic match refresh
```

The project intentionally uses polling because the application does not require high-frequency real-time communication.

This keeps the architecture:

- Simple
- Stateless
- Easy to debug
- Easy to deploy
- Easy to explain

### Why Not WebSockets?

WebSockets would be useful for features such as:

- Instant chat
- Typing indicators
- Real-time notifications
- Live presence

Those features are outside the current scope of SkillSwap.

Polling is sufficient for the current application.

---

## Testing

The backend includes test-related files for validating:

- Authentication
- API behavior
- Edge cases
- Swap workflows
- Account operations

Important scenarios include:

### Authentication

- Valid registration
- Duplicate email
- Valid login
- Invalid password
- Protected routes
- Invalid JWT

### User Operations

- Update own profile
- Block updates to another user's profile
- Change password
- Delete account

### Skills

- Add skill
- Remove skill
- Prevent duplicate skills
- Create new skill

### Matching

- One-way match
- Two-way match
- No match
- Match score calculation

### Swaps

- Create request
- Reject self-request
- Reject invalid skill
- Prevent duplicate pending request
- Accept request
- Reject request
- Cancel request
- Mark completion
- Prevent duplicate completion
- Complete only after both sides finish

### Reviews

- Review completed swap
- Reject review for incomplete swap
- Prevent duplicate review
- Validate rating range

---

## Deployment

SkillSwap is deployed using separate frontend and backend services.

### Frontend

Hosted on:

**Vercel**

Live application:

https://skill-swap-peer-to-peer-skill-excha-lovat.vercel.app

### Backend

Hosted on:

**Render**

Production API:

https://skillswap-api-ul44.onrender.com

### Database

Hosted using:

**MongoDB**

### Image Storage

Profile avatars are stored using:

**Cloudinary**

---

## Production Architecture

```text
                        Internet
                           │
                           ▼
                 ┌───────────────────┐
                 │      Vercel       │
                 │   React Frontend  │
                 └─────────┬─────────┘
                           │
                           │ HTTPS
                           ▼
                 ┌───────────────────┐
                 │      Render       │
                 │  Express Backend  │
                 └──────┬───────┬────┘
                        │       │
                        │       │
                        ▼       ▼
                 ┌──────────┐  ┌────────────┐
                 │ MongoDB  │  │ Cloudinary │
                 │ Database │  │   Images   │
                 └──────────┘  └────────────┘
```

---

## SPA Routing

The frontend is a React single-page application.

Routes such as:

```text
/login
/register
/dashboard
/discover
/profile
/swaps
```

are handled by React Router.

For production deployment on Vercel, the project includes:

```text
client/vercel.json
```

with a rewrite configuration that sends unknown routes back to:

```text
/index.html
```

This prevents refreshes on routes such as `/profile` or `/dashboard` from returning a 404.

---

## Engineering Decisions

### 1. MERN Stack

The MERN stack was selected because the project is heavily data-driven and requires:

- REST APIs
- Authentication
- User profiles
- Relationships between users and skills
- CRUD operations
- Flexible document structures

### 2. JWT Authentication

JWT provides a simple stateless authentication mechanism for the REST API.

The server does not need to maintain a traditional session store.

### 3. Mongoose

Mongoose provides:

- Schema validation
- Model abstraction
- References
- Population
- Middleware
- MongoDB interaction

### 4. Deterministic Matching

The matching algorithm uses set intersections rather than AI.

Advantages:

- Explainable
- Predictable
- Fast
- Easy to test
- No training data
- No external AI API

### 5. Cloudinary for Images

Local filesystem storage is not reliable as permanent storage in production environments.

Cloudinary provides dedicated image storage and returns a secure URL that can be stored in MongoDB.

### 6. Polling Instead of WebSockets

The project does not need high-frequency real-time communication.

Lightweight polling provides sufficiently fresh data without introducing:

- WebSocket infrastructure
- Connection management
- Event synchronization
- Additional server complexity

### 7. Simple MongoDB Relationships

Skills are referenced through ObjectIds.

The project intentionally avoids unnecessary join collections.

This makes the data model easier to understand while remaining appropriate for the current scale.

---

## Challenges and Solutions

### Challenge 1 — Matching Users

Users need complementary skills rather than simply similar skills.

#### Solution

The matching algorithm checks both directions:

```text
What I want ← What they teach

What they want ← What I teach
```

This allows the application to identify genuine skill exchange opportunities.

---

### Challenge 2 — Preventing Unauthorized Updates

A logged-in user should not be able to edit another user's profile.

#### Solution

Backend controllers compare:

```text
authenticatedUserId
```

with:

```text
requestedUserId
```

and return:

```http
403 Forbidden
```

when they do not match.

---

### Challenge 3 — Preventing Duplicate Swap Requests

Users should not be able to repeatedly create the same pending swap request.

#### Solution

The backend checks for an existing pending request before creating a new one.

Database-level uniqueness is also used for the relevant pending-request combination.

---

### Challenge 4 — Two-Sided Completion

A swap should not be completed just because one participant says they are done.

#### Solution

Two fields are maintained:

```text
senderCompleted
receiverCompleted
```

The swap becomes:

```text
Completed
```

only when both values are true.

---

### Challenge 5 — Production Avatar Storage

Local uploaded files are not suitable as permanent storage for a production deployment.

#### Solution

The backend receives the image using Multer memory storage and uploads the image buffer to Cloudinary.

The returned secure URL is saved to MongoDB.

---

### Challenge 6 — Keeping Data Fresh

Changes made by one user should eventually become visible to other users.

#### Solution

Relevant pages periodically fetch fresh server data using lightweight polling.

This provides near-real-time behavior without introducing WebSockets.

---

### Challenge 7 — Account Deletion

Deleting only the User document could leave related data behind.

#### Solution

The deletion flow removes:

- User
- Related swap requests
- Related reviews
- Cloudinary avatar

before completing the logout and redirect flow.

---

### Challenge 8 — React SPA Refreshes

Refreshing a nested route such as:

```text
/profile
```

can cause the deployment server to search for a physical `/profile` file.

#### Solution

Vercel rewrites unknown frontend routes to:

```text
/index.html
```

allowing React Router to handle the route.

---

## Future Improvements

The current version intentionally avoids unnecessary complexity.

Possible future improvements include:

### Real-Time Chat

Allow two swap partners to communicate directly.

Potential technology:

```text
Socket.IO / WebSockets
```

### Notifications

Add:

- New swap request notifications
- Request accepted notifications
- Swap completed notifications
- Review notifications

Potential implementation:

```text
Email
Push notifications
In-app notifications
```

### Scheduling

Allow users to schedule:

- Learning sessions
- Meeting times
- Recurring exchanges

### Video Sessions

Integrate video communication for remote skill exchanges.

### Skill Verification

Allow users to verify skills through:

- Endorsements
- Assessments
- Certificates
- Peer verification

### Smarter Recommendations

The current deterministic algorithm could eventually be extended with:

- Skill weighting
- User preferences
- Availability matching
- Experience compatibility
- Historical swap success
- Recommendation ranking

Machine learning is intentionally not part of the current implementation.

---

## Current Project Scope

SkillSwap currently focuses on the core peer-to-peer skill exchange workflow:

```text
Authentication
      ↓
Profile
      ↓
Skills
      ↓
Matching
      ↓
Discovery
      ↓
Swap Requests
      ↓
Swap Completion
      ↓
Reviews
```

The project intentionally does not currently include:

- Real-time chat
- Video calling
- Calendar integration
- Advanced recommendation AI
- Skill verification
- Push notification infrastructure

Keeping these features outside the current scope makes the application easier to understand, test, deploy, and maintain.

---

## Why This Project Is More Than CRUD

Although SkillSwap contains CRUD operations, the project goes beyond basic CRUD functionality.

The application includes:

- JWT authentication
- Password hashing
- Authorization
- Protected routes
- File uploads
- Cloud image storage
- Database relationships
- Deterministic recommendation logic
- Search and filtering
- Request lifecycle management
- Two-sided transaction completion
- Review and rating logic
- Data cleanup
- Polling-based updates
- Production deployment
- SPA routing configuration
- Docker support

The main engineering challenge is coordinating these pieces into one complete workflow.

---

## Author

### Srijan Kumar

Computer Science Engineering Graduate  
Full-Stack Developer

**Primary interests:**

- React
- JavaScript
- Node.js
- Express.js
- MongoDB
- Full-Stack Web Development
- Cloud and Deployment

### Project Repository

https://github.com/srijan2312/SkillSwap-Peer-to-Peer-Skill-Exchange-Platform

### Live Application

https://skill-swap-peer-to-peer-skill-excha-lovat.vercel.app

---

## License

This project was created as a personal full-stack development project for learning, portfolio development, and demonstrating practical software engineering skills.
