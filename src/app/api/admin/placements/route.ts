import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { clampPlacement } from '@/features/admin/placement';
import { authorizeAdminRequest } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

const schema = z.object({ worryId: z.string().min(1), lifeAssetId: z.string().min(1), zone: z.enum(['forest', 'pasture']), x: z.number().finite(), y: z.number().finite() });
type Input = z.infer<typeof schema>;
type Deps = { authorize(request: Request): Promise<boolean>; assetMatchesWorry(worryId: string, assetId: string): Promise<boolean>; save(data: Input): Promise<unknown> };
export function createPlacementHandler(deps: Deps) { return async (request: Request) => { if (!isSameOrigin(request)) return jsonError('请求来源无效', 403); if (!await deps.authorize(request)) return jsonError('请先登录', 401); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError('位置数据无效', 400); if (!await deps.assetMatchesWorry(parsed.data.worryId, parsed.data.lifeAssetId)) return jsonError('只能使用烦恼已选择的预置生命素材', 400); return Response.json(await deps.save({ ...parsed.data, ...clampPlacement(parsed.data) })); }; }
export const POST = createPlacementHandler({ authorize: authorizeAdminRequest, assetMatchesWorry: async (worryId, assetId) => Boolean(await prisma.worry.findFirst({ where: { id: worryId, lifeAssetId: assetId } })), save: async ({ worryId, zone, x, y }) => { const placement = await prisma.mapPlacement.upsert({ where: { worryId }, update: { zone, x, y }, create: { worryId, zone, x, y } }); revalidatePath('/town'); revalidatePath('/admin/map'); return placement; } });
