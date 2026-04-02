import {
  listUsers,
  getUserById,
  updateRole,
  toggleStatus,
  softDeleteUser,
} from './users.controller';
import { usersService } from './users.service';
import { ApiResponse } from '../../utils/ApiResponse';

jest.mock('./users.service', () => ({
  usersService: {
    list: jest.fn(),
    getById: jest.fn(),
    updateRole: jest.fn(),
    toggleStatus: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock('../../utils/ApiResponse', () => ({
  ApiResponse: {
    success: jest.fn(),
    paginated: jest.fn(),
  },
}));

const usersServiceMock = usersService as unknown as {
  list: jest.Mock;
  getById: jest.Mock;
  updateRole: jest.Mock;
  toggleStatus: jest.Mock;
  softDelete: jest.Mock;
};

const apiResponseSuccessMock = ApiResponse.success as unknown as jest.Mock;
const apiResponsePaginatedMock = ApiResponse.paginated as unknown as jest.Mock;

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

describe('users.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listUsers calls service with validated query and paginates response', async () => {
    const req = { validatedQuery: { page: 2, limit: 5 } };
    const res = {};
    const next = jest.fn();
    usersServiceMock.list.mockResolvedValue({
      users: [{ id: 'u1' }],
      page: 2,
      limit: 5,
      total: 17,
    });

    await runAsyncHandler(listUsers as never, req, res, next);

    expect(usersServiceMock.list).toHaveBeenCalledWith(2, 5);
    expect(apiResponsePaginatedMock).toHaveBeenCalledWith(
      res,
      'Users fetched successfully',
      [{ id: 'u1' }],
      { page: 2, limit: 5, total: 17 },
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('getUserById calls service with route param and returns success', async () => {
    const req = { params: { id: 'u1' } };
    const res = {};
    const next = jest.fn();
    usersServiceMock.getById.mockResolvedValue({ id: 'u1' });

    await runAsyncHandler(getUserById as never, req, res, next);

    expect(usersServiceMock.getById).toHaveBeenCalledWith('u1');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'User fetched successfully',
      { id: 'u1' },
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('updateRole calls service with id and body role', async () => {
    const req = { params: { id: 'u1' }, body: { role: 'ADMIN' } };
    const res = {};
    const next = jest.fn();
    usersServiceMock.updateRole.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
    });

    await runAsyncHandler(updateRole as never, req, res, next);

    expect(usersServiceMock.updateRole).toHaveBeenCalledWith('u1', 'ADMIN');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(res, 'User role updated', {
      id: 'u1',
      role: 'ADMIN',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('toggleStatus calls service with id and body isActive', async () => {
    const req = {
      params: { id: 'u1' },
      body: { isActive: false },
    };
    const res = {};
    const next = jest.fn();
    usersServiceMock.toggleStatus.mockResolvedValue({
      id: 'u1',
      isActive: false,
    });

    await runAsyncHandler(toggleStatus as never, req, res, next);

    expect(usersServiceMock.toggleStatus).toHaveBeenCalledWith('u1', false);
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(res, 'User status updated', {
      id: 'u1',
      isActive: false,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('softDeleteUser calls service with id and returns success', async () => {
    const req = { params: { id: 'u1' } };
    const res = {};
    const next = jest.fn();
    usersServiceMock.softDelete.mockResolvedValue({ id: 'u1' });

    await runAsyncHandler(softDeleteUser as never, req, res, next);

    expect(usersServiceMock.softDelete).toHaveBeenCalledWith('u1');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(res, 'User deactivated', {
      id: 'u1',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
