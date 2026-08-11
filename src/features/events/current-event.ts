import { createPublicRepository } from '@/features/content/public-repository';
import { prisma } from '@/lib/db';

export async function getCurrentEvent() {
  return createPublicRepository(prisma).getCurrentEvent();
}
