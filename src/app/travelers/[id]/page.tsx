import { notFound } from 'next/navigation';

import { createPublicRepository } from '@/features/content/public-repository';
import { PublicProfile } from '@/features/travelers/public-profile';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TravelerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const traveler = await createPublicRepository(prisma).getTravelerByPublicId(id);
  if (!traveler) notFound();
  return <PublicProfile traveler={traveler} />;
}
