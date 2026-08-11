import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authorizeTravelerRequest } from '@/features/auth/guards';
import { nextOwnedViewpointStatus } from '@/features/travelers/viewpoint-control';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isSameOrigin(request)) return jsonError('请求来源无效', 403); const session = await authorizeTravelerRequest(request); if (!session) return jsonError('请先登录', 401); const parsed = z.object({ action: z.enum(['hide', 'restore']) }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError('操作无效', 400); const { id } = await params; const viewpoint = await prisma.viewpoint.findFirst({ where: { id, travelerId: session.traveler.id }, include: { worry: true } }); if (!viewpoint) return jsonError('观点不存在或不属于你', 404); let status; try { status = nextOwnedViewpointStatus(viewpoint.status, parsed.data.action); } catch { return jsonError('当前状态不能进行这个操作', 409); } await prisma.viewpoint.update({ where: { id }, data: { status } }); revalidatePath(`/worries/${viewpoint.worry.slug}`); revalidatePath(`/travelers/${session.traveler.publicId}`); revalidatePath('/town'); revalidatePath('/me'); return Response.json({ ok: true, status }); }
