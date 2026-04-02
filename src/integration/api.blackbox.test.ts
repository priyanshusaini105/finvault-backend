import { randomUUID } from 'crypto';
import request from 'supertest';
import { hash } from 'bcryptjs';
import { RecordType, Role } from '@prisma/client';
import app from '../app';
import prisma from '../config/db';

const api = request(app);
const TEST_PASSWORD = 'Password123!';
const RUN_ID = `bb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const SEEDED_EXPENSE_CATEGORY = `expense-seed-${RUN_ID}`;
const SEEDED_INCOME_CATEGORY = `income-seed-${RUN_ID}`;

type FixtureUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
};

let passwordHash = '';
let viewerUser: FixtureUser;
let analystUser: FixtureUser;
let adminUser: FixtureUser;

let viewerToken = '';
let analystToken = '';
let adminToken = '';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function scopedEmail(prefix: string) {
  return `${prefix}-${RUN_ID}-${randomUUID().slice(0, 8)}@example.com`;
}

async function createFixtureUser(
  role: Role,
  prefix: string,
  isActive = true,
): Promise<FixtureUser> {
  return prisma.user.create({
    data: {
      name: `${prefix}-${RUN_ID}`,
      email: scopedEmail(prefix),
      password: passwordHash,
      role,
      isActive,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });
}

async function loginForToken(email: string, password: string) {
  const response = await api.post('/api/auth/login').send({
    email,
    password,
  });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.token).toEqual(expect.any(String));

  return response.body.data.token as string;
}

async function createRecordAsAdmin(overrides?: {
  amount?: number;
  type?: RecordType;
  category?: string;
  date?: string;
  notes?: string;
}) {
  const payload = {
    amount: 1250.5,
    type: RecordType.EXPENSE,
    category: `record-${RUN_ID}`,
    date: '2026-01-15T00:00:00.000Z',
    notes: `created-${RUN_ID}`,
    ...overrides,
  };

  const response = await api
    .post('/api/records')
    .set(authHeader(adminToken))
    .send(payload);

  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);

  return response.body.data as {
    id: string;
    amount: number;
    type: RecordType;
    category: string;
    date: string;
    notes?: string;
    createdBy: string;
  };
}

describe('FinVault API black-box integration', () => {
  beforeAll(async () => {
    passwordHash = await hash(TEST_PASSWORD, 12);

    viewerUser = await createFixtureUser(Role.VIEWER, 'viewer-fixture');
    analystUser = await createFixtureUser(Role.ANALYST, 'analyst-fixture');
    adminUser = await createFixtureUser(Role.ADMIN, 'admin-fixture');

    await prisma.financialRecord.createMany({
      data: [
        {
          amount: 2500,
          type: RecordType.INCOME,
          category: SEEDED_INCOME_CATEGORY,
          date: new Date('2026-01-10T00:00:00.000Z'),
          notes: `seed-income-${RUN_ID}`,
          createdBy: adminUser.id,
        },
        {
          amount: 1300,
          type: RecordType.EXPENSE,
          category: SEEDED_EXPENSE_CATEGORY,
          date: new Date('2026-01-11T00:00:00.000Z'),
          notes: `seed-expense-${RUN_ID}`,
          createdBy: adminUser.id,
        },
      ],
    });

    viewerToken = await loginForToken(viewerUser.email, TEST_PASSWORD);
    analystToken = await loginForToken(analystUser.email, TEST_PASSWORD);
    adminToken = await loginForToken(adminUser.email, TEST_PASSWORD);
  }, 60000);

  afterAll(async () => {
    await prisma.financialRecord.deleteMany({
      where: {
        OR: [
          { category: { contains: RUN_ID } },
          { notes: { contains: RUN_ID } },
          { createdBy: adminUser?.id },
          { createdBy: analystUser?.id },
          { createdBy: viewerUser?.id },
        ],
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: RUN_ID,
        },
      },
    });

    await prisma.$disconnect();
  }, 30000);

  describe('Health endpoint', () => {
    it('[GET /api/health] returns API health status', async () => {
      const response = await api.get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'FinVault API is running',
      });
    });
  });

  describe('Auth endpoints', () => {
    it('[POST /api/auth/register] registers a viewer user and returns token', async () => {
      const email = scopedEmail('register-success');
      const response = await api.post('/api/auth/register').send({
        name: 'Register Success',
        email,
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.user.role).toBe(Role.VIEWER);
      expect(response.body.data.token).toEqual(expect.any(String));
    });

    it('[POST /api/auth/register] rejects duplicate email with conflict', async () => {
      const email = scopedEmail('register-duplicate');

      const first = await api.post('/api/auth/register').send({
        name: 'Duplicate One',
        email,
        password: TEST_PASSWORD,
      });
      expect(first.status).toBe(201);

      const second = await api.post('/api/auth/register').send({
        name: 'Duplicate Two',
        email,
        password: TEST_PASSWORD,
      });

      expect(second.status).toBe(409);
      expect(second.body.success).toBe(false);
      expect(second.body.code).toBe('CONFLICT');
      expect(second.body.message).toBe('Email already registered');
    });

    it('[POST /api/auth/register] rejects invalid email and short password', async () => {
      const response = await api.post('/api/auth/register').send({
        name: 'Bad Register',
        email: 'not-an-email',
        password: '123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      );
    });

    it('[POST /api/auth/login] logs in existing user with correct password', async () => {
      const response = await api.post('/api/auth/login').send({
        email: viewerUser.email,
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(viewerUser.email);
      expect(response.body.data.token).toEqual(expect.any(String));
    });

    it('[POST /api/auth/login] rejects wrong password', async () => {
      const response = await api.post('/api/auth/login').send({
        email: viewerUser.email,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[POST /api/auth/login] rejects unknown email', async () => {
      const response = await api.post('/api/auth/login').send({
        email: scopedEmail('unknown-login'),
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[POST /api/auth/login] rejects deactivated account', async () => {
      const deactivatedUser = await createFixtureUser(
        Role.VIEWER,
        'deactivated-login',
        false,
      );

      const response = await api.post('/api/auth/login').send({
        email: deactivatedUser.email,
        password: TEST_PASSWORD,
      });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[GET /api/auth/me] returns user profile for valid token', async () => {
      const response = await api.get('/api/auth/me').set(authHeader(viewerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(viewerUser.id);
      expect(response.body.data.email).toBe(viewerUser.email);
    });

    it('[GET /api/auth/me] rejects missing bearer token', async () => {
      const response = await api.get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[GET /api/auth/me] rejects malformed bearer token', async () => {
      const response = await api
        .get('/api/auth/me')
        .set(authHeader('not-a-real-jwt-token'));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[GET /api/auth/me] rejects token for user deactivated after login', async () => {
      const user = await createFixtureUser(Role.VIEWER, 'me-deactivated-later');
      const loginResponse = await api.post('/api/auth/login').send({
        email: user.email,
        password: TEST_PASSWORD,
      });

      expect(loginResponse.status).toBe(200);

      const token = loginResponse.body.data.token as string;

      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      const response = await api.get('/api/auth/me').set(authHeader(token));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Users endpoints', () => {
    it('[GET /api/users] allows admin to list users with pagination metadata', async () => {
      const response = await api
        .get('/api/users')
        .query({ page: 1, limit: 100 })
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 100 }),
      );
      expect(response.body.meta.total).toEqual(expect.any(Number));
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('[GET /api/users] rejects request without token', async () => {
      const response = await api.get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[GET /api/users] rejects viewer without users:manage permission', async () => {
      const response = await api.get('/api/users').set(authHeader(viewerToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[GET /api/users] rejects invalid pagination query params', async () => {
      const response = await api
        .get('/api/users')
        .query({ page: 0, limit: 101 })
        .set(authHeader(adminToken));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('[GET /api/users/:id] allows admin to fetch user by id', async () => {
      const response = await api
        .get(`/api/users/${viewerUser.id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(viewerUser.id);
      expect(response.body.data.email).toBe(viewerUser.email);
    });

    it('[GET /api/users/:id] returns not found for unknown user id', async () => {
      const response = await api
        .get(`/api/users/${randomUUID()}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('[PATCH /api/users/:id/role] allows admin to update user role', async () => {
      const managedUser = await createFixtureUser(Role.VIEWER, 'role-update');

      const response = await api
        .patch(`/api/users/${managedUser.id}/role`)
        .set(authHeader(adminToken))
        .send({ role: Role.ANALYST });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(managedUser.id);
      expect(response.body.data.role).toBe(Role.ANALYST);
    });

    it('[PATCH /api/users/:id/role] rejects invalid role payload', async () => {
      const managedUser = await createFixtureUser(Role.VIEWER, 'role-invalid');

      const response = await api
        .patch(`/api/users/${managedUser.id}/role`)
        .set(authHeader(adminToken))
        .send({ role: 'SUPER_ADMIN' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('[PATCH /api/users/:id/role] rejects analyst without users:manage permission', async () => {
      const managedUser = await createFixtureUser(Role.VIEWER, 'role-forbidden');

      const response = await api
        .patch(`/api/users/${managedUser.id}/role`)
        .set(authHeader(analystToken))
        .send({ role: Role.ADMIN });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[PATCH /api/users/:id/role] returns not found for unknown user', async () => {
      const response = await api
        .patch(`/api/users/${randomUUID()}/role`)
        .set(authHeader(adminToken))
        .send({ role: Role.VIEWER });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('[PATCH /api/users/:id/status] allows admin to toggle active status', async () => {
      const managedUser = await createFixtureUser(Role.VIEWER, 'status-update');

      const response = await api
        .patch(`/api/users/${managedUser.id}/status`)
        .set(authHeader(adminToken))
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(managedUser.id);
      expect(response.body.data.isActive).toBe(false);
    });

    it('[PATCH /api/users/:id/status] rejects invalid status payload', async () => {
      const managedUser = await createFixtureUser(Role.VIEWER, 'status-invalid');

      const response = await api
        .patch(`/api/users/${managedUser.id}/status`)
        .set(authHeader(adminToken))
        .send({ isActive: 'true' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('[DELETE /api/users/:id] allows admin to deactivate a user', async () => {
      const managedUser = await createFixtureUser(Role.VIEWER, 'delete-user');

      const response = await api
        .delete(`/api/users/${managedUser.id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(managedUser.id);

      const loginResponse = await api.post('/api/auth/login').send({
        email: managedUser.email,
        password: TEST_PASSWORD,
      });

      expect(loginResponse.status).toBe(403);
      expect(loginResponse.body.code).toBe('FORBIDDEN');
    });

    it('[DELETE /api/users/:id] returns not found for unknown id', async () => {
      const response = await api
        .delete(`/api/users/${randomUUID()}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Records endpoints', () => {
    it('[POST /api/records] allows admin to create financial record', async () => {
      const response = await api
        .post('/api/records')
        .set(authHeader(adminToken))
        .send({
          amount: 1900.75,
          type: RecordType.INCOME,
          category: `income-create-${RUN_ID}`,
          date: '2026-02-10T00:00:00.000Z',
          notes: `income-create-note-${RUN_ID}`,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toEqual(expect.any(String));
      expect(response.body.data.amount).toBe(1900.75);
      expect(response.body.data.type).toBe(RecordType.INCOME);
      expect(response.body.data.createdBy).toBe(adminUser.id);
    });

    it('[POST /api/records] rejects request without token', async () => {
      const response = await api.post('/api/records').send({
        amount: 100,
        type: RecordType.EXPENSE,
        category: `unauth-create-${RUN_ID}`,
        date: '2026-02-11T00:00:00.000Z',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[POST /api/records] rejects viewer without records:write permission', async () => {
      const response = await api
        .post('/api/records')
        .set(authHeader(viewerToken))
        .send({
          amount: 100,
          type: RecordType.EXPENSE,
          category: `viewer-create-${RUN_ID}`,
          date: '2026-02-11T00:00:00.000Z',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[POST /api/records] rejects invalid payload with validation errors', async () => {
      const response = await api.post('/api/records').set(authHeader(adminToken)).send({
        amount: -1,
        type: 'NOT_A_TYPE',
        category: '',
        date: 'not-a-date',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('[GET /api/records] allows viewer to list records', async () => {
      const response = await api
        .get('/api/records')
        .query({ page: 1, limit: 10 })
        .set(authHeader(viewerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toEqual(expect.objectContaining({ page: 1, limit: 10 }));
      expect(response.body.meta.total).toEqual(expect.any(Number));
    });

    it('[GET /api/records] applies filters for type, category, date range, and pagination', async () => {
      await createRecordAsAdmin({
        amount: 777,
        type: RecordType.EXPENSE,
        category: `filter-target-${RUN_ID}`,
        date: '2026-03-10T00:00:00.000Z',
        notes: `filter-record-${RUN_ID}`,
      });

      const response = await api
        .get('/api/records')
        .query({
          type: RecordType.EXPENSE,
          category: `filter-target-${RUN_ID}`,
          dateFrom: '2026-03-01T00:00:00.000Z',
          dateTo: '2026-03-31T23:59:59.999Z',
          page: 1,
          limit: 5,
        })
        .set(authHeader(analystToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.data.length).toBeGreaterThan(0);

      for (const record of response.body.data as Array<Record<string, unknown>>) {
        expect(record.category).toBe(`filter-target-${RUN_ID}`);
        expect(record.type).toBe(RecordType.EXPENSE);
      }
    });

    it('[GET /api/records] rejects invalid query params', async () => {
      const response = await api
        .get('/api/records')
        .query({ page: 0, limit: 101, dateFrom: 'invalid-date' })
        .set(authHeader(viewerToken));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('[GET /api/records/:id] returns single record for permitted user', async () => {
      const record = await createRecordAsAdmin({
        category: `get-by-id-${RUN_ID}`,
      });

      const response = await api
        .get(`/api/records/${record.id}`)
        .set(authHeader(viewerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(record.id);
      expect(response.body.data.category).toBe(`get-by-id-${RUN_ID}`);
    });

    it('[GET /api/records/:id] returns not found for unknown record', async () => {
      const response = await api
        .get(`/api/records/${randomUUID()}`)
        .set(authHeader(viewerToken));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('[PATCH /api/records/:id] allows admin to update record', async () => {
      const record = await createRecordAsAdmin({
        category: `update-target-${RUN_ID}`,
      });

      const response = await api
        .patch(`/api/records/${record.id}`)
        .set(authHeader(adminToken))
        .send({
          amount: 2222.22,
          notes: `updated-note-${RUN_ID}`,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(record.id);
      expect(response.body.data.amount).toBe(2222.22);
      expect(response.body.data.notes).toBe(`updated-note-${RUN_ID}`);
    });

    it('[PATCH /api/records/:id] rejects viewer without write permission', async () => {
      const record = await createRecordAsAdmin({
        category: `update-forbidden-${RUN_ID}`,
      });

      const response = await api
        .patch(`/api/records/${record.id}`)
        .set(authHeader(viewerToken))
        .send({ notes: 'should-fail' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[PATCH /api/records/:id] rejects invalid update payload', async () => {
      const record = await createRecordAsAdmin({
        category: `update-invalid-${RUN_ID}`,
      });

      const response = await api
        .patch(`/api/records/${record.id}`)
        .set(authHeader(adminToken))
        .send({ amount: -99 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('[PATCH /api/records/:id] returns not found for unknown record', async () => {
      const response = await api
        .patch(`/api/records/${randomUUID()}`)
        .set(authHeader(adminToken))
        .send({ notes: 'missing record' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('[DELETE /api/records/:id] allows admin soft delete and hides record from reads', async () => {
      const record = await createRecordAsAdmin({
        category: `delete-target-${RUN_ID}`,
      });

      const deleteResponse = await api
        .delete(`/api/records/${record.id}`)
        .set(authHeader(adminToken));

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.id).toBe(record.id);
      expect(deleteResponse.body.data.deletedAt).toEqual(expect.any(String));

      const getAfterDelete = await api
        .get(`/api/records/${record.id}`)
        .set(authHeader(viewerToken));

      expect(getAfterDelete.status).toBe(404);
      expect(getAfterDelete.body.code).toBe('NOT_FOUND');
    });

    it('[DELETE /api/records/:id] rejects viewer without delete permission', async () => {
      const record = await createRecordAsAdmin({
        category: `delete-forbidden-${RUN_ID}`,
      });

      const response = await api
        .delete(`/api/records/${record.id}`)
        .set(authHeader(viewerToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[DELETE /api/records/:id] returns not found for unknown record', async () => {
      const response = await api
        .delete(`/api/records/${randomUUID()}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Dashboard endpoints', () => {
    it('[GET /api/dashboard/summary] allows viewer to fetch summary totals', async () => {
      const response = await api
        .get('/api/dashboard/summary')
        .set(authHeader(viewerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalIncome).toEqual(expect.any(Number));
      expect(response.body.data.totalExpenses).toEqual(expect.any(Number));
      expect(response.body.data.netBalance).toEqual(expect.any(Number));
    }, 10000);

    it('[GET /api/dashboard/summary] rejects request without token', async () => {
      const response = await api.get('/api/dashboard/summary');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('[GET /api/dashboard/recent] allows viewer to fetch recent activity', async () => {
      const response = await api
        .get('/api/dashboard/recent')
        .set(authHeader(viewerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('[GET /api/dashboard/trends] allows analyst to fetch trends', async () => {
      const response = await api
        .get('/api/dashboard/trends')
        .set(authHeader(analystToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      for (const row of response.body.data as Array<Record<string, unknown>>) {
        expect(row.month).toEqual(expect.any(String));
        expect(row.income).toEqual(expect.any(Number));
        expect(row.expense).toEqual(expect.any(Number));
      }
    });

    it('[GET /api/dashboard/trends] rejects viewer without dashboard:analytics permission', async () => {
      const response = await api
        .get('/api/dashboard/trends')
        .set(authHeader(viewerToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });

    it('[GET /api/dashboard/categories] allows analyst to fetch category breakdown', async () => {
      const response = await api
        .get('/api/dashboard/categories')
        .set(authHeader(analystToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      const seededCategory = (response.body.data as Array<Record<string, unknown>>).find(
        (item) => item.category === SEEDED_EXPENSE_CATEGORY,
      );

      expect(seededCategory).toBeDefined();
      expect(seededCategory?.total).toEqual(expect.any(Number));
      expect(seededCategory?.percentage).toEqual(expect.any(Number));
    });

    it('[GET /api/dashboard/categories] rejects viewer without dashboard:analytics permission', async () => {
      const response = await api
        .get('/api/dashboard/categories')
        .set(authHeader(viewerToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('Response contract checks', () => {
    it('[ANY /api/*] returns standard error envelope for validation failures', async () => {
      const response = await api
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.any(String),
          code: 'VALIDATION_ERROR',
          details: expect.any(Array),
        }),
      );
    });

    it('[ANY /api/*] returns standard success envelope for successful reads', async () => {
      const response = await api.get('/api/auth/me').set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          data: expect.any(Object),
        }),
      );
    });

    it('[ANY /api/*] returns paginated success envelope for list endpoints', async () => {
      const response = await api
        .get('/api/records')
        .query({ page: 1, limit: 5 })
        .set(authHeader(viewerToken));

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          data: expect.any(Array),
          meta: expect.objectContaining({
            page: 1,
            limit: 5,
            total: expect.any(Number),
          }),
        }),
      );
    });
  });
});
