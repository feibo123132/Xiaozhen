import type { TownAssetManifest } from './asset-manifest';
import { deriveZoneForLifeType, normalizedToWorld, pointInPolygon, projectIntoZone, TOWN_LAYOUTS, WORLD_SIZE, type TownZone } from './town-layout';
import type { TownWorldModel } from './world-model';

export type TownWorryDto = {
  id: string;
  slug: string;
  title: string;
  publishedViewpointCount: number;
  placement: { zone: string; x: number; y: number; zIndex: number; layoutVersion?: number } | null;
  life: { id: string; type: string; previewPath: string; growthStage: number; growthPath: string };
};

export function adaptTownWorries<T extends TownWorryDto>(worries: readonly T[], manifest: TownAssetManifest): {
  world: TownWorldModel;
  worries: readonly T[];
  legacyPreviewByWorryId: Readonly<Record<string, string>>;
  issues: readonly { worryId: string; code: 'invalid-v2-placement' }[];
} {
  const lifeIds = new Set(manifest.lives.map(({ id }) => id));
  const legacyPreviewByWorryId: Record<string, string> = {};
  const issues: { worryId: string; code: 'invalid-v2-placement' }[] = [];

  const lives = worries.flatMap((worry) => {
    const placement = worry.placement;
    if (!placement) return [];
    const zone = placement.zone as TownZone;
    if (zone !== 'forest' && zone !== 'pasture') return [];
    if (placement.layoutVersion === 2) {
      const finite = Number.isFinite(placement.x) && Number.isFinite(placement.y) && Number.isFinite(placement.zIndex);
      const normalized = placement.x >= 0 && placement.x <= 100 && placement.y >= 0 && placement.y <= 100;
      const derivedZone = worry.life.type === 'tree' || worry.life.type === 'animal' ? deriveZoneForLifeType(worry.life.type) : null;
      const inside = finite && normalized && pointInPolygon({ x: placement.x, y: placement.y }, TOWN_LAYOUTS[2].zones[zone].polygon);
      if (!finite || !normalized || derivedZone !== zone || !inside) {
        issues.push({ worryId: worry.id, code: 'invalid-v2-placement' });
        return [];
      }
    }
    const normalized = placement.layoutVersion === 2
      ? { x: placement.x, y: placement.y }
      : projectIntoZone(zone, { x: placement.x, y: placement.y });
    const point = normalizedToWorld(normalized);
    if (!lifeIds.has(worry.life.id as never)) {
      legacyPreviewByWorryId[worry.id] = worry.life.growthPath || worry.life.previewPath;
    }
    return [{
      worryId: worry.id,
      slug: worry.slug,
      title: worry.title,
      responseCount: worry.publishedViewpointCount,
      zone,
      x: point.x,
      y: point.y,
      depthOffset: placement.zIndex,
      assetId: worry.life.id,
      growthStage: worry.life.growthStage,
    }];
  });

  return {
    world: { layoutVersion: 2, width: WORLD_SIZE.width, height: WORLD_SIZE.height, lives },
    worries,
    legacyPreviewByWorryId,
    issues,
  };
}
