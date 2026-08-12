import type { Texture } from 'pixi.js';

import type { TownAssetManifest } from '../asset-manifest';
import { textureForFrame } from './atlas-texture-cache';

export function TerrainLayer({ manifest, atlasTexture }: {
  manifest: TownAssetManifest;
  atlasTexture: Texture;
}) {
  return (
    <pixiContainer label="terrain-layer">
      <pixiSprite texture={textureForFrame(manifest, atlasTexture, manifest.scene.forestTerrain)} x={64} y={332} />
      <pixiSprite texture={textureForFrame(manifest, atlasTexture, manifest.scene.centralTerrain)} x={598} y={360} />
      <pixiSprite texture={textureForFrame(manifest, atlasTexture, manifest.scene.pastureTerrain)} x={1142} y={370} />
    </pixiContainer>
  );
}
