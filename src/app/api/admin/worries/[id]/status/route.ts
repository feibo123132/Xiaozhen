import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { canTransitionWorry, type WorryStatus, WORRY_STATUSES } from '@/features/admin/lifecycle';
import { authorizeAdminRequest } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

type Context = { params: Promise<{ id: string }> };
type Dependencies = { authorize(request: Request): Promise<boolean>; getStatus(id: string): Promise<string | null>; update(id: string, status: WorryStatus): Promise<unknown> };
const schema = z.object({ status: z.enum(WORRY_STATUSES) });

export function createWorryStatusHandler(dependencies: Dependencies) {
  return async (request: Request, context: Context) => {
    if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
    if (!await dependencies.authorize(request)) return jsonError('请先登录', 401);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('目标状态无效', 400);
    const { id } = await context.params;
    const current = await dependencies.getStatus(id);
    if (!current) return jsonError('烦恼不存在', 404);
    if (!canTransitionWorry(current, parsed.data.status)) return jsonError('不允许进行这个状态转换', 409);
    await dependencies.update(id, parsed.data.status);
    return Response.json({ ok: true, status: parsed.data.status });
  };
}

export const PATCH = createWorryStatusHandler({
  authorize: authorizeAdminRequest,
  getStatus: async (id) => (await prisma.worry.findUnique({ where: { id }, select: { status: true } }))?.status ?? null,
  update: async (id, status) => {
    const worry = await prisma.worry.update({ where: { id }, data: { status }, select: { slug: true } });
    for (const path of ['/', '/town', `/worries/${worry.slug}`, '/admin/worries']) revalidatePath(path);
  },
});
