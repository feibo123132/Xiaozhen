import { Assets, type Texture } from 'pixi.js';

import { destroyAtlasFrameTextures } from './atlas-texture-cache';

type AtlasResource = {
  consumers: number;
  promise: Promise<Texture>;
  texture: Texture | null;
};

const resources = new Map<string, AtlasResource>();

/** @internal Test isolation for the module-level ownership registry. */
export function resetAtlasResourcesForTests(): void {
  if (process.env.NODE_ENV !== 'test') return;
  resources.clear();
}

export function acquireAtlasTexture(imagePath: string): {
  promise: Promise<Texture>;
  release: () => void;
} {
  let resource = resources.get(imagePath);
  if (!resource) {
    resource = {
      consumers: 0,
      promise: Promise.resolve(null as unknown as Texture),
      texture: null,
    };
    const ownedResource = resource;
    ownedResource.promise = Assets.load<Texture>(imagePath).then(
      (texture) => {
        ownedResource.texture = texture;
        return texture;
      },
      (error) => {
        if (resources.get(imagePath) === ownedResource && ownedResource.consumers === 0) {
          resources.delete(imagePath);
        }
        throw error;
      },
    );
    resources.set(imagePath, ownedResource);
  }

  resource.consumers += 1;
  let released = false;

  return {
    promise: resource.promise,
    release: () => {
      if (released) return;
      released = true;
      resource.consumers -= 1;
      if (resource.consumers !== 0) return;

      const releasedResource = resource;
      queueMicrotask(() => {
        if (resources.get(imagePath) !== releasedResource || releasedResource.consumers !== 0) return;

        void releasedResource.promise.then(
          async (texture) => {
            if (resources.get(imagePath) !== releasedResource || releasedResource.consumers !== 0) return;
            resources.delete(imagePath);
            destroyAtlasFrameTextures(texture);
            await Assets.unload(imagePath);
          },
          () => {
            if (resources.get(imagePath) === releasedResource && releasedResource.consumers === 0) {
              resources.delete(imagePath);
            }
          },
        );
      });
    },
  };
}
