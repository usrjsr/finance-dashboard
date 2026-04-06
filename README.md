# Finance Dashboard Backend

A production-ready REST API backend for a finance dashboard system built with **Next.js 16 App Router**, **MongoDB/Mongoose**, **NextAuth.js v5**, and **Zod** for validation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, API Routes) |
| Database | MongoDB with Mongoose ODM |
| Authentication | NextAuth.js v5 (Auth.js) — JWT + Credentials |
| Validation | Zod |
| Password Hashing | bcryptjs |
| Language | TypeScript |

---

## Project Structure

```
finance-dashboard/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts   # NextAuth handler (login/logout)
│       │   └── me/route.ts              # GET  — Current user profile
│       ├── users/
│       │   ├── route.ts                 # GET (list), POST (create) — Admin only
│       │   └── [id]/route.ts            # GET, PUT, DELETE — Admin only
│       ├── records/
│       │   ├── route.ts                 # GET (list + filter), POST (create)
│       │   └── [id]/route.ts            # GET, PUT, DELETE
│       └── dashboard/
│           ├── summary/route.ts         # GET — Income, expenses, net balance
│           ├── categories/route.ts      # GET — Category-wise breakdown
│           ├── recent/route.ts          # GET — Last 10 transactions
│           └── trends/route.ts          # GET — Monthly trends (12 months)
├── lib/
│   ├── db.ts                            # MongoDB connection singleton
│   ├── auth.ts                          # NextAuth configuration
│   └── helpers.ts                       # apiResponse, apiError, pagination
├── models/
│   ├── User.ts                          # User schema + password hashing hook
│   └── Record.ts                        # Financial record schema + soft delete
├── middlewares/
│   ├── auth.ts                          # requireAuth HOF
│   └── role.ts                          # requireRole HOF
├── validators/
│   ├── user.ts                          # Zod schemas for user inputs
│   └── record.ts                        # Zod schemas for record inputs
└── types/
    └── next-auth.d.ts                   # NextAuth type augmentation
```

---

## Setup & Installation

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd finance-dashboard
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root:

```env
MONGODB_URI=mongodb://localhost:27017/finance-dashboard
NEXTAUTH_SECRET=your-strong-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

> For MongoDB Atlas: `MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/finance-dashboard`

### 4. Run Development Server

```bash
npm run dev
```

API is available at `http://localhost:3000/api`

---

## API Reference

### Authentication

#### Register / Onboard User
```
POST /api/users
```
> 🔒 Admin only. This endpoint is used by authenticated admins to onboard new users.

Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "viewer"   // optional, defaults to "viewer"
}
```

#### Login
```
POST /api/auth/signin
```
Uses NextAuth credentials provider.
Body:
```json
{ "email": "john@example.com", "password": "secret123" }
```

#### Current User
```
GET /api/auth/me
```
> 🔒 Requires authentication

---

### User Management (Admin only)

> Admin users manage users via `/api/users`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users?page=1&limit=10` | List all users (paginated) |
| POST | `/api/users` | Create a new user |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user role or status |
| DELETE | `/api/users/:id` | Deactivate user (soft delete) |

---

### Financial Records

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/records` | List records (with filters) | All roles |
| POST | `/api/records` | Create a record | Admin only |
| GET | `/api/records/:id` | Get record by ID | All roles (own only for viewer/analyst) |
| PUT | `/api/records/:id` | Update a record | Admin only |
| DELETE | `/api/records/:id` | Soft-delete a record | Admin only |

**Query Filters for GET `/api/records`:**
```
?type=income|expense
?category=food
?startDate=2024-01-01
?endDate=2024-12-31
?page=1&limit=10
```

**Create/Update Record Body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-03-01T00:00:00Z",
  "description": "Monthly salary"
}
```

---

### Dashboard Analytics (Analyst + Admin)

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/dashboard/summary` | totalIncome, totalExpenses, netBalance, totalRecords |
| GET | `/api/dashboard/categories` | Per-category: income, expenses, net, count |
| GET | `/api/dashboard/recent` | Last 10 records by date |
| GET | `/api/dashboard/trends` | Monthly income vs expenses for last 12 months |

---

## Role-Based Access Control

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ |
| Admin onboarding / user creation | ❌ | ❌ | ✅ |
| View own records | ✅ | ✅ | ✅ |
| View all records | ❌ | ❌ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Dashboard analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Response Format

All endpoints return a consistent JSON shape:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Description of the error",
    "statusCode": 404
  }
}
```

---

## Data Models

### User
| Field | Type | Notes |
|---|---|---|
| name | String | Required, max 100 chars |
| email | String | Required, unique, indexed |
| password | String | Bcrypt hashed, never returned |
| role | Enum | `viewer` \| `analyst` \| `admin` |
| status | Enum | `active` \| `inactive` |
| createdAt / updatedAt | Date | Auto-managed |

### Financial Record
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Ref: User |
| amount | Number | Must be > 0 |
| type | Enum | `income` \| `expense` |
| category | String | Required, max 100 chars |
| date | Date | Required |
| description | String | Optional, max 500 chars |
| isDeleted | Boolean | Soft delete flag |

---

## Assumptions & Design Decisions

1. **Soft Delete** — Records are never permanently removed. `DELETE` sets `isDeleted: true`. All queries exclude soft-deleted records.
2. **User Deactivation** — Deleting a user sets `status: "inactive"`. The user still exists in the DB and cannot log in.
3. **Record Ownership** — Records are created by admins and assigned to their own user ID by default. Viewers/Analysts can only view records belonging to their own userId.
4. **Role Hierarchy** — `viewer < analyst < admin`. The `requireRole` middleware uses numeric levels, so `requireRole("analyst")` allows both analyst and admin.
5. **Password Security** — Passwords are hashed with bcrypt (12 rounds) via a Mongoose pre-save hook. The `password` field has `select: false` — never returned in queries.
6. **Connection Caching** — The MongoDB connection is cached on the `global` object to avoid reconnecting on every serverless invocation in Next.js dev mode.
7. **Dashboard Scoping** — Analyst-role users see analytics scoped to their own records. Admins see analytics across all records.
