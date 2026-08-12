const pixi = vi.hoisted(() => ({
  destroy: vi.fn(),
  textureCreations: 0,
}));

vi.mock('pixi.js', () => ({
  Rectangle: class Rectangle {
    constructor(public x: number, public y: number, public width: number, public height: number) {}
  },
  Texture: class Texture {
    source: object;
    destroy = pixi.destroy;
    constructor(options: { source?: object } = {}) {
      pixi.textureCreations += 1;
      this.source = options.source ?? {};
    }
  },
}));

import { destroyAtlasFrameTextures, textureForFrame } from './atlas-texture-cache';
import type { TownAssetManifest } from '../asset-manifest';

const manifest = {
  atlases: {
    graybox: {
      imagePath: '/atlas.png',
      frames: { tree: { x: 1, y: 2, width: 3, height: 4 } },
    },
  },
} as unknown as TownAssetManifest;

beforeEach(() => {
  pixi.destroy.mockClear();
  pixi.textureCreations = 0;
});

it('returns one stable subtexture for the same source and frame', () => {
  const sourceTexture = { source: {} } as never;

  const first = textureForFrame(manifest, sourceTexture, { atlas: 'graybox', frame: 'tree' });
  const second = textureForFrame(manifest, sourceTexture, { atlas: 'graybox', frame: 'tree' });

  expect(first).toBe(second);
  expect(pixi.textureCreations).toBe(1);
});

it('destroys cached subtextures without destroying their shared source', () => {
  const sourceTexture = { source: {} } as never;
  textureForFrame(manifest, sourceTexture, { atlas: 'graybox', frame: 'tree' });

  destroyAtlasFrameTextures(sourceTexture);

  expect(pixi.destroy).toHaveBeenCalledWith(false);
});
