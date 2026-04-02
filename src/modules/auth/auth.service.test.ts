import { authService } from './auth.service';
import prisma from '../../config/db';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@/config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(),
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
};

const hashMock = hash as unknown as jest.Mock;
const compareMock = compare as unknown as jest.Mock;
const signMock = jwt.sign as unknown as jest.Mock;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user and returns token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    hashMock.mockResolvedValue('hashed-password');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    prismaMock.user.create.mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt,
    });
    signMock.mockReturnValue('jwt-token');

    const result = await authService.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'alice@example.com' },
    });
    expect(hashMock).toHaveBeenCalledWith('password123', 12);
    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(signMock).toHaveBeenCalledWith(
      {
        userId: 'u1',
        email: 'alice@example.com',
        role: 'VIEWER',
      },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.any(String) }),
    );
    expect(result).toEqual({
      user: {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'VIEWER',
        isActive: true,
        createdAt,
      },
      token: 'jwt-token',
    });
  });

  it('throws conflict when registering existing email', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      authService.register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: 'Email already registered',
    });
  });

  it('throws unauthorized when login email does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('throws forbidden when account is inactive', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: false,
      password: 'hashed-password',
    });

    await expect(
      authService.login({
        email: 'alice@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
      message: 'Account has been deactivated',
    });
  });

  it('throws unauthorized when password is invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      password: 'hashed-password',
    });
    compareMock.mockResolvedValue(false);

    await expect(
      authService.login({
        email: 'alice@example.com',
        password: 'bad-password',
      }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('logs in user and returns sanitized payload with token', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      password: 'hashed-password',
    });
    compareMock.mockResolvedValue(true);
    signMock.mockReturnValue('jwt-token');

    const result = await authService.login({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(compareMock).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(signMock).toHaveBeenCalledWith(
      {
        userId: 'u1',
        email: 'alice@example.com',
        role: 'VIEWER',
      },
      expect.any(String),
      expect.objectContaining({ expiresIn: expect.any(String) }),
    );
    expect(result).toEqual({
      user: {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'VIEWER',
        isActive: true,
      },
      token: 'jwt-token',
    });
  });

  it('throws not found when getMe user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(authService.getMe('missing-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'User not found',
    });
  });
});
