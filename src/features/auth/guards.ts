import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { PrismaClient } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { ADMIN_SESSION_COOKIE, hashSessionToken, readCookie, validateSessionRecord } from './session';
import { hashTravelerSession, TRAVELER_SESSION_COOKIE } from '@/features/travelers/traveler-session';

type SessionDatabase = Pick<PrismaClient, 'session'>;

export async function findAdminSession(database: SessionDatabase, token: string | null, now = new Date()) {
  if (!token) return null;
  const session = await database.session.findUnique({ where: { tokenHash: hashSessionToken(token) }, include: { adminUser: true } });
  if (!validateSessionRecord(session, 'admin', now) || !session?.adminUser) return null;
  return { sessionId: session.id, admin: session.adminUser };
}

export async function authorizeAdminRequest(request: Request, database: SessionDatabase = prisma) {
  const token = readCookie(request.headers.get('cookie'), ADMIN_SESSION_COOKIE);
  return Boolean(await findAdminSession(database, token));
}

export async function requireAdminPage() {
  const cookieStore = await cookies();
  const session = await findAdminSession(prisma, cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null);
  if (!session) redirect('/admin/login');
  return session.admin;
}

export async function findTravelerSession(database: SessionDatabase, token: string | null, now = new Date()) {
  if (!token) return null;
  const session = await database.session.findUnique({ where: { tokenHash: hashTravelerSession(token) }, include: { traveler: true } });
  if (!validateSessionRecord(session, 'traveler', now) || !session?.traveler || session.traveler.status !== 'claimed') return null;
  return { sessionId: session.id, traveler: session.traveler };
}

export async function authorizeTravelerRequest(request: Request, database: SessionDatabase = prisma) { return findTravelerSession(database, readCookie(request.headers.get('cookie'), TRAVELER_SESSION_COOKIE)); }
export async function requireTravelerPage() { const store = await cookies(); const session = await findTravelerSession(prisma, store.get(TRAVELER_SESSION_COOKIE)?.value ?? null); if (!session) redirect('/login'); return session.traveler; }
