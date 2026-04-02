# FinVault API

Finance data processing and access control backend for dashboard applications. Built with TypeScript, Express, PostgreSQL, and Prisma for the Zorvyn FinTech Backend Intern Assessment.

## Why This Project

This project demonstrates backend fundamentals expected in real finance systems:

- Clear API design with modular service boundaries
- Strict role-based access control (RBAC) at middleware level
- Reliable input validation and consistent error contracts
- Dashboard-ready aggregation APIs beyond basic CRUD

## Assignment Mapping (Core Requirements)

- [x] User and role management (`/api/users`, role/status updates)
- [x] Financial records management (CRUD + filtering + pagination)
- [x] Dashboard summary APIs (`/api/dashboard/summary`, `trends`, `categories`, `recent`)
- [x] Access control logic (`requireAuth` + `requirePermission(...)` middleware)
- [x] Validation and error handling (Zod + global error middleware + `ApiError`)
- [x] Data persistence (PostgreSQL + Prisma)

## Feature Highlights

- JWT authentication with default registration role `VIEWER`
- Three roles: `VIEWER`, `ANALYST`, `ADMIN`
- Financial record lifecycle with soft delete (`deletedAt`)
- Filterable and paginated record listing
- Summary analytics for totals, trends, categories, and recent activity
- Swagger docs for quick endpoint exploration at `/api/docs`

## Tech Stack

- Language: TypeScript (Node.js)
- Framework: Express 5
- Database: PostgreSQL
- ORM: Prisma 7 with `@prisma/adapter-pg`
- Auth: `jsonwebtoken` + `bcryptjs`
- Validation: Zod
- Testing: Jest
- Package manager: pnpm

## Project Structure

```text
src/
  config/          # Prisma client + validated environment config
  constants/       # Permission map, HTTP status, error codes
  middleware/      # auth, RBAC, validation, error handling
  modules/
    auth/          # register, login, me
    users/         # list/get/update role/status/deactivate
    records/       # CRUD + filters + pagination + soft delete
    dashboard/     # summary/trends/categories/recent aggregations
  types/           # Express request augmentation + shared types
  utils/           # ApiResponse, ApiError, asyncHandler
  app.ts           # app wiring + routes + Swagger
  server.ts        # entrypoint
prisma/
  schema.prisma
  seed.ts
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL

### Setup

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Server starts at `http://localhost:3000`.

Useful URLs:

- Health: `http://localhost:3000/api/health`
- Swagger docs: `http://localhost:3000/api/docs`

## Environment Variables

Use `.env.example` as the base:

| Variable         | Description                    | Example                                                            |
| ---------------- | ------------------------------ | ------------------------------------------------------------------ |
| `PORT`           | Server port                    | `3000`                                                             |
| `NODE_ENV`       | Runtime environment            | `development`                                                      |
| `DATABASE_URL`   | PostgreSQL connection string   | `postgresql://user:password@localhost:5432/finvault?schema=public` |
| `JWT_SECRET`     | Secret used to sign JWT tokens | `your-super-secret-jwt-key-change-in-production`                   |
| `JWT_EXPIRES_IN` | Access token TTL               | `7d`                                                               |

## Seeded Demo Accounts

`pnpm db:seed` creates three users for quick testing:

| Role    | Email                  | Password      |
| ------- | ---------------------- | ------------- |
| Viewer  | `viewer@finvault.com`  | `password123` |
| Analyst | `analyst@finvault.com` | `password123` |
| Admin   | `admin@finvault.com`   | `password123` |

These credentials are local development data only.

## API Overview

Base path: `/api`

### Auth

| Method | Route                | Access        | Purpose                        |
| ------ | -------------------- | ------------- | ------------------------------ |
| `POST` | `/api/auth/register` | Public        | Register user and return token |
| `POST` | `/api/auth/login`    | Public        | Login and return token         |
| `GET`  | `/api/auth/me`       | Authenticated | Current user profile           |

### Users

| Method   | Route                   | Access | Purpose                  |
| -------- | ----------------------- | ------ | ------------------------ |
| `GET`    | `/api/users`            | Admin  | List users (paginated)   |
| `GET`    | `/api/users/:id`        | Admin  | Get user by id           |
| `PATCH`  | `/api/users/:id/role`   | Admin  | Update role              |
| `PATCH`  | `/api/users/:id/status` | Admin  | Activate/deactivate user |
| `DELETE` | `/api/users/:id`        | Admin  | Deactivate user          |

### Financial Records

