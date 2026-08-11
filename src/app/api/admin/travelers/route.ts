import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authorizeAdminRequest } from '@/features/auth/guards';
import { isBundledAvatar } from '@/features/travelers/avatar-catalog';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';
const schema = z.object({ pseudonym: z.string().trim().min(2).max(40), bio: z.string().trim().max(240).optional(), avatarKey: z.string().refine(isBundledAvatar, '请选择预置头像') });
export async function POST(request: Request) { if (!isSameOrigin(request)) return jsonError('请求来源无效', 403); if (!await authorizeAdminRequest(request)) return jsonError('请先登录', 401); const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError('请检查旅人资料', 400, { fieldErrors: parsed.error.flatten().fieldErrors }); const traveler = await prisma.traveler.create({ data: { ...parsed.data, publicId: `traveler-${randomBytes(5).toString('hex')}`, status: 'unclaimed' } }); revalidatePath('/admin/travelers'); return Response.json(traveler, { status: 201 }); }
