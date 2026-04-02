import {
  createRecord,
  listRecords,
  getRecord,
  updateRecord,
  deleteRecord,
} from './records.controller';
import { recordsService } from './records.service';
import { ApiResponse } from '../../utils/ApiResponse';

jest.mock('./records.service', () => ({
  recordsService: {
    create: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
}));

jest.mock('../../utils/ApiResponse', () => ({
  ApiResponse: {
    success: jest.fn(),
    paginated: jest.fn(),
  },
}));

const recordsServiceMock = recordsService as unknown as {
  create: jest.Mock;
  list: jest.Mock;
  getById: jest.Mock;
  update: jest.Mock;
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

describe('records.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createRecord calls service with body and req.user userId', async () => {
    const req = {
      body: {
        amount: 100,
        type: 'INCOME',
        category: 'Salary',
        date: '2026-01-01T00:00:00.000Z',
      },
      user: { userId: 'u1' },
    };
    const res = {};
    const next = jest.fn();
    recordsServiceMock.create.mockResolvedValue({ id: 'r1' });

    await runAsyncHandler(createRecord as never, req, res, next);

    expect(recordsServiceMock.create).toHaveBeenCalledWith(req.body, 'u1');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Record created successfully',
      { id: 'r1' },
      201,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('listRecords calls service with validated query and paginates response', async () => {
    const req = {
      validatedQuery: {
        type: 'EXPENSE',
        category: 'Food',
        dateFrom: '2026-02-01T00:00:00.000Z',
        dateTo: '2026-02-28T23:59:59.999Z',
        page: 1,
        limit: 10,
      },
    };
    const res = {};
    const next = jest.fn();
    recordsServiceMock.list.mockResolvedValue({
      records: [{ id: 'r1' }],
      page: 1,
      limit: 10,
      total: 1,
    });

    await runAsyncHandler(listRecords as never, req, res, next);

    expect(recordsServiceMock.list).toHaveBeenCalledWith(req.validatedQuery);
    expect(apiResponsePaginatedMock).toHaveBeenCalledWith(
      res,
      'Records fetched successfully',
      [{ id: 'r1' }],
      { page: 1, limit: 10, total: 1 },
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('getRecord calls service with route id and returns success', async () => {
    const req = { params: { id: 'r1' } };
    const res = {};
    const next = jest.fn();
    recordsServiceMock.getById.mockResolvedValue({ id: 'r1' });

    await runAsyncHandler(getRecord as never, req, res, next);

    expect(recordsServiceMock.getById).toHaveBeenCalledWith('r1');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Record fetched successfully',
      { id: 'r1' },
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('updateRecord calls service with route id and body', async () => {
    const req = {
      params: { id: 'r1' },
      body: { notes: 'updated notes' },
    };
    const res = {};
    const next = jest.fn();
    recordsServiceMock.update.mockResolvedValue({
      id: 'r1',
      notes: 'updated notes',
    });

    await runAsyncHandler(updateRecord as never, req, res, next);

    expect(recordsServiceMock.update).toHaveBeenCalledWith('r1', {
      notes: 'updated notes',
    });
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Record updated successfully',
      { id: 'r1', notes: 'updated notes' },
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deleteRecord calls service with route id and returns success', async () => {
    const req = { params: { id: 'r1' } };
    const res = {};
    const next = jest.fn();
    recordsServiceMock.softDelete.mockResolvedValue({ id: 'r1' });

    await runAsyncHandler(deleteRecord as never, req, res, next);

    expect(recordsServiceMock.softDelete).toHaveBeenCalledWith('r1');
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Record deleted successfully',
      { id: 'r1' },
    );
    expect(next).not.toHaveBeenCalled();
  });
});
