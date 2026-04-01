import prisma from '@/config/db';
import { Prisma } from '@prisma/client';

export const dashboardService = {
  async getSummary() {
    const [income, expense] = await Promise.all([
      prisma.financialRecord.aggregate({
        _sum: { amount: true },
        where: {
          type: 'INCOME',
          deletedAt: null,
        },
      }),
      prisma.financialRecord.aggregate({
        _sum: { amount: true },
        where: {
          type: 'EXPENSE',
          deletedAt: null,
        },
      }),
    ]);

    const totalIncome = Number(income._sum.amount ?? 0);
    const totalExpenses = Number(expense._sum.amount ?? 0);
    const netBalance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netBalance };
  },

  async getTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const records = await prisma.financialRecord.findMany({
      where: {
        date: { gte: sixMonthsAgo },
        deletedAt: null,
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const monthlyData = new Map<
      string,
      { month: string; income: number; expense: number }
    >();

    for (const record of records) {
      const monthKey = record.date.toISOString().slice(0, 7);
      const existing = monthlyData.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        expense: 0,
      };

      if (record.type === 'INCOME') {
        existing.income += Number(record.amount);
      } else {
        existing.expense += Number(record.amount);
      }

      monthlyData.set(monthKey, existing);
    }

    return Array.from(monthlyData.values());
  },

  async getCategoryBreakdown() {
    const result = await prisma.financialRecord.groupBy({
      by: ['category'],
      where: {
        type: 'EXPENSE',
        deletedAt: null,
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: Prisma.SortOrder.desc } },
    });

    const totalExpense = result.reduce(
      (sum, r) => sum + Number(r._sum.amount ?? 0),
      0,
    );

    return result.map((r) => ({
      category: r.category,
      total: Number(r._sum.amount ?? 0),
      percentage:
        totalExpense > 0
          ? Math.round(
              (Number(r._sum.amount ?? 0) / totalExpense) * 100,
            )
          : 0,
    }));
  },

  async getRecent() {
    return prisma.financialRecord.findMany({
      where: { deletedAt: null },
      orderBy: { date: 'desc' },
      take: 10,
    });
  },
};
