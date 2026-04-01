import type { Role } from '@prisma/client';

export const Permission = {
  RECORDS_READ: 'records:read',
  RECORDS_WRITE: 'records:write',
  RECORDS_DELETE: 'records:delete',
  DASHBOARD_SUMMARY: 'dashboard:summary',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  USERS_MANAGE: 'users:manage',
} as const;

export type Permission =
  (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER: [
    Permission.RECORDS_READ,
    Permission.DASHBOARD_SUMMARY,
  ],
  ANALYST: [
    Permission.RECORDS_READ,
    Permission.DASHBOARD_SUMMARY,
    Permission.DASHBOARD_ANALYTICS,
  ],
  ADMIN: [
    Permission.RECORDS_READ,
    Permission.RECORDS_WRITE,
    Permission.RECORDS_DELETE,
    Permission.DASHBOARD_SUMMARY,
    Permission.DASHBOARD_ANALYTICS,
    Permission.USERS_MANAGE,
  ],
};
