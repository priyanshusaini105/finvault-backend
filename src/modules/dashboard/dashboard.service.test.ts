import { dashboardService } from './dashboard.service';
import prisma from '../../config/db';

jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    financialRecord: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  financialRecord: {
    aggregate: jest.Mock;
    findMany: jest.Mock;
    groupBy: jest.Mock;
  };
};

describe('dashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns summary totals and net balance', async () => {
    prismaMock.financialRecord.aggregate
      .mockResolvedValueOnce({ _sum: { amount: '1000.5' } })
      .mockResolvedValueOnce({ _sum: { amount: '250.25' } });

    const result = await dashboardService.getSummary();

    expect(prismaMock.financialRecord.aggregate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { type: 'INCOME', deletedAt: null },
      }),
    );
    expect(prismaMock.financialRecord.aggregate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { type: 'EXPENSE', deletedAt: null },
      }),
    );
    expect(result).toEqual({
      totalIncome: 1000.5,
      totalExpenses: 250.25,
      netBalance: 750.25,
    });
  });

  it('returns grouped monthly trends for income and expenses', async () => {
    prismaMock.financialRecord.findMany.mockResolvedValue([
      {
        type: 'INCOME',
        amount: '100',
        date: new Date('2026-01-15T00:00:00.000Z'),
      },
      {
        type: 'EXPENSE',
        amount: '25',
        date: new Date('2026-01-20T00:00:00.000Z'),
      },
      {
        type: 'INCOME',
        amount: '75',
        date: new Date('2026-02-02T00:00:00.000Z'),
      },
    ]);

    const result = await dashboardService.getTrends();

    expect(prismaMock.financialRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
        orderBy: { date: 'asc' },
      }),
    );
    expect(result).toEqual([
      { month: '2026-01', income: 100, expense: 25 },
      { month: '2026-02', income: 75, expense: 0 },
    ]);
  });

  it('returns expense category breakdown with percentages', async () => {
    prismaMock.financialRecord.groupBy.mockResolvedValue([
      { category: 'Food', _sum: { amount: '75' } },
      { category: 'Travel', _sum: { amount: '25' } },
    ]);

    const result = await dashboardService.getCategoryBreakdown();

    expect(prismaMock.financialRecord.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['category'],
        where: { type: 'EXPENSE', deletedAt: null },
      }),
    );
    expect(result).toEqual([
      { category: 'Food', total: 75, percentage: 75 },
      { category: 'Travel', total: 25, percentage: 25 },
    ]);
  });

  it('returns recent records with numeric amount', async () => {
    prismaMock.financialRecord.findMany.mockResolvedValue([
      {
        id: 'r1',
        amount: '12.5',
        type: 'EXPENSE',
        category: 'Food',
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    ]);

    const result = await dashboardService.getRecent();

    expect(prismaMock.financialRecord.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      orderBy: { date: 'desc' },
      take: 10,
    });
    expect(result).toEqual([
      {
        id: 'r1',
        amount: 12.5,
        type: 'EXPENSE',
        category: 'Food',
        date: new Date('2026-03-01T00:00:00.000Z'),
      },
    ]);
  });
});
