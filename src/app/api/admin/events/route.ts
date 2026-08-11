import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { authorizeAdminRequest } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';

const eventSchema = z.object({ slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().trim().min(2).max(100), intro: z.string().trim().min(2).max(600), eventDate: z.string().datetime().optional().or(z.literal('')) });

export async function GET(request: Request) {
  if (!await authorizeAdminRequest(request)) return jsonError('请先登录', 401);
  return Response.json(await prisma.event.findMany({ orderBy: { createdAt: 'desc' } }));
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError('请求来源无效', 403);
  if (!await authorizeAdminRequest(request)) return jsonError('请先登录', 401);
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('请检查表单', 400, { fieldErrors: parsed.error.flatten().fieldErrors });
  const event = await prisma.event.create({ data: { ...parsed.data, eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null, status: 'draft' } });
  revalidatePath('/admin/events');
  return Response.json(event, { status: 201 });
}
