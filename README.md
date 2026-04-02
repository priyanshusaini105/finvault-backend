# FinVault API

Finance data processing and access control backend API with role-based access control and dashboard analytics.

## Overview

FinVault is a TypeScript/Express.js backend for managing financial records with granular permission-based access control. It provides aggregated dashboard data and CRUD operations for financial records, supporting three user roles: Viewer, Analyst, and Admin.

### Tech Stack

- **Language**: TypeScript (Node.js 20+)
- **Framework**: Express.js 5
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Zod schemas
- **API Documentation**: Swagger/OpenAPI (swagger-ui-express + swagger-jsdoc)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm package manager
- PostgreSQL database

### Installation

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` and configure your `DATABASE_URL`
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Generate Prisma client:
   ```bash
   pnpm db:generate
   ```
6. Run database migrations:
   ```bash
   pnpm db:migrate
   ```
7. Seed the database with sample data:
   ```bash
   pnpm db:seed
   ```
8. Start the development server:
   ```bash
   pnpm dev
   ```

The API will be available at `http://localhost:3000`

### Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/finvault
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
PORT=3000
```

## API Documentation

Interactive API documentation is available via Swagger UI at `/api/docs` when the server is running. This provides a full list of endpoints, request/response schemas, and allows testing endpoints directly from your browser.

Access at: `http://localhost:3000/api/docs`

## Architecture

The project follows a modular, domain-driven architecture with clear separation of concerns:

```
src/
  config/         # Database and environment configuration
  middleware/     # Auth, RBAC, validation, and error handling
  modules/       # Feature modules (auth, users, records, dashboard)
  utils/         # Shared utilities (ApiResponse, ApiError, asyncHandler)
  app.ts         # Express app setup and middleware registration
  server.ts      # HTTP server startup
```

### Request Flow

1. **Middleware Layer** - Request validation, authentication, and permission checks
2. **Controller Layer** - Handles HTTP request/response, calls services
3. **Service Layer** - Business logic, database operations via Prisma
4. **Database** - PostgreSQL via Prisma client

### RBAC Implementation

Role-based access control is enforced at the middleware level using `requirePermission(permission)`. No inline role checks exist in controllers. Permissions are mapped to roles in a centralized permission matrix.

## RBAC Permission Matrix

| Permission | Viewer | Analyst | Admin |
|-----------|:------:|:-------:|:-----:|
| records:read | ✅ | ✅ | ✅ |
| records:write | ❌ | ❌ | ✅ |
| records:delete | ❌ | ❌ | ✅ |
| dashboard:summary | ✅ | ✅ | ✅ |
| dashboard:analytics | ❌ | ✅ | ✅ |
| users:manage | ❌ | ❌ | ✅ |

## API Endpoints

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and get JWT |
| GET | `/api/auth/me` | Any auth | Get current user profile |

### Users
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/users` | Admin | List all users (paginated) |
| PATCH | `/api/users/:id/role` | Admin | Update user role |
| PATCH | `/api/users/:id/status` | Admin | Toggle user active status |
| DELETE | `/api/users/:id` | Admin | Soft delete user |

### Financial Records
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/records` | Admin | Create a record |
| GET | `/api/records` | Viewer+ | List records (filterable, paginated) |
| GET | `/api/records/:id` | Viewer+ | Get single record |
| PATCH | `/api/records/:id` | Admin | Update record |
| DELETE | `/api/records/:id` | Admin | Soft delete record |

### Dashboard
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/dashboard/summary` | Viewer+ | Total income, expenses, net balance |
| GET | `/api/dashboard/trends` | Analyst+ | Monthly trends (last 6 months) |
| GET | `/api/dashboard/categories` | Analyst+ | Category breakdown with percentages |
| GET | `/api/dashboard/recent` | Viewer+ | Last 10 transactions |

### Filtering Records

GET `/api/records` supports the following query parameters:
- `type`: Filter by `INCOME` or `EXPENSE`
- `category`: Filter by category string
- `dateFrom`: ISO 8601 date-time (inclusive start)
- `dateTo`: ISO 8601 date-time (inclusive end)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

Example: `/api/records?type=INCOME&category=Salary&dateFrom=2025-01-01&dateTo=2025-03-31&page=1&limit=10`

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Database | PostgreSQL | Relational model fits financial data; native GROUP BY for aggregations |
| ORM | Prisma | Schema-first approach, type-safe queries, clean migration history |
| Auth | JWT | Stateless and scalable; role embedded in token avoids DB calls per request |
| Validation | Zod | TypeScript-native, composable schemas, clean error messages |
| Soft Delete | Yes | Financial records should never be permanently erased - audit trail matters |
| RBAC Pattern | Permission middleware | Centralized, testable, no scattered role checks in controllers |

## Trade-offs

| Trade-off | Decision | Why |
|-----------|----------|-----|
| Refresh tokens | Access token only (7d expiry) | Keeps auth simple for assessment scope |
| Rate limiting | Skipped | Not core to evaluation; would add in production |
| Full-text search | Skipped | Basic category/type filtering covers requirements |
| Swagger spec | JSDoc annotations | Co-located with routes = easier to keep in sync |

## Assumptions

- One user has exactly one role (no multi-role support in v1)
- Amount is stored as `Decimal` (not float) to avoid floating point precision issues with money
- All dates stored/returned in ISO 8601 UTC format
- Soft-deleted records are excluded from all reads and aggregations by default
- Default role for new registrations is `VIEWER` unless explicitly set by admin
- `category` is a free-form string (no predefined enum) for flexibility
- JWT tokens expire in 7 days by default

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run Jest tests
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with sample data
