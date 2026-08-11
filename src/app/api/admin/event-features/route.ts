import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authorizeAdminRequest } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';
const schema = z.object({ eventId: z.string().min(1), worryIds: z.array(z.string().min(1)).min(3).max(5).refine((ids) => new Set(ids).size === ids.length, '精选不能重复') });
export async function POST(request: Request) { if (!isSameOrigin(request)) return jsonError('请求来源无效', 403); if (!await authorizeAdminRequest(request)) return jsonError('请先登录', 401); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError('请选择 3～5 个不重复的烦恼', 400, { fieldErrors: parsed.error.flatten().fieldErrors }); const count = await prisma.worry.count({ where: { id: { in: parsed.data.worryIds }, status: 'published' } }); if (count !== parsed.data.worryIds.length) return jsonError('精选只能包含已发布烦恼', 400); await prisma.$transaction([prisma.eventFeature.deleteMany({ where: { eventId: parsed.data.eventId } }), ...parsed.data.worryIds.map((worryId, position) => prisma.eventFeature.create({ data: { eventId: parsed.data.eventId, worryId, position } }))]); revalidatePath('/'); revalidatePath('/admin/map'); return Response.json({ ok: true }); }
