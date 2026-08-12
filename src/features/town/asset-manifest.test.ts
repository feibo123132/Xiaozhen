import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import manifestJson from '../../../public/town/pixel/v2/manifest.json';
import grayboxJson from '../../../public/town/pixel/v2/atlases/graybox.json';
import {
  parseTownAssetManifest,
  resolveLifeStage,
} from './asset-manifest';

function cloneManifest(): unknown {
  return structuredClone(manifestJson);
}

function firstStage(manifest: unknown) {
  return (manifest as typeof manifestJson).lives[0].stages[0];
}

describe('parseTownAssetManifest', () => {
  it('parses the delivered schema-version 2 graybox manifest', () => {
    const manifest = parseTownAssetManifest(manifestJson);

    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.lives).toHaveLength(6);
    expect(manifest.lives.map(({ id }) => id)).toContain('mist-pine');
    expect(manifest.lives.every(({ stages }) => stages.length === 4)).toBe(true);
  });

  it('rejects a stage without a foot anchor', () => {
    const invalid = cloneManifest();
    delete (firstStage(invalid) as { anchor?: unknown }).anchor;

    expect(() => parseTownAssetManifest(invalid)).toThrow();
  });

  it('rejects a stage without a reduced-motion frame', () => {
    const invalid = cloneManifest();
    delete (firstStage(invalid) as { reducedMotionFrame?: unknown })
      .reducedMotionFrame;

    expect(() => parseTownAssetManifest(invalid)).toThrow();
  });

  it.each([
    ['a rectangle outside its atlas', (value: typeof manifestJson) => {
      value.atlases.graybox.frames['test-pine'].x = 1536;
    }],
    ['a zero-width rectangle', (value: typeof manifestJson) => {
      value.atlases.graybox.frames['test-pine'].width = 0;
    }],
    ['a zero idle frame duration', (value: typeof manifestJson) => {
      value.lives[0].stages[0].idle.frameMs = 0;
    }],
    ['a negative idle pause', (value: typeof manifestJson) => {
      value.lives[0].stages[0].idle.pauseMs = -1;
    }],
  ])('rejects %s', (_label, mutate) => {
    const invalid = cloneManifest() as typeof manifestJson;
    mutate(invalid);

    expect(() => parseTownAssetManifest(invalid)).toThrow();
  });

  it('rejects a missing species', () => {
    const invalid = cloneManifest() as typeof manifestJson;
    invalid.lives.pop();

    expect(() => parseTownAssetManifest(invalid)).toThrow();
  });

  it('rejects a missing life stage', () => {
    const invalid = cloneManifest() as typeof manifestJson;
    invalid.lives[0].stages.pop();

    expect(() => parseTownAssetManifest(invalid)).toThrow();
  });

  it('rejects frame references that do not exist in the declared atlas', () => {
    const invalid = cloneManifest() as typeof manifestJson;
    invalid.lives[0].stages[0].reducedMotionFrame = 'missing-frame';

    expect(() => parseTownAssetManifest(invalid)).toThrow(/missing-frame/);
  });

  it('rejects unknown manifest and nested fields', () => {
    const unknownManifestField = cloneManifest() as typeof manifestJson & {
      surprise?: boolean;
    };
    unknownManifestField.surprise = true;

    const unknownStageField = cloneManifest() as typeof manifestJson;
    Object.assign(unknownStageField.lives[0].stages[0], { surprise: true });

    expect(() => parseTownAssetManifest(unknownManifestField)).toThrow();
    expect(() => parseTownAssetManifest(unknownStageField)).toThrow();
  });

  it('rejects an anchor outside the referenced frame local coordinates', () => {
    const invalid = cloneManifest() as typeof manifestJson;
    invalid.lives[0].stages[0].anchor.x =
      invalid.atlases.graybox.frames['test-pine'].width + 1;

    expect(() => parseTownAssetManifest(invalid)).toThrow(/anchor/);
  });

  it('rejects a hit area outside the referenced frame local coordinates', () => {
    const invalid = cloneManifest() as typeof manifestJson;
    invalid.lives[0].stages[0].hitArea.y =
      invalid.atlases.graybox.frames['test-pine'].height - 1;
    invalid.lives[0].stages[0].hitArea.height = 2;

    expect(() => parseTownAssetManifest(invalid)).toThrow(/hitArea/);
  });
});

