import type { Texture } from 'pixi.js';

import type { TownAssetManifest } from '../asset-manifest';
import { textureForFrame } from './atlas-texture-cache';

export function BackdropLayer({ manifest, atlasTexture }: {
  manifest: TownAssetManifest;
  atlasTexture: Texture;
}) {
  return (
    <pixiContainer label="backdrop-layer">
      <pixiSprite
        texture={textureForFrame(manifest, atlasTexture, manifest.scene.distantMountains)}
        x={582}
        y={64}
      />
    </pixiContainer>
  );
}
