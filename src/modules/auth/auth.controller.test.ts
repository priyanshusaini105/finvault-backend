import { register, login, getMe } from './auth.controller';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';

jest.mock('./auth.service', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
  },
}));

jest.mock('../../utils/ApiResponse', () => ({
  ApiResponse: {
    success: jest.fn(),
    paginated: jest.fn(),
  },
}));

const authServiceMock = authService as unknown as {
  register: jest.Mock;
  login: jest.Mock;
  getMe: jest.Mock;
};

const apiResponseSuccessMock = ApiResponse.success as unknown as jest.Mock;

async function runAsyncHandler(
  handler: (req: unknown, res: unknown, next: jest.Mock) => void,
  req: unknown,
  res: unknown,
  next: jest.Mock,
) {
  handler(req, res, next);
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

describe('auth.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('register sends created response with user and token', async () => {
    const req = {
      body: {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
      },
    };
    const res = {};
    const next = jest.fn();
    const serviceResult = {
      user: {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'VIEWER',
      },
      token: 'token',
    };

    authServiceMock.register.mockResolvedValue(serviceResult);

    await runAsyncHandler(register as never, req, res, next);

    expect(authServiceMock.register).toHaveBeenCalledWith(req.body);
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'User registered successfully',
      serviceResult,
      201,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('login sends success response with user and token', async () => {
    const req = {
      body: {
        email: 'alice@example.com',
        password: 'password123',
      },
    };
    const res = {};
    const next = jest.fn();
    const serviceResult = {
      user: {
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'VIEWER',
        isActive: true,
      },
      token: 'token',
    };

    authServiceMock.login.mockResolvedValue(serviceResult);

    await runAsyncHandler(login as never, req, res, next);

    expect(authServiceMock.login).toHaveBeenCalledWith(req.body);
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Login successful',
      serviceResult,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('getMe sends success response with profile data', async () => {
    const req = { user: { userId: 'u1' } };
    const res = {};
    const next = jest.fn();
    const profile = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'VIEWER',
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    authServiceMock.getMe.mockResolvedValue(profile);

    await runAsyncHandler(getMe as never, req, res, next);

    expect(authServiceMock.getMe).toHaveBeenCalledWith('u1');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(res, 'Profile fetched', profile);
    expect(next).not.toHaveBeenCalled();
  });
});
