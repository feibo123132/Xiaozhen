import { Rectangle, Texture } from 'pixi.js';

import type { TownAssetManifest } from '../asset-manifest';

export type AtlasFrameReference = { atlas: string; frame: string };

const frameTextures = new WeakMap<Texture, Map<string, Texture>>();

export function textureForFrame(
  manifest: TownAssetManifest,
  atlasTexture: Texture,
  reference: AtlasFrameReference,
): Texture {
  const atlas = manifest.atlases[reference.atlas];
  const frame = atlas?.frames[reference.frame];
  if (!atlas || !frame) throw new Error(`Missing atlas frame: ${reference.atlas}.${reference.frame}`);

  let textures = frameTextures.get(atlasTexture);
  if (!textures) {
    textures = new Map();
    frameTextures.set(atlasTexture, textures);
  }

  const key = `${reference.atlas}:${reference.frame}`;
  const cached = textures.get(key);
  if (cached) return cached;

  const texture = new Texture({
    source: atlasTexture.source,
    frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
    label: key,
  });
  textures.set(key, texture);
  return texture;
}

export function destroyAtlasFrameTextures(atlasTexture: Texture): void {
  const textures = frameTextures.get(atlasTexture);
  if (!textures) return;
  for (const texture of textures.values()) texture.destroy(false);
  textures.clear();
  frameTextures.delete(atlasTexture);
}

