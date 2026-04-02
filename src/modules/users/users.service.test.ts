import { usersService } from './users.service';
import prisma from '../../config/db';

jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists users with pagination metadata', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'VIEWER',
        isActive: true,
        createdAt,
      },
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const result = await usersService.list(1, 10);

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(prismaMock.user.count).toHaveBeenCalledWith();
    expect(result).toEqual({
      users: [
        {
          id: 'u1',
          name: 'Alice',
          email: 'alice@example.com',
          role: 'VIEWER',
          isActive: true,
          createdAt,
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it('gets user by id', async () => {
    const user = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await usersService.getById('u1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
    expect(result).toEqual(user);
  });

  it('throws not found when getById user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(usersService.getById('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'User not found',
    });
  });

  it('updates user role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });
    const updated = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'ADMIN',
      isActive: true,
    };
    prismaMock.user.update.mockResolvedValue(updated);

    const result = await usersService.updateRole('u1', 'ADMIN');

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { role: 'ADMIN' },
      }),
    );
    expect(result).toEqual(updated);
  });

  it('toggles user status', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });
    const updated = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: false,
    };
    prismaMock.user.update.mockResolvedValue(updated);

    const result = await usersService.toggleStatus('u1', false);

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { isActive: false },
      }),
    );
    expect(result).toEqual(updated);
  });

  it('deactivates user via softDelete', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1' });
    const updated = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
    };
    prismaMock.user.update.mockResolvedValue(updated);

    const result = await usersService.softDelete('u1');

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { isActive: false },
      }),
    );
    expect(result).toEqual(updated);
  });
});
