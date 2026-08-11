import { z } from 'zod';

import { canConsumeAccountToken, hashAccountToken, type TokenPurpose } from '@/features/auth/account-token';
import { hashPassword } from '@/features/auth/password';
import { clearAuthThrottle, recordAuthFailure, throttleKey, throttleStatus } from '@/features/auth/rate-limit';
import { createTravelerSession, travelerCookie } from '@/features/travelers/traveler-session';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

const schema = z.object({ password: z.string().min(10).max(200) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
  const { token } = await params;
  const keyHash = throttleKey('account-claim', token);
  const throttle = await throttleStatus(prisma, keyHash);
  if (!throttle.allowed) return Response.json({ error: '尝试次数过多', retryAfterSeconds: throttle.retryAfterSeconds }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) { await recordAuthFailure(prisma, keyHash); return jsonError('密码至少 10 位', 400); }
  const record = await prisma.accountToken.findUnique({ where: { tokenHash: hashAccountToken(token) }, include: { traveler: true } });
  if (!record) { await recordAuthFailure(prisma, keyHash); return jsonError('链接无效、已使用或已过期', 410); }
  const purpose = record.purpose as TokenPurpose;
  if (!canConsumeAccountToken(record, purpose, record.traveler.status)) { await recordAuthFailure(prisma, keyHash); return jsonError('链接无效、已使用或已过期', 410); }
  await prisma.$transaction(async (tx) => {
    if (purpose === 'credential_recovery') await tx.session.deleteMany({ where: { travelerId: record.travelerId } });
    await tx.traveler.update({ where: { id: record.travelerId }, data: { credentialHash: hashPassword(parsed.data.password), status: 'claimed' } });
    await tx.accountToken.update({ where: { id: record.id }, data: { status: 'consumed', consumedAt: new Date() } });
  });
  await clearAuthThrottle(prisma, keyHash);
  const session = await createTravelerSession(prisma, record.travelerId);
  return Response.json({ ok: true, publicId: record.traveler.publicId }, { headers: { 'Set-Cookie': travelerCookie(session.token, session.expiresAt) } });
}
