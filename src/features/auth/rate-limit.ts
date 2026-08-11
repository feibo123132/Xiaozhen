import { createHash } from 'node:crypto';

import type { PrismaClient } from '@/generated/prisma/client';

const WINDOW_MS = 10 * 60_000;
const BLOCK_MS = 15 * 60_000;
const MAX_FAILURES = 5;

export type ThrottleState = { failureCount: number; windowStartedAt: Date; blockedUntil: Date | null };

export function throttleKey(scope: string, identity: string) {
  return createHash('sha256').update(`${scope}:${identity.trim().toLowerCase()}`).digest('hex');
}

export function applyFailedAttempt(previous: ThrottleState | null, now = new Date()): ThrottleState {
  const insideWindow = previous && now.getTime() - previous.windowStartedAt.getTime() < WINDOW_MS;
  const failureCount = insideWindow ? previous.failureCount + 1 : 1;
  return {
    failureCount,
    windowStartedAt: insideWindow ? previous.windowStartedAt : now,
    blockedUntil: failureCount >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null,
  };
}

type ThrottleDatabase = Pick<PrismaClient, 'authThrottle'>;

export async function throttleStatus(database: ThrottleDatabase, keyHash: string, now = new Date()) {
  const record = await database.authThrottle.findUnique({ where: { keyHash } });
  const retryAfterSeconds = record?.blockedUntil && record.blockedUntil > now ? Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000) : 0;
  return { allowed: retryAfterSeconds === 0, retryAfterSeconds };
}

export async function recordAuthFailure(database: ThrottleDatabase, keyHash: string, now = new Date()) {
  const previous = await database.authThrottle.findUnique({ where: { keyHash } });
  const next = applyFailedAttempt(previous, now);
  await database.authThrottle.upsert({
    where: { keyHash },
    update: next,
    create: { keyHash, ...next },
  });
  return next;
}

export async function clearAuthThrottle(database: ThrottleDatabase, keyHash: string) {
  await database.authThrottle.deleteMany({ where: { keyHash } });
}
