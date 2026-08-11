import { z } from 'zod';

import { verifyPassword } from '@/features/auth/password';
import { clearAuthThrottle, recordAuthFailure, throttleKey, throttleStatus } from '@/features/auth/rate-limit';
import { ADMIN_SESSION_COOKIE, buildSessionCookie, clearSessionCookie, createAdminSession, hashSessionToken, readCookie } from '@/features/auth/session';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

const credentialsSchema = z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(8).max(200) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
  const parsed = credentialsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('请检查账号和密码', 400, { fieldErrors: parsed.error.flatten().fieldErrors });
  const keyHash = throttleKey('admin-login', parsed.data.username);
  const status = await throttleStatus(prisma, keyHash);
  if (!status.allowed) return Response.json({ error: '尝试次数过多，请稍后再试', retryAfterSeconds: status.retryAfterSeconds }, { status: 429, headers: { 'Retry-After': String(status.retryAfterSeconds) } });
  const admin = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
  if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
    await recordAuthFailure(prisma, keyHash);
    return jsonError('账号或密码不正确', 401);
  }
  await clearAuthThrottle(prisma, keyHash);
  const session = await createAdminSession(prisma, admin.id);
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': buildSessionCookie(session.token, session.expiresAt) } });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
  const token = readCookie(request.headers.get('cookie'), ADMIN_SESSION_COOKIE);
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token), actorType: 'admin' } });
  return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
}
