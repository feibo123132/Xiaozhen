import { revalidatePath } from 'next/cache';
import { authorizeTravelerRequest } from '@/features/auth/guards';
import { parseTravelerProfile } from '@/features/travelers/profile';
import { prisma } from '@/lib/db';
import { isSameOrigin, jsonError } from '@/lib/http';
export async function PATCH(request: Request) { if (!isSameOrigin(request)) return jsonError('请求来源无效', 403); const session = await authorizeTravelerRequest(request); if (!session) return jsonError('请先登录', 401); let profile; try { profile = parseTravelerProfile(await request.json()); } catch { return jsonError('请检查化名、简介和头像', 400); } const traveler = await prisma.traveler.update({ where: { id: session.traveler.id }, data: profile }); revalidatePath(`/travelers/${traveler.publicId}`); revalidatePath('/me'); return Response.json({ publicId: traveler.publicId, pseudonym: traveler.pseudonym, bio: traveler.bio, avatarKey: traveler.avatarKey }); }
