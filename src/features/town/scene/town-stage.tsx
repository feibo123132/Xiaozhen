import type { Texture } from 'pixi.js';

import type { TownAssetManifest } from '../asset-manifest';
import type { TownCameraView, TownWorldModel } from '../world-model';
import { AmbientLayer } from './ambient-layer';
import { BackdropLayer } from './backdrop-layer';
import { LifeLayer } from './life-layer';
import { StructureLayer } from './structure-layer';
import { TerrainLayer } from './terrain-layer';

export type TownRenderMode = 'public' | 'edit';

export type TownStageProps = {
  world: TownWorldModel;
  camera: TownCameraView;
  manifest: TownAssetManifest;
  atlasTexture: Texture;
  mode: TownRenderMode;
};

export function TownStage({ world, camera, manifest, atlasTexture, mode }: TownStageProps) {
  return (
    <pixiContainer
      label={`town-camera-${mode}`}
      x={camera.x}
      y={camera.y}
      scale={camera.scale}
    >
      <BackdropLayer atlasTexture={atlasTexture} manifest={manifest} />
      <TerrainLayer atlasTexture={atlasTexture} manifest={manifest} />
      <StructureLayer atlasTexture={atlasTexture} manifest={manifest} />
      <LifeLayer atlasTexture={atlasTexture} manifest={manifest} world={world} />
      <AmbientLayer manifest={manifest} world={world} />
    </pixiContainer>
  );
}

