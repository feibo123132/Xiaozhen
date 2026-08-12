import type { Texture } from 'pixi.js';

import { resolveLifeStage, type TownAssetManifest } from '../asset-manifest';
import { depthForLife } from '../town-layout';
import type { TownWorldModel } from '../world-model';
import { textureForFrame } from './atlas-texture-cache';

export function LifeLayer({ manifest, atlasTexture, world }: {
  manifest: TownAssetManifest;
  atlasTexture: Texture;
  world: TownWorldModel;
}) {
  return (
    <pixiContainer label="life-layer" sortableChildren>
      {world.lives.map((life) => {
        const resolved = resolveLifeStage(manifest, {
          lifeId: life.assetId,
          requestedStage: life.growthStage,
          previewPath: '/town/pixel/v2/poster.png',
        });
        if (resolved.source !== 'manifest') return null;

        return (
          <pixiSprite
            key={life.worryId}
            label={`life-${life.worryId}`}
            texture={textureForFrame(manifest, atlasTexture, {
              atlas: resolved.stage.atlas,
              frame: resolved.stage.frame,
            })}
            x={life.x - resolved.stage.anchor.x}
            y={life.y - resolved.stage.anchor.y}
            zIndex={depthForLife(life.y, life.depthOffset)}
          />
        );
      })}
    </pixiContainer>
  );
}
