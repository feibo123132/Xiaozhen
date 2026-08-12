import manifestJson from '../../../public/town/pixel/v2/manifest.json';
import { parseTownAssetManifest } from './asset-manifest';
import { pointInPolygon, TOWN_LAYOUTS, worldToNormalized } from './town-layout';
import { adaptTownWorries } from './world-adapter';

const manifest = parseTownAssetManifest(manifestJson);
const worry = (overrides: Record<string, unknown> = {}) => ({
  id: 'w1', slug: 'one', title: 'One', publishedViewpointCount: 7,
  placement: { id: 'p1', worryId: 'w1', zone: 'forest', x: 25, y: 40, zIndex: 3, layoutVersion: 1 },
  life: { id: 'mist-pine', name: 'Pine', type: 'tree', previewPath: '/legacy/pine.svg', growthStage: 2, growthPath: '/legacy/pine-2.svg' },
  ...overrides,
});

it('projects v1 placements into the v2 zone and preserves content fields', () => {
  const result = adaptTownWorries([worry()], manifest);
  const life = result.world.lives[0];
  expect(result.world).toMatchObject({ layoutVersion: 2, width: 1536, height: 864 });
  expect(life).toMatchObject({ worryId: 'w1', responseCount: 7, growthStage: 2, assetId: 'mist-pine', depthOffset: 3 });
  expect(pointInPolygon(worldToNormalized({ x: life.x, y: life.y }), TOWN_LAYOUTS[2].zones.forest.polygon)).toBe(true);
});

it('keeps valid v2 normalized placements unchanged after conversion to world coordinates', () => {
  const result = adaptTownWorries([worry({ placement: { zone: 'pasture', x: 80, y: 60, zIndex: 1, layoutVersion: 2 }, life: { id: 'warm-sheep', name: 'Sheep', type: 'animal', previewPath: '/legacy/sheep.svg', growthStage: 2, growthPath: '/legacy/sheep-2.svg' } })], manifest);
  expect(result.world.lives[0]).toMatchObject({ zone: 'pasture' });
  expect(result.world.lives[0].x).toBeCloseTo(1228.8);
  expect(result.world.lives[0].y).toBeCloseTo(518.4);
});

it('keeps unplaced worries in the list and exposes legacy preview fallback for unknown life assets', () => {
  const unknown = worry({ id: 'w2', placement: { zone: 'forest', x: 15, y: 60, zIndex: 0, layoutVersion: 2 }, life: { id: 'unknown', name: 'Old', type: 'tree', previewPath: '/old.svg', growthStage: 3, growthPath: '/old-3.svg' } });
  const result = adaptTownWorries([worry({ placement: null }), unknown], manifest);
  expect(result.worries).toHaveLength(2);
  expect(result.world.lives).toHaveLength(1);
  expect(result.legacyPreviewByWorryId.w2).toBe('/old-3.svg');
});

it('omits and reports corrupt v2 placements while retaining their worries', () => {
  const invalid = [
    worry({ id: 'nan', placement: { zone: 'forest', x: Number.NaN, y: 60, zIndex: 0, layoutVersion: 2 } }),
    worry({ id: 'outside', placement: { zone: 'forest', x: 90, y: 10, zIndex: 0, layoutVersion: 2 } }),
    worry({ id: 'wrong-zone', placement: { zone: 'pasture', x: 80, y: 60, zIndex: 0, layoutVersion: 2 } }),
  ];
  const result = adaptTownWorries(invalid, manifest);
  expect(result.worries).toHaveLength(3);
  expect(result.world.lives).toHaveLength(0);
  expect(result.issues).toEqual([
    { worryId: 'nan', code: 'invalid-v2-placement' },
    { worryId: 'outside', code: 'invalid-v2-placement' },
    { worryId: 'wrong-zone', code: 'invalid-v2-placement' },
  ]);
});
