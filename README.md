# SkillSwap — Peer-to-Peer Skill Exchange Platform

> A full-stack platform where people exchange skills instead of money.

SkillSwap is a MERN-based peer-to-peer skill exchange platform that helps users find people who can teach what they want to learn while learning from what they already know.

Users can create profiles, manage the skills they teach and want to learn, discover compatible users, send skill-swap requests, manage exchanges, complete swaps, and leave ratings and reviews.

[![Live Demo](https://img.shields.io/badge/Live-Demo-8B5CF6?style=for-the-badge)](https://skill-swap-peer-to-peer-skill-excha-lovat.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/srijan2312/SkillSwap-Peer-to-Peer-Skill-Exchange-Platform)

---

## 🌐 Live Demo

### Frontend

https://skill-swap-peer-to-peer-skill-excha-lovat.vercel.app

### Backend API

https://skillswap-api-ul44.onrender.com

### GitHub Repository

https://github.com/srijan2312/SkillSwap-Peer-to-Peer-Skill-Exchange-Platform

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [How SkillSwap Works](#-how-skillswap-works)
- [Features](#-features)
- [User Workflow](#-user-workflow)
- [Matching System](#-matching-system)
- [Swap Request Lifecycle](#-swap-request-lifecycle)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [Authentication & Security](#-authentication--security)
- [API Overview](#-api-overview)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Docker](#-docker)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Engineering Decisions](#-engineering-decisions)
- [Challenges & Solutions](#-challenges--solutions)
- [Future Improvements](#-future-improvements)
- [Author](#-author)

---

# 🚀 Overview

Traditional learning platforms generally follow a paid model where users purchase courses or pay instructors.

SkillSwap uses a different approach:

> **Exchange knowledge instead of money.**

The idea is simple:

```text
I teach what I know
        +
You teach what you know
        ↓
We exchange knowledge
```

### Example

**User A**

```text
Can Teach:
- React
- JavaScript

Wants to Learn:
- Docker
- AWS
```

**User B**

```text
Can Teach:
- Docker
- AWS

Wants to Learn:
- React
- JavaScript
```

SkillSwap identifies that these users have complementary skills and gives them a strong two-way match.

The platform then allows them to initiate a skill exchange through a swap request.

---

# 🎯 Problem Statement

Finding the right person to learn a specific skill from can be difficult.

A user may:

- Know a valuable skill
- Want to learn another skill
- Have no suitable person in their existing network
- Not want to pay for a course or private tutor
- Need a partner with compatible availability and experience

SkillSwap solves this by creating a structured platform where users can:

1. List what they can teach
2. List what they want to learn
3. Discover other users
4. Find compatible skill matches
5. Send exchange requests
6. Complete skill exchanges
7. Build reputation through reviews

---

# 🔄 How SkillSwap Works

```text
                    ┌─────────────────┐
                    │ Create Account  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Build Profile   │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Add Skills      │
                    │ I Can Teach     │
                    │ I Want To Learn │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Discover Users  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Find Matches    │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Send Request    │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Accept / Reject │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Active Swap     │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Complete Swap   │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Review & Rating │
                    └─────────────────┘
```

---

# ✨ Features

## 🔐 Authentication & Authorization

SkillSwap provides a complete authentication system.

### Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing using bcrypt
- Secure logout
- Session persistence
- Protected frontend routes

### Authorization

Authenticated users are also checked for permission before performing protected actions.

For example:

```text
Authentication
     ↓
Who is the user?

Authorization
     ↓
Is this user allowed to perform this action?
```

Users cannot modify or delete another user's account.

---

# 👤 User Profiles

Each user has a profile containing information used for discovery and matching.

Profile information includes:

- Name
- Email
- Bio
- Location
- Experience level
- Availability
- Profile picture
- Skills they can teach
- Skills they want to learn
- Rating
- Number of reviews
- Completed swaps

Users can update their profile as their skills and learning goals change.

---

# 🖼️ Profile Image Uploads

Profile images are handled using:

```text
React
  ↓
Multipart Form Data
  ↓
Multer
  ↓
Express Backend
  ↓
Cloudinary
  ↓
Secure Image URL
  ↓
MongoDB
```

Multer uses memory storage rather than permanently storing uploaded images on the backend server.

Cloudinary is used as the production image-storage and delivery service.

### Upload Validation

The backend validates:

- File type
- File extension
- File size

Supported image formats include:

```text
JPEG
PNG
WebP
GIF
```

Maximum avatar size:

```text
2 MB
```

---

# 🧠 Skill Matching System

The matching system is one of the core features of SkillSwap.

The system compares the skills between two users to determine how useful the potential exchange could be.

For a logged-in user `A` and candidate user `B`:

### Step 1 — What can I learn from them?

```text
A.skillsToLearn
        ∩
B.skillsToTeach
```

This identifies skills that User A wants to learn and User B can teach.

### Step 2 — What can they learn from me?

```text
B.skillsToLearn
        ∩
A.skillsToTeach
```

This identifies skills that User B wants to learn and User A can teach.

### Step 3 — Determine Match Type

```text
Both directions have matches
            ↓
       2-Way Match
```

If only one direction matches:

```text
One direction has a match
            ↓
       1-Way Match
```

---

## Example

### User A

```text
Teaches:
React
JavaScript

Wants:
Docker
AWS
```

### User B

```text
Teaches:
Docker
AWS

Wants:
React
JavaScript
```

The system calculates:

```text
A wants to learn from B:
Docker
AWS

B wants to learn from A:
React
JavaScript
```

Therefore:

```text
2-Way Match
```

This is considered a strong skill exchange because both users can teach something the other person wants to learn.

---

# 🔎 Discover System

The Discover page allows users to find potential skill partners.

Users can search or filter based on information such as:

- Name
- Skills
- Skill category
- Experience level
- Availability

The matching system helps prioritize users whose teaching and learning goals are compatible.

The Discover page periodically refreshes data so newly created or updated profiles can become visible without manually refreshing the browser.

---

# 🔄 Swap Requests

Once a user finds a suitable partner, they can send a SkillSwap request.

A request contains:

- Sender
- Receiver
- Skill offered
- Skill requested
- Optional message
- Request status
- Completion state

Before creating a request, the backend validates important conditions such as:

- Receiver exists
- Sender is not requesting themselves
- Offered skill belongs to the sender
- Requested skill belongs to the receiver
- Duplicate pending requests are prevented

---

# 🔁 Swap Request Lifecycle

A swap request follows a controlled lifecycle:

```text
                 ┌──────────┐
                 │ Pending  │
                 └────┬─────┘
                      │
              ┌───────┴───────┐
              ↓               ↓
        ┌──────────┐    ┌──────────┐
        │ Accepted │    │ Rejected │
        └────┬─────┘    └──────────┘
             │
             ↓
       ┌────────────┐
       │ Active Swap│
       └──────┬─────┘
              │
              ↓
       ┌────────────┐
       │ Completed  │
       └────────────┘

Pending
   ↓
Cancelled
```

Both participants must mark their side as completed before the swap reaches the final `Completed` state.

---

# ⭐ Reviews & Ratings

After a completed skill exchange, participants can review each other.

Each review contains:

- Reviewer
- Reviewed user
- Related swap request
- Rating
- Comment

Ratings use a:

```text
1 → 5 star scale
```

The system prevents users from repeatedly reviewing the same swap.

User profiles display reputation information such as:

- Average rating
- Review count
- Completed swaps

This provides future users with additional context when choosing a skill partner.

---

# 📊 Dashboard

The dashboard provides an overview of a user's activity.

It can show information such as:

- Skills I teach
- Skills I want to learn
- Pending requests
- Active swaps
- Completed swaps
- Recommended partners
- Recent activity

This gives users a central place to monitor their SkillSwap activity.

---

# ⚡ Automatic Data Refresh

SkillSwap uses lightweight polling for pages where changes from other users should appear automatically.

Instead of introducing WebSockets, selected pages periodically request updated data from the backend.

Conceptually:

```text
React Page
    ↓
Wait
    ↓
GET latest data
    ↓
Update React state
    ↓
Wait
    ↓
Repeat
```

Polling intervals are kept lightweight and are only used where automatic updates are useful.

### Why Polling?

SkillSwap does not currently require high-frequency real-time communication.

Polling keeps the implementation:

- Simple
- Stateless
- Easy to deploy
- Easy to understand
- Easy to maintain

If the platform later introduces real-time chat or instant notifications, WebSockets could be introduced.

---

# 📱 Responsive Design

The application is designed to work across:

- Desktop
- Tablet
- Mobile

The UI includes:

- Responsive layouts
- Loading states
- Empty states
- Error states
- Form validation feedback
- Mobile-friendly navigation
- Protected route handling

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Frontend build tool |
| React Router | Client-side routing |
| Tailwind CSS | UI styling |
| Axios | HTTP/API communication |
| JavaScript ES6+ | Application logic |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| express-validator | Request validation |
| Multer | Multipart file handling |
| Cloudinary | Image storage and delivery |

## Deployment

| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Cloud database |
| Cloudinary | Profile image storage |

---

# 🏗️ System Architecture

```text
                         USER
                          │
                          ▼
                ┌───────────────────┐
                │ React + Vite      │
                │                   │
                │ Pages             │
                │ Components        │
                │ Context           │
                │ Hooks             │
                │ Services          │
                └─────────┬─────────┘
                          │
                     Axios + JWT
                          │
                          ▼
                ┌───────────────────┐
                │ Express REST API  │
                │                   │
                │ Routes            │
                │ Middleware        │
                │ Controllers       │
                │ Validation        │
                └─────────┬─────────┘
                          │
                    Mongoose ODM
                          │
                          ▼
                ┌───────────────────┐
                │ MongoDB Atlas     │
                │                   │
                │ Users             │
                │ Skills            │
                │ Swap Requests     │
                │ Reviews           │
                └───────────────────┘

                          │
                          │ Image Upload
                          ▼
                ┌───────────────────┐
                │ Cloudinary        │
                │                   │
                │ Profile Images    │
                └───────────────────┘
```

---

# 🔐 Authentication Flow

A typical authenticated request works like this:

```text
User logs in
     ↓
POST /api/auth/login
     ↓
Backend validates credentials
     ↓
Password checked using bcrypt
     ↓
JWT generated
     ↓
Frontend stores authentication state
     ↓
User accesses protected page
     ↓
JWT sent with API request
     ↓
Authentication middleware verifies JWT
     ↓
Request reaches controller
```

The backend does not trust the frontend alone for authorization.

Protected operations are validated again on the server.

---

# 🗄️ Database Design

SkillSwap uses MongoDB with Mongoose models.

## User

Stores user identity and profile information.

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
├── ratingCount
└── ...
```

## Skill

Stores reusable skill information.

```text
Skill
├── name
└── category
```

## SwapRequest

Represents a skill exchange request between two users.

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

Possible request states include:

```text
Pending
Accepted
Rejected
Completed
Cancelled
```

## Review

Stores feedback after a completed exchange.

```text
Review
├── reviewer
├── reviewedUser
├── swapRequest
├── rating
└── comment
```

---

# 🔒 Authentication & Security

Security is implemented at both frontend and backend levels.

## Authentication

- JWT-based authentication
- Password hashing using bcrypt
- Protected routes
- Token verification middleware
- Secure logout flow

## Authorization

- Ownership checks
- User-specific operations
- Protected account operations
- Swap participant validation
- Review authorization

## Input Validation

The backend validates incoming data before processing it.

Validation covers areas such as:

- User information
- Skill IDs
- Swap requests
- Review data
- Uploaded images

## File Security

Avatar uploads are restricted by:

```text
Allowed MIME types
        +
Allowed extensions
        +
2 MB size limit
```

## Environment Variables

Sensitive values are kept outside the repository.

Examples:

```text
MONGO_URI
JWT_SECRET
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

These values are never committed to Git.

---

# 🔌 API Overview

The backend exposes REST APIs consumed by the React frontend.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
```

Used for account creation and authentication.

## Users

```text
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

Used for user profiles and account operations.

## Skills

```text
GET    /api/skills
POST   /api/skills
```

Used for retrieving and managing available skills where applicable.

## Swap Requests

```text
GET    /api/swaps
POST   /api/swaps
PUT    /api/swaps/:id
DELETE /api/swaps/:id
```

Used for creating and managing skill exchange requests.

## Reviews

```text
POST   /api/reviews
GET    /api/reviews/:userId
```

Used for submitting and retrieving user reviews.

> The exact routes, validation rules and request payloads are defined in the backend source code.

---

# 📁 Project Structure

```text
skillswap/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── vercel.json
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── tests/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── .env.example
│   └── package.json
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

# 💻 Getting Started

## Prerequisites

Make sure the following are installed:

- Node.js 18+
- npm
- Git
- MongoDB or MongoDB Atlas account
- Cloudinary account for avatar uploads

---

## 1. Clone the Repository

```bash
git clone https://github.com/srijan2312/SkillSwap-Peer-to-Peer-Skill-Exchange-Platform.git

cd SkillSwap-Peer-to-Peer-Skill-Exchange-Platform
```

---

## 2. Install Backend Dependencies

```bash
cd server
npm install
```

---

## 3. Configure Backend Environment Variables

Create:

```text
server/.env
```

Add:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_long_random_secret
JWT_EXPIRE=7d

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Do not commit this file.

---

## 4. Install Frontend Dependencies

Open a second terminal:

```bash
cd client
npm install
```

---

## 5. Configure Frontend Environment Variables

Create:

```text
client/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api
```

---

# ▶️ Running the Application

## Start Backend

From the `server` directory:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

## Start Frontend

From the `client` directory:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

# 🐳 Docker

The project includes Docker Compose configuration.

Build and start the application:

```bash
docker compose up --build
```

To stop the containers:

```bash
docker compose down
```

---

# 🧪 Testing

The backend contains tests for important application workflows and edge cases.

Testing areas include:

- Authentication
- User operations
- Swap request operations
- Validation
- Reviews
- Application workflows

Run the available backend tests from:

```bash
cd server
```

Then use the test command defined in `server/package.json`.

---

# ☁️ Deployment

The production architecture uses separate services for each responsibility.

```text
┌─────────────────────────┐
│         Vercel          │
│                         │
│     React Frontend      │
└────────────┬────────────┘
             │
             │ HTTPS API
             ▼
┌─────────────────────────┐
│         Render          │
│                         │
│    Express Backend      │
└───────┬─────────┬───────┘
        │         │
        ▼         ▼
┌────────────┐ ┌─────────────┐
│ MongoDB    │ │ Cloudinary  │
│   Atlas    │ │             │
│            │ │ Avatar      │
│ Database   │ │ Storage     │
└────────────┘ └─────────────┘
```

### Frontend

Hosted on **Vercel**.

### Backend

Hosted on **Render**.

### Database

Hosted using **MongoDB Atlas**.

### Images

Stored using **Cloudinary**.

---

# 🔄 SPA Routing

The React application uses client-side routing.

A Vercel rewrite configuration is included so routes such as:

```text
/profile
/discover
/swaps
/dashboard
```

continue to work correctly when the browser is refreshed directly.

The frontend configuration is located at:

```text
client/vercel.json
```

---

# 💡 Engineering Decisions

## Why MERN?

MERN provides a consistent JavaScript-based development stack across the frontend and backend.

It also makes it straightforward to build and maintain a REST-based full-stack application.

---

## Why MongoDB?

SkillSwap works with document-oriented data such as:

- User profiles
- Skills
- Swap requests
- Reviews

MongoDB provides a natural document model while Mongoose provides schemas, validation and relationships through references.

---

## Why JWT?

JWT allows the backend to authenticate API requests without maintaining server-side session state.

The token contains the authenticated user's identity and is verified by backend middleware before protected operations are performed.

---

## Why bcrypt?

Passwords should never be stored in plain text.

bcrypt is used to hash passwords before storing them in MongoDB.

During login:

```text
Plain Password
      ↓
bcrypt comparison
      ↓
Stored Password Hash
      ↓
Match?
```

---

## Why Polling Instead of WebSockets?

SkillSwap does not currently require high-frequency real-time communication.

Polling provides sufficiently fresh data while keeping the architecture simple.

This avoids introducing:

- WebSocket infrastructure
- Connection management
- Additional real-time state handling
- More complex deployment requirements

If SkillSwap later introduces real-time chat or instant notifications, WebSockets would be a suitable next step.

---

## Why Cloudinary?

The backend should not rely on local filesystem storage for production user images.

Cloudinary provides:

- Dedicated image storage
- CDN delivery
- Persistent URLs
- Production-friendly image handling

The backend stores the resulting image URL.

---

# 🧩 Challenges & Solutions

## 1. Matching Users by Complementary Skills

### Challenge

Users may teach several skills while wanting to learn several others.

### Solution

The application compares teaching and learning skill sets using intersections.

This produces an explainable matching system without requiring machine learning.

---

## 2. Preventing Unauthorized Operations

### Challenge

A logged-in user should not automatically be allowed to modify another user's data.

### Solution

Authorization checks are performed on the backend using the authenticated user's identity and the target resource owner.

---

## 3. Production Image Storage

### Challenge

Storing uploaded images directly on the backend filesystem is unreliable for production deployments.

### Solution

Multer handles the multipart upload in memory and Cloudinary provides persistent image storage.

---

## 4. Cross-User Data Updates

### Challenge

Changes made by one user should eventually become visible to other users.

### Solution

Selected pages use lightweight polling to periodically fetch the latest server state.

This provides near-real-time updates without introducing WebSocket complexity.

---

## 5. SPA Refresh Handling

### Challenge

React Router handles routes on the client, but production servers may not automatically know how to serve those routes.

### Solution

A Vercel rewrite sends application routes back to `index.html`, allowing React Router to handle navigation.

---

# 📈 Scalability Considerations

The current architecture is intentionally simple and suitable for the project's scope.

If usage grows significantly, possible improvements include:

- Database indexes for frequent searches
- Pagination for large user lists
- Redis caching
- Background jobs for notifications
- Rate limiting
- CDN optimization
- WebSocket-based real-time communication
- Dedicated search infrastructure

These are intentionally not part of the current implementation because they would add complexity without being necessary for the current scale.

---

# 🚧 Future Improvements

Potential future features include:

### Communication

- Real-time chat
- Direct messaging
- WebSocket notifications

### Learning

- Session scheduling
- Calendar integration
- Video learning sessions
- Learning progress tracking

### Discovery

- Improved recommendation ranking
- Advanced skill filtering
- Skill verification
- Skill endorsements

### Account

- Password reset
- Email verification
- Email notifications
- Notification center

### Platform

- Reporting and moderation
- Admin analytics
- User reputation improvements
- Better search and filtering

---

# 📌 Current Project Scope

SkillSwap intentionally focuses on the core peer-to-peer exchange workflow:

```text
Authentication
      ↓
Profiles
      ↓
Skills
      ↓
Discovery
      ↓
Matching
      ↓
Swap Requests
      ↓
Swap Completion
      ↓
Reviews
```

Features such as real-time chat, video calls and complex recommendation systems are intentionally left for future iterations rather than adding unnecessary complexity to the current architecture.

---

# 👨‍💻 Author

## Srijan Kumar

Computer Science Engineering graduate focused on full-stack web development.

### Technologies

`JavaScript` · `React` · `Node.js` · `Express` · `MongoDB` · `AWS` · `Docker`

### Profiles

- GitHub: https://github.com/srijan2312
- LinkedIn: Add your LinkedIn profile URL
- Portfolio: Add your portfolio URL

---

# ⭐ SkillSwap

**Teach what you know. Learn what you want.**

A simple idea built into a complete full-stack application for peer-to-peer skill exchange.
