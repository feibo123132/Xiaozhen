import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { canTransitionEvent, EVENT_STATUSES, type EventStatus } from '@/features/admin/lifecycle';
import { authorizeAdminRequest } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

type Context = { params: Promise<{ id: string }> };
type Dependencies = {
  authorize(request: Request): Promise<boolean>;
  getStatus(id: string): Promise<string | null>;
  canActivate(id: string): Promise<boolean>;
  update(id: string, status: EventStatus): Promise<unknown>;
};

const schema = z.object({ status: z.enum(EVENT_STATUSES) });

export function createEventStatusHandler(dependencies: Dependencies) {
  return async (request: Request, context: Context) => {
    if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
    if (!await dependencies.authorize(request)) return jsonError('请先登录', 401);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('目标状态无效', 400, { fieldErrors: parsed.error.flatten().fieldErrors });
    const { id } = await context.params;
    const current = await dependencies.getStatus(id);
    if (!current) return jsonError('活动不存在', 404);
    if (!canTransitionEvent(current, parsed.data.status)) return jsonError('不允许进行这个状态转换', 409);
    if (parsed.data.status === 'active' && !await dependencies.canActivate(id)) return jsonError('活动至少需要 3 个且至多 5 个已发布精选烦恼', 409);
    await dependencies.update(id, parsed.data.status);
    return Response.json({ ok: true, status: parsed.data.status });
  };
}

export const PATCH = createEventStatusHandler({
  authorize: authorizeAdminRequest,
  getStatus: async (id) => (await prisma.event.findUnique({ where: { id }, select: { status: true } }))?.status ?? null,
  canActivate: async (id) => {
    const features = await prisma.eventFeature.findMany({ where: { eventId: id }, include: { worry: { select: { status: true } } } });
    return features.length >= 3 && features.length <= 5 && features.every(({ worry }) => worry.status === 'published');
  },
  update: async (id, status) => {
    if (status === 'active') {
      await prisma.$transaction([prisma.event.updateMany({ where: { status: 'active', id: { not: id } }, data: { status: 'ended' } }), prisma.event.update({ where: { id }, data: { status } })]);
    } else await prisma.event.update({ where: { id }, data: { status } });
    for (const path of ['/', '/town', '/admin', '/admin/events']) revalidatePath(path);
  },
});
