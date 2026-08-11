import { notFound } from 'next/navigation';

import { createPublicRepository } from '@/features/content/public-repository';
import { WorryDetail } from '@/features/content/worry-detail';
import { prisma } from '@/lib/db';
import { readAppEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function WorryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const worry = await createPublicRepository(prisma).getWorryBySlug(slug);
  if (!worry) notFound();
  return <WorryDetail worry={worry} crisisNotice={readAppEnv().CRISIS_RESOURCE_NOTICE} />;
}
