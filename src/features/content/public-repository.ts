import type { Prisma, PrismaClient } from '@/generated/prisma/client';

import { calculateGrowthStage } from '@/features/growth/calculate-growth-stage';
import { resolveGrowthAsset } from '@/features/town/resolve-growth-asset';

type PublicPrisma = Pick<PrismaClient, 'event' | 'worry' | 'traveler'>;

function numberArray(value: Prisma.JsonValue): number[] {
  if (!Array.isArray(value)) {
    throw new Error('Life asset growth thresholds must be a number array');
  }
  const numbers = value.filter((item): item is number => typeof item === 'number');
  if (numbers.length !== value.length) {
    throw new Error('Life asset growth thresholds must be a number array');
  }
  return numbers;
}

function stagePaths(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    throw new Error('Life asset growth paths must be a string array');
  }
  const paths = value.filter((item): item is string => typeof item === 'string');
  if (paths.length !== value.length) {
    throw new Error('Life asset growth paths must be a string array');
  }
  return paths;
}

function placementView(placement: {
  id: string;
  worryId: string;
  zone: string;
  x: number;
  y: number;
  zIndex: number;
  layoutVersion: number;
} | null) {
  if (!placement) return null;
  return {
    id: placement.id,
    worryId: placement.worryId,
    zone: placement.zone,
    x: placement.x,
    y: placement.y,
    zIndex: placement.zIndex,
    layoutVersion: placement.layoutVersion,
  };
}

function lifeView(lifeAsset: {
  id: string;
  name: string;
  type: string;
  previewPath: string;
  growthStagePaths: Prisma.JsonValue;
  growthThresholds: Prisma.JsonValue;
}, publishedViewpointCount: number) {
  const thresholds = numberArray(lifeAsset.growthThresholds);
  const paths = stagePaths(lifeAsset.growthStagePaths);
  const growthStage = calculateGrowthStage(publishedViewpointCount, thresholds);
  return {
    id: lifeAsset.id,
    name: lifeAsset.name,
    type: lifeAsset.type,
    previewPath: lifeAsset.previewPath,
    growthStage,
    growthPath: resolveGrowthAsset(growthStage, paths, lifeAsset.previewPath),
  };
}

export function createPublicRepository(database: PublicPrisma) {
  return {
    async getTownWorries() {
      const worries = await database.worry.findMany({
        where: { status: 'published' },
        orderBy: [{ placement: { zIndex: 'asc' } }, { createdAt: 'asc' }],
        include: {
          lifeAsset: true,
          placement: true,
          viewpoints: { where: { status: 'published' }, select: { id: true } },
        },
      });
      return worries.map((worry) => ({
        id: worry.id,
        slug: worry.slug,
        title: worry.title,
        publishedViewpointCount: worry.viewpoints.length,
        placement: placementView(worry.placement),
        life: lifeView(worry.lifeAsset, worry.viewpoints.length),
      }));
    },

    async getCurrentEvent() {
      const event = await database.event.findFirst({
        where: { status: 'active' },
        orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          features: {
            where: { worry: { status: 'published' } },
            orderBy: { position: 'asc' },
            include: {
              worry: {
                include: {
                  lifeAsset: true,
                  viewpoints: { where: { status: 'published' }, select: { id: true } },
                },
              },
            },
          },
        },
      });
      if (!event) return null;
      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        intro: event.intro,
        eventDate: event.eventDate,
        featuredWorries: event.features.map(({ worry }) => ({
          id: worry.id,
          slug: worry.slug,
          title: worry.title,
          publishedViewpointCount: worry.viewpoints.length,
          life: lifeView(worry.lifeAsset, worry.viewpoints.length),
        })),
      };
    },

    async getWorryBySlug(slug: string) {
      const worry = await database.worry.findFirst({
        where: { slug, status: 'published' },
        include: {
          lifeAsset: true,
          placement: true,
          viewpoints: {
            where: { status: 'published' },
            orderBy: { publishedAt: 'asc' },
            include: { traveler: true },
          },
        },
      });
      if (!worry) return null;
      const publishedViewpointCount = worry.viewpoints.length;
      return {
        id: worry.id,
        slug: worry.slug,
        title: worry.title,
        body: worry.body,
        background: worry.background,
        sensitive: worry.sensitive,
        placement: placementView(worry.placement),
        publishedViewpointCount,
        growthStage: lifeView(worry.lifeAsset, publishedViewpointCount).growthStage,
        life: lifeView(worry.lifeAsset, publishedViewpointCount),
        viewpoints: worry.viewpoints.map((viewpoint) => ({
          id: viewpoint.id,
          body: viewpoint.body,
          publishedAt: viewpoint.publishedAt,
          traveler: {
            publicId: viewpoint.traveler.publicId,
            pseudonym: viewpoint.traveler.pseudonym,
            avatarKey: viewpoint.traveler.avatarKey,
          },
        })),
      };
    },

    async getTravelerByPublicId(publicId: string) {
      const traveler = await database.traveler.findFirst({
        where: { publicId, status: { not: 'archived' } },
        include: {
          viewpoints: {
            where: { status: 'published', worry: { status: 'published' } },
            orderBy: { publishedAt: 'desc' },
            include: { worry: true },
          },
        },
      });
      if (!traveler) return null;
      return {
        publicId: traveler.publicId,
        pseudonym: traveler.pseudonym,
        avatarKey: traveler.avatarKey,
        bio: traveler.bio,
        viewpoints: traveler.viewpoints.map((viewpoint) => ({
          id: viewpoint.id,
          body: viewpoint.body,
          publishedAt: viewpoint.publishedAt,
          worry: { slug: viewpoint.worry.slug, title: viewpoint.worry.title },
        })),
      };
    },
  };
}
