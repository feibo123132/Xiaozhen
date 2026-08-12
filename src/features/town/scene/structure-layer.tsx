import type { Texture } from 'pixi.js';

import type { TownAssetManifest } from '../asset-manifest';
import { textureForFrame } from './atlas-texture-cache';

export function StructureLayer({ manifest, atlasTexture }: {
  manifest: TownAssetManifest;
  atlasTexture: Texture;
}) {
  return (
    <pixiContainer label="structure-layer">
      <pixiSprite texture={textureForFrame(manifest, atlasTexture, manifest.scene.waystation)} x={574} y={320} />
      <pixiSprite texture={textureForFrame(manifest, atlasTexture, manifest.scene.bridge)} x={602} y={626} />
      <pixiSprite texture={textureForFrame(manifest, atlasTexture, manifest.scene.noticeBoard)} x={1034} y={502} />
    </pixiContainer>
  );
}
