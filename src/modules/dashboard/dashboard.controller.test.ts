import {
  getSummary,
  getTrends,
  getCategoryBreakdown,
  getRecent,
} from './dashboard.controller';
import { dashboardService } from './dashboard.service';
import { ApiResponse } from '../../utils/ApiResponse';

jest.mock('./dashboard.service', () => ({
  dashboardService: {
    getSummary: jest.fn(),
    getTrends: jest.fn(),
    getCategoryBreakdown: jest.fn(),
    getRecent: jest.fn(),
  },
}));

jest.mock('../../utils/ApiResponse', () => ({
  ApiResponse: {
    success: jest.fn(),
    paginated: jest.fn(),
  },
}));

const dashboardServiceMock = dashboardService as unknown as {
  getSummary: jest.Mock;
  getTrends: jest.Mock;
  getCategoryBreakdown: jest.Mock;
  getRecent: jest.Mock;
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

describe('dashboard.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getSummary returns success response with summary payload', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    dashboardServiceMock.getSummary.mockResolvedValue({
      totalIncome: 500,
      totalExpenses: 200,
      netBalance: 300,
    });

    await runAsyncHandler(getSummary as never, req, res, next);

    expect(dashboardServiceMock.getSummary).toHaveBeenCalledWith();
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Dashboard summary fetched',
      {
        totalIncome: 500,
        totalExpenses: 200,
        netBalance: 300,
      },
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('getTrends returns success response with trend data', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    dashboardServiceMock.getTrends.mockResolvedValue([
      { month: '2026-01', income: 100, expense: 50 },
    ]);

    await runAsyncHandler(getTrends as never, req, res, next);

    expect(dashboardServiceMock.getTrends).toHaveBeenCalledWith();
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(res, 'Monthly trends fetched', [
      { month: '2026-01', income: 100, expense: 50 },
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it('getCategoryBreakdown returns success response with category stats', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    dashboardServiceMock.getCategoryBreakdown.mockResolvedValue([
      { category: 'Food', total: 75, percentage: 75 },
    ]);

    await runAsyncHandler(getCategoryBreakdown as never, req, res, next);

    expect(dashboardServiceMock.getCategoryBreakdown).toHaveBeenCalledWith();
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(
      res,
      'Category breakdown fetched',
      [{ category: 'Food', total: 75, percentage: 75 }],
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('getRecent returns success response with recent records', async () => {
    const req = {};
    const res = {};
    const next = jest.fn();
    dashboardServiceMock.getRecent.mockResolvedValue([{ id: 'r1', amount: 22.5 }]);

    await runAsyncHandler(getRecent as never, req, res, next);

    expect(dashboardServiceMock.getRecent).toHaveBeenCalledWith();
    expect(apiResponseSuccessMock).toHaveBeenCalledWith(res, 'Recent activity fetched', [
      { id: 'r1', amount: 22.5 },
    ]);
    expect(next).not.toHaveBeenCalled();
  });
});
