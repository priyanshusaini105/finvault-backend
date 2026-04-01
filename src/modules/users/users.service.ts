import prisma from '@/config/db';
import type { Role } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';

export const usersService = {
  async list(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { users, page, limit, total };
  },

  async updateRole(userId: string, role: Role) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw ApiError.notFound('User');

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  },

  async toggleStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw ApiError.notFound('User');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  },

  async softDelete(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw ApiError.notFound('User');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: { id: true, name: true, email: true },
    });
  },
};
