import { recordsService } from './records.service';
import prisma from '../../config/db';

jest.mock('../../config/db', () => ({
  __esModule: true,
  default: {
    financialRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  financialRecord: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
};

describe('recordsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates record and serializes amount to number', async () => {
    prismaMock.financialRecord.create.mockResolvedValue({
      id: 'r1',
      amount: '100.25',
      type: 'INCOME',
      category: 'Salary',
      date: new Date('2026-01-10T00:00:00.000Z'),
      notes: 'Monthly salary',
      createdBy: 'u1',
    });

    const result = await recordsService.create(
      {
        amount: 100.25,
        type: 'INCOME',
        category: 'Salary',
        date: '2026-01-10T00:00:00.000Z',
        notes: 'Monthly salary',
      },
      'u1',
    );

    expect(prismaMock.financialRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 100.25,
          type: 'INCOME',
          category: 'Salary',
          createdBy: 'u1',
        }),
      }),
    );
    expect(result.amount).toBe(100.25);
  });

  it('lists records with filters and pagination', async () => {
    prismaMock.financialRecord.findMany.mockResolvedValue([
      {
        id: 'r1',
        amount: '20.5',
        type: 'EXPENSE',
        category: 'Food',
        date: new Date('2026-02-01T00:00:00.000Z'),
      },
    ]);
    prismaMock.financialRecord.count.mockResolvedValue(1);

    const result = await recordsService.list({
      type: 'EXPENSE',
      category: 'Food',
      dateFrom: '2026-02-01T00:00:00.000Z',
      dateTo: '2026-02-28T23:59:59.999Z',
      page: 1,
      limit: 10,
    });

    expect(prismaMock.financialRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        where: expect.objectContaining({
          deletedAt: null,
          type: 'EXPENSE',
          category: 'Food',
          date: expect.objectContaining({
            gte: new Date('2026-02-01T00:00:00.000Z'),
            lte: new Date('2026-02-28T23:59:59.999Z'),
          }),
        }),
      }),
    );
    expect(result).toEqual({
      records: [
        {
          id: 'r1',
          amount: 20.5,
          type: 'EXPENSE',
          category: 'Food',
          date: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it('gets record by id when not deleted', async () => {
    prismaMock.financialRecord.findFirst.mockResolvedValue({
      id: 'r1',
      amount: '10.0',
      type: 'EXPENSE',
      category: 'Food',
      date: new Date('2026-02-01T00:00:00.000Z'),
    });

    const result = await recordsService.getById('r1');

    expect(prismaMock.financialRecord.findFirst).toHaveBeenCalledWith({
      where: { id: 'r1', deletedAt: null },
    });
    expect(result.amount).toBe(10);
  });

  it('throws not found when getById misses record', async () => {
    prismaMock.financialRecord.findFirst.mockResolvedValue(null);

    await expect(recordsService.getById('missing')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'Record not found',
    });
  });

  it('updates record fields and serializes amount', async () => {
    prismaMock.financialRecord.findFirst.mockResolvedValue({
      id: 'r1',
      amount: '10.0',
      type: 'EXPENSE',
      category: 'Food',
      date: new Date('2026-02-01T00:00:00.000Z'),
      deletedAt: null,
    });
    prismaMock.financialRecord.update.mockResolvedValue({
      id: 'r1',
      amount: '15.5',
      type: 'EXPENSE',
      category: 'Food',
      date: new Date('2026-02-02T00:00:00.000Z'),
      notes: 'updated',
    });

    const result = await recordsService.update('r1', {
      amount: 15.5,
      date: '2026-02-02T00:00:00.000Z',
      notes: 'updated',
    });

    expect(prismaMock.financialRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'r1' },
        data: expect.objectContaining({
          amount: 15.5,
          date: new Date('2026-02-02T00:00:00.000Z'),
          notes: 'updated',
        }),
      }),
    );
    expect(result.amount).toBe(15.5);
  });

  it('soft deletes record by setting deletedAt', async () => {
    prismaMock.financialRecord.findFirst.mockResolvedValue({
      id: 'r1',
      deletedAt: null,
    });
    prismaMock.financialRecord.update.mockResolvedValue({
      id: 'r1',
      amount: '10',
      type: 'EXPENSE',
      category: 'Food',
      date: new Date('2026-02-01T00:00:00.000Z'),
      deletedAt: new Date('2026-03-01T00:00:00.000Z'),
    });

    const result = await recordsService.softDelete('r1');

    expect(prismaMock.financialRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'r1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
    expect(result.amount).toBe(10);
    expect((result as unknown as { deletedAt: Date }).deletedAt).toEqual(
      new Date('2026-03-01T00:00:00.000Z'),
    );
  });
});
