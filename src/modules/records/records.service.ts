import prisma from '@/config/db';
import type { RecordType } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import type {
  CreateRecordInput,
  UpdateRecordInput,
} from './records.schemas';

function serializeRecord(record: Record<string, unknown>) {
  return {
    ...record,
    amount: Number(record.amount),
  };
}

export const recordsService = {
  async create(data: CreateRecordInput, createdBy: string) {
    const record = await prisma.financialRecord.create({
      data: {
        amount: data.amount,
        type: data.type as RecordType,
        category: data.category,
        date: new Date(data.date),
        notes: data.notes,
        createdBy,
      },
    });
    return serializeRecord(record);
  },

  async list(filters: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
  }) {
    const { type, category, dateFrom, dateTo, page, limit } =
      filters;
    const skip = (page - 1) * limit;

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const where = {
      deletedAt: null as Date | null,
      ...(type && { type: type as RecordType }),
      ...(category && { category }),
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    };

    const [records, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return { records: records.map(serializeRecord), page, limit, total };
  },

  async getById(id: string) {
    const record = await prisma.financialRecord.findFirst({
      where: { id, deletedAt: null },
    });
    if (!record) throw ApiError.notFound('Record');
    return serializeRecord(record);
  },

  async update(id: string, data: UpdateRecordInput) {
    await this.getById(id);

    const record = await prisma.financialRecord.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && {
          amount: data.amount,
        }),
        ...(data.type && {
          type: data.type as RecordType,
        }),
        ...(data.category && { category: data.category }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.notes !== undefined && {
          notes: data.notes,
        }),
      },
    });
    return serializeRecord(record);
  },

  async softDelete(id: string) {
    await this.getById(id);
    const record = await prisma.financialRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return serializeRecord(record);
  },
};
