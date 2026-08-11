import { createHash, randomBytes } from 'node:crypto';
import type { PrismaClient } from '@/generated/prisma/client';
export const TRAVELER_SESSION_COOKIE = 'relief_town_traveler';
export const hashTravelerSession = (token: string) => createHash('sha256').update(token).digest('hex');
export function travelerCookie(token: string, expiresAt: Date) { return `${TRAVELER_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`; }
export async function createTravelerSession(database: Pick<PrismaClient, 'session'>, travelerId: string, now = new Date()) { const token = randomBytes(32).toString('base64url'); const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60_000); await database.session.create({ data: { tokenHash: hashTravelerSession(token), actorType: 'traveler', travelerId, expiresAt } }); return { token, expiresAt }; }
