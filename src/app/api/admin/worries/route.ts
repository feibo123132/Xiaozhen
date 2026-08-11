import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authorizeAdminRequest } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

const worrySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '只使用小写字母、数字和连字符'),
  title: z.string().trim().min(2, '至少输入 2 个字').max(120),
  body: z.string().trim().min(4, '请补充问题正文').max(4000),
  background: z.string().trim().max(4000).optional(),
  lifeAssetId: z.string().trim().min(1, '请选择生命素材'),
  sensitive: z.boolean().optional(),
});
type WorryDraft = z.infer<typeof worrySchema> & { status: 'draft' };
type Dependencies = { authorize(request: Request): Promise<boolean>; lifeAssetExists(id: string): Promise<boolean>; createDraft(data: WorryDraft): Promise<unknown> };

export function createWorryHandler(dependencies: Dependencies) {
  return async (request: Request) => {
    if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
    if (!await dependencies.authorize(request)) return jsonError('请先登录', 401);
    const parsed = worrySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError('请检查表单', 400, { fieldErrors: parsed.error.flatten().fieldErrors });
    if (!await dependencies.lifeAssetExists(parsed.data.lifeAssetId)) return jsonError('生命素材不存在', 400, { fieldErrors: { lifeAssetId: ['请选择有效素材'] } });
    const worry = await dependencies.createDraft({ ...parsed.data, status: 'draft' });
    return Response.json(worry, { status: 201 });
  };
}

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return jsonError('请先登录', 401);
  return Response.json(await prisma.worry.findMany({ include: { lifeAsset: true, placement: true }, orderBy: { createdAt: 'desc' } }));
}

export const POST = createWorryHandler({
  authorize: authorizeAdminRequest,
  lifeAssetExists: async (id) => Boolean(await prisma.lifeAsset.findUnique({ where: { id }, select: { id: true } })),
  createDraft: async (data) => {
    const worry = await prisma.worry.create({ data });
    revalidatePath('/admin/worries');
    return worry;
  },
});