describe('resolveLifeStage', () => {
  const manifest = () => parseTownAssetManifest(manifestJson);

  it('bounds and floors the requested stage', () => {
    expect(
      resolveLifeStage(manifest(), {
        lifeId: 'mist-pine',
        requestedStage: 99.8,
        previewPath: '/town/life/mist-pine-0.svg',
      }),
    ).toMatchObject({ source: 'manifest', requestedStage: 3, resolvedStage: 3 });

    expect(
      resolveLifeStage(manifest(), {
        lifeId: 'mist-pine',
        requestedStage: -2,
        previewPath: '/town/life/mist-pine-0.svg',
      }),
    ).toMatchObject({ source: 'manifest', requestedStage: 0, resolvedStage: 0 });
  });

  it('searches downward for the nearest complete stage', () => {
    const incomplete = manifest();
    const pine = incomplete.lives.find(({ id }) => id === 'mist-pine');
    pine?.stages.splice(2, 1);

    expect(
      resolveLifeStage(incomplete, {
        lifeId: 'mist-pine',
        requestedStage: 2,
        previewPath: '/town/life/mist-pine-0.svg',
      }),
    ).toMatchObject({ source: 'manifest', requestedStage: 2, resolvedStage: 1 });
  });

  it('uses the existing preview path when the life is missing', () => {
    expect(
      resolveLifeStage(manifest(), {
        lifeId: 'not-in-manifest',
        requestedStage: 2,
        previewPath: '/town/life/legacy.svg',
      }),
    ).toEqual({
      source: 'preview',
      lifeId: 'not-in-manifest',
      requestedStage: 2,
      resolvedStage: null,
      previewPath: '/town/life/legacy.svg',
    });
  });

  it('uses the existing preview path when no complete stage remains', () => {
    const incomplete = manifest();
    const pine = incomplete.lives.find(({ id }) => id === 'mist-pine');
    pine?.stages.splice(0);

    expect(
      resolveLifeStage(incomplete, {
        lifeId: 'mist-pine',
        requestedStage: 3,
        previewPath: '/town/life/mist-pine-0.svg',
      }),
    ).toMatchObject({
      source: 'preview',
      lifeId: 'mist-pine',
      requestedStage: 3,
      resolvedStage: null,
      previewPath: '/town/life/mist-pine-0.svg',
    });
  });
});

describe('graybox atlas contract', () => {
  const expectedFrames = {
    'distant-mountains': { x: 108, y: 158, width: 371, height: 126 },
    'terrain-forest': { x: 610, y: 46, width: 319, height: 284 },
    'terrain-station': { x: 1057, y: 87, width: 339, height: 242 },
    'terrain-pasture': { x: 149, y: 422, width: 329, height: 228 },
    waystation: { x: 582, y: 375, width: 382, height: 300 },
    bridge: { x: 1064, y: 449, width: 332, height: 209 },
    'notice-board': { x: 188, y: 719, width: 228, height: 213 },
    'test-pine': { x: 698, y: 708, width: 125, height: 220 },
    'test-sheep': { x: 1131, y: 819, width: 117, height: 93 },
  };

  it('declares all required graybox frames within the generated sheet', () => {
    expect(grayboxJson.meta.size).toEqual({ width: 1536, height: 1024 });
    expect(grayboxJson.frames).toEqual(expectedFrames);

    for (const frame of Object.values(grayboxJson.frames)) {
      expect(frame.x).toBeGreaterThanOrEqual(0);
      expect(frame.y).toBeGreaterThanOrEqual(0);
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBeGreaterThan(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(grayboxJson.meta.size.width);
      expect(frame.y + frame.height).toBeLessThanOrEqual(grayboxJson.meta.size.height);
    }
  });

  it('keeps every graybox frame isolated from every other frame', () => {
    const entries = Object.entries(grayboxJson.frames);

    for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
      const [leftId, left] = entries[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
        const [rightId, right] = entries[rightIndex];
        const separated =
          left.x + left.width <= right.x ||
          right.x + right.width <= left.x ||
          left.y + left.height <= right.y ||
          right.y + right.height <= left.y;

        expect(separated, `${leftId} overlaps ${rightId}`).toBe(true);
      }
    }
  });

  it('uses alpha-derived bottom foot anchors for every placeholder life stage', () => {
    for (const life of manifestJson.lives) {
      const expectedAnchor =
        life.kind === 'tree' ? { x: 62, y: 219 } : { x: 58, y: 92 };
      expect(life.stages.every(({ anchor }) =>
        anchor.x === expectedAnchor.x && anchor.y === expectedAnchor.y,
      )).toBe(true);
    }
  });

  it('keeps the manifest and atlas metadata frame maps identical', () => {
    expect(manifestJson.atlases.graybox.frames).toEqual(grayboxJson.frames);
  });

  it('delivers an 8-bit 1536x1024 RGBA PNG with transparent outer padding', () => {
    const png = readFileSync(
      resolve(process.cwd(), 'public/town/pixel/v2/atlases/graybox.png'),
    );
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    expect(png.subarray(0, 8)).toEqual(signature);
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(1536);
    expect(png.readUInt32BE(20)).toBe(1024);
    expect(png[24]).toBe(8);
    expect(png[25]).toBe(6);

    const idatChunks: Buffer[] = [];
    for (let offset = 8; offset < png.length; ) {
      const length = png.readUInt32BE(offset);
      const type = png.toString('ascii', offset + 4, offset + 8);
      if (type === 'IDAT') {
        idatChunks.push(png.subarray(offset + 8, offset + 8 + length));
      }
      offset += length + 12;
    }

    const scanlines = inflateSync(Buffer.concat(idatChunks));
    // On the first scanline, every PNG filter uses zero for missing left/up
    // neighbors, so the first pixel's filtered alpha byte is its actual alpha.
    expect(scanlines[4]).toBe(0);
  });

  it('delivers every file referenced by the manifest', () => {
    const manifest = parseTownAssetManifest(manifestJson);
    const referencedFiles = new Set([
      manifest.posterPath,
      ...Object.values(manifest.atlases).flatMap(({ imagePath, dataPath }) => [
        imagePath,
        dataPath,
      ]),
    ]);

    for (const publicPath of referencedFiles) {
      expect(
        existsSync(resolve(process.cwd(), 'public', publicPath.replace(/^\//, ''))),
        `missing manifest file: ${publicPath}`,
      ).toBe(true);
    }
  });
});
