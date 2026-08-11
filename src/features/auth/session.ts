import { createHash, randomBytes } from 'node:crypto';

import type { PrismaClient } from '@/generated/prisma/client';

export const ADMIN_SESSION_COOKIE = 'relief_town_admin';
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60_000;

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function buildSessionCookie(token: string, expiresAt: Date, secure = process.env.NODE_ENV === 'production') {
  const parts = [`${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Expires=${expiresAt.toUTCString()}`];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(header: string | null, name: string) {
  const match = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function validateSessionRecord(record: { actorType: string; expiresAt: Date; revokedAt?: Date | null } | null, role: 'admin' | 'traveler', now = new Date()) {
  return Boolean(record && record.actorType === role && !record.revokedAt && record.expiresAt.getTime() > now.getTime());
}

export async function createAdminSession(database: Pick<PrismaClient, 'session'>, adminUserId: string, now = new Date()) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
  await database.session.create({ data: { tokenHash: hashSessionToken(token), actorType: 'admin', adminUserId, expiresAt } });
  return { token, expiresAt };
}