| Method   | Route              | Access               | Purpose                   |
| -------- | ------------------ | -------------------- | ------------------------- |
| `POST`   | `/api/records`     | Admin                | Create record             |
| `GET`    | `/api/records`     | Viewer/Analyst/Admin | List records with filters |
| `GET`    | `/api/records/:id` | Viewer/Analyst/Admin | Get record by id          |
| `PATCH`  | `/api/records/:id` | Admin                | Update record             |
| `DELETE` | `/api/records/:id` | Admin                | Soft delete record        |

### Dashboard

| Method | Route                       | Access   | Purpose                                          |
| ------ | --------------------------- | -------- | ------------------------------------------------ |
| `GET`  | `/api/dashboard/summary`    | Viewer+  | Total income, expenses, net balance              |
| `GET`  | `/api/dashboard/trends`     | Analyst+ | Month-wise income/expense trends (last 6 months) |
| `GET`  | `/api/dashboard/categories` | Analyst+ | Expense totals by category with percentage       |
| `GET`  | `/api/dashboard/recent`     | Viewer+  | Latest 10 non-deleted records                    |

## RBAC Permission Matrix

| Permission            | Viewer | Analyst | Admin |
| --------------------- | :----: | :-----: | :---: |
| `records:read`        |   ✅   |   ✅    |  ✅   |
| `records:write`       |   ❌   |   ❌    |  ✅   |
| `records:delete`      |   ❌   |   ❌    |  ✅   |
| `dashboard:summary`   |   ✅   |   ✅    |  ✅   |
| `dashboard:analytics` |   ❌   |   ✅    |  ✅   |
| `users:manage`        |   ❌   |   ❌    |  ✅   |

## Financial Records: Filters and Pagination

`GET /api/records` query parameters:

| Param      | Type                  | Notes                            |
| ---------- | --------------------- | -------------------------------- |
| `type`     | `INCOME` \| `EXPENSE` | optional                         |
| `category` | `string`              | optional                         |
| `dateFrom` | ISO 8601 datetime     | optional, inclusive              |
| `dateTo`   | ISO 8601 datetime     | optional, inclusive              |
| `page`     | integer               | default `1`, min `1`             |
| `limit`    | integer               | default `10`, min `1`, max `100` |

Example:

```http
GET /api/records?type=INCOME&category=salary&dateFrom=2026-01-01T00:00:00.000Z&dateTo=2026-03-31T23:59:59.999Z&page=1&limit=10
```

## Dashboard Analytics

- `summary`: aggregates `totalIncome`, `totalExpenses`, and `netBalance`
- `trends`: groups records by `YYYY-MM` and returns income/expense per month
- `categories`: groups expenses by category and computes percentage share
- `recent`: returns latest 10 non-deleted records ordered by date desc

## Validation and Error Handling

- Request body validation uses Zod schemas (`validate(...)` middleware)
- Query validation uses Zod schemas (`validateQuery(...)` middleware)
- Auth and permission checks run before controllers
- Global error handler returns consistent `ApiError` shape

Typical response contract:

```json
{
  "success": true,
  "message": "Records fetched successfully",
  "data": [],
  "meta": { "page": 1, "limit": 10, "total": 25 }
}
```

Validation error contract:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [{ "field": "amount", "issue": "Expected number, received string" }]
}
```

## Testing

Run all test suites:

```bash
pnpm test
```

Current tests cover auth, users, records, and dashboard modules at controller and service levels.

## Available Scripts

- `pnpm dev` - start development server with hot reload
- `pnpm build` - compile TypeScript and resolve path aliases
- `pnpm start` - run compiled server
- `pnpm lint` - run ESLint
- `pnpm test` - run Jest tests
- `pnpm db:generate` - generate Prisma client
- `pnpm db:migrate` - run Prisma migrations
- `pnpm db:seed` - seed demo users and financial records

## Design Decisions and Trade-offs

| Decision          | Choice                             | Why                                           |
| ----------------- | ---------------------------------- | --------------------------------------------- |
| RBAC enforcement  | Middleware-level permission checks | Centralized and easier to audit/test          |
| Deletion strategy | Soft delete for records            | Preserve audit history in financial data      |
| Auth model        | Access JWT only                    | Simpler scope for assignment timeframe        |
| API docs          | Swagger from route annotations     | Easy reviewer onboarding and endpoint testing |

## Assumptions

- One user has exactly one role
- Registration defaults to `VIEWER`
- Category is free-form text
- Money is stored as Prisma `Decimal` and serialized as number in responses
- Soft-deleted financial records are excluded from reads and aggregations

## What I Would Improve Next

- Add refresh token rotation and revoke flow
- Add rate limiting and basic audit logs for admin actions
- Add integration tests around route/middleware boundaries
- Add CI pipeline (lint + test + build) and deploy preview
