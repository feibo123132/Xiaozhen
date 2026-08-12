import type { TownAssetManifest } from '../asset-manifest';
import type { TownWorldModel } from '../world-model';

export function AmbientLayer({ manifest, world }: {
  manifest: TownAssetManifest;
  world: TownWorldModel;
}) {
  void manifest;
  void world;
  return <pixiContainer label="ambient-layer" />;
}

