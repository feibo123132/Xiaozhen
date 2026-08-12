import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  TownCameraView,
  TownEditorEvent,
  TownPublicEvent,
  TownWorldLife,
  TownWorldModel,
} from './world-model';
import {
  deriveZoneForLifeType,
  depthForLife,
  normalizedToWorld,
  pointInPolygon,
  projectIntoZone,
  TOWN_LAYOUTS,
  WORLD_SIZE,
  worldToNormalized,
} from './town-layout';

describe('town layout', () => {
  it('uses a 48 × 27 tile 16:9 world', () => {
    expect(WORLD_SIZE).toEqual({ width: 1536, height: 864, tile: 32 });
  });

  it.each([
    ['tree', 'forest'],
    ['animal', 'pasture'],
  ] as const)('%s belongs to %s', (type, zone) => {
    expect(deriveZoneForLifeType(type)).toBe(zone);
  });

  it('converts normalized coordinates to world coordinates', () => {
    expect(normalizedToWorld({ x: 50, y: 25 })).toEqual({ x: 768, y: 216 });
  });

  it('maps normalized boundaries to the world boundaries', () => {
    expect(normalizedToWorld({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(normalizedToWorld({ x: 100, y: 100 })).toEqual({ x: 1536, y: 864 });
  });

  it.each([
    { x: Number.NaN, y: 20 },
    { x: 20, y: Number.POSITIVE_INFINITY },
    { x: Number.NEGATIVE_INFINITY, y: 20 },
  ])('rejects non-finite normalized coordinates: $x, $y', (point) => {
    expect(() => normalizedToWorld(point)).toThrow(RangeError);
  });

  it('maps world boundaries back to normalized boundaries', () => {
    expect(worldToNormalized({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(worldToNormalized({ x: 1536, y: 864 })).toEqual({ x: 100, y: 100 });
  });

  it('rejects non-finite world coordinates', () => {
    expect(() => worldToNormalized({ x: Number.NaN, y: 0 })).toThrow(RangeError);
    expect(() => worldToNormalized({ x: 0, y: Number.POSITIVE_INFINITY })).toThrow(RangeError);
  });

  it('round-trips normalized and world coordinates within 0.001', () => {
    const normalized = { x: 37.1234, y: 81.9876 };
    const roundTrip = worldToNormalized(normalizedToWorld(normalized));

    expect(Math.abs(roundTrip.x - normalized.x)).toBeLessThan(0.001);
    expect(Math.abs(roundTrip.y - normalized.y)).toBeLessThan(0.001);
  });

  it('recognizes points inside and outside configured zone polygons', () => {
    const polygon = TOWN_LAYOUTS[2].zones.forest.polygon;

    expect(pointInPolygon({ x: 17, y: 62 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 90, y: 20 }, polygon)).toBe(false);
  });

  it('includes polygon edges and vertices while distinguishing either side', () => {
    const polygon = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 12, y: 10 },
      { x: 0, y: 10 },
    ];

    expect(pointInPolygon({ x: 5, y: 0 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 11, y: 5 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 10, y: 0 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 11 - 1e-7, y: 5 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 11 + 1e-7, y: 5 }, polygon)).toBe(false);
  });

  it('handles a near-horizontal large-scale edge and exact vertex hit stably', () => {
    const polygon = [
      { x: 0, y: 0 },
      { x: 1_000_000, y: 0.0001 },
      { x: 1_000_000, y: 1_000_000 },
      { x: 0, y: 1_000_000 },
    ];

    expect(pointInPolygon({ x: 500_000, y: 0.00005 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 1_000_000, y: 0.0001 }, polygon)).toBe(true);
    expect(pointInPolygon({ x: 500_000, y: -0.001 }, polygon)).toBe(false);
  });

  it.each([
    { x: Number.NaN, y: 20 },
    { x: 20, y: Number.POSITIVE_INFINITY },
    { x: Number.NEGATIVE_INFINITY, y: 20 },
  ])('rejects non-finite projection coordinates: $x, $y', (point) => {
    expect(() => projectIntoZone('forest', point)).toThrow(RangeError);
  });

  it('projects an outside safe-rect candidate to deterministic coordinates inside the polygon', () => {
    const first = projectIntoZone('forest', { x: 92, y: 60 });

    expect(first).toEqual(projectIntoZone('forest', { x: 92, y: 60 }));
    expect(first.x).toBeCloseTo(29.065461751058713, 12);
    expect(first.y).toBeCloseTo(82.4184737325609, 12);
    expect(pointInPolygon(first, TOWN_LAYOUTS[2].zones.forest.polygon)).toBe(true);
  });

  it.each([
    ['forest', { x: 50, y: 39 }, { x: 18, y: 62, inside: true }],
    ['pasture', { x: 50, y: 69 }, { x: 82, y: 63, inside: true }],
  ] as const)('maps a representative v1 %s sample into its v2 safe rectangle', (zone, source, expected) => {
    expect(projectIntoZone(zone, source)).toEqual(expected);
  });

  it('insets projected points 16 world pixels from the polygon boundary', () => {
    const projected = normalizedToWorld(projectIntoZone('forest', { x: 92, y: 60 }));
    const boundary = normalizedToWorld({ x: 10765 / 361, y: 30214 / 361 });

    expect(Math.hypot(projected.x - boundary.x, projected.y - boundary.y)).toBeCloseTo(16, 9);
    expect(pointInPolygon(worldToNormalized(projected), TOWN_LAYOUTS[2].zones.forest.polygon)).toBe(true);
  });

  it('clamps out-of-source values to the configured source rectangle', () => {
    expect(projectIntoZone('forest', { x: 200, y: 200 })).toEqual(
      projectIntoZone('forest', { x: 92, y: 60 }),
    );
    expect(projectIntoZone('pasture', { x: -200, y: -200 })).toEqual(
      projectIntoZone('pasture', { x: 8, y: 50 }),
    );
  });

  it('uses zIndex to break equal-y depth ties', () => {
    const lives = [
      { id: 'front', depth: depthForLife(320, 2) },
      { id: 'back', depth: depthForLife(320, -1) },
    ];

    expect(lives.sort((a, b) => a.depth - b.depth).map((life) => life.id)).toEqual(['back', 'front']);
  });

  it('keeps a one-world-pixel y difference primary across all allowed zIndex values', () => {
    expect(depthForLife(320, 499)).toBeLessThan(depthForLife(321, -499));
  });

  it.each([
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [320, 1.5],
    [320, 500],
    [320, -500],
  ])('rejects invalid depth input worldY=%s zIndex=%s', (worldY, zIndex) => {
    expect(() => depthForLife(worldY, zIndex)).toThrow(RangeError);
  });

  it('exposes the approved world model contract', () => {
    const life: TownWorldLife = {
      worryId: 'worry-1',
      slug: 'a-small-worry',
      title: 'A small worry',
      responseCount: 3,
      zone: 'forest',
      x: 240,
      y: 360,
      depthOffset: 2,
      assetId: 'oak',
      growthStage: 1,
    };
    const world: TownWorldModel = {
      layoutVersion: 2,
      width: WORLD_SIZE.width,
      height: WORLD_SIZE.height,
      lives: [life],
    };

    expect(world).toMatchObject({ width: 1536, height: 864 });
  });

  it('keeps camera, public events, and editor events type-safe and separate', () => {
    const camera = {
      x: 0,
      y: 0,
      scale: 1,
      viewportWidth: 1280,
      viewportHeight: 720,
    } satisfies TownCameraView;
    const publicEvent = { type: 'camera:change', view: camera } satisfies TownPublicEvent;
    const editorEvent = {
      type: 'life:move',
      lifeId: 'life-1',
      zone: 'forest',
      normalized: { x: 20, y: 50 },
    } satisfies TownEditorEvent;

    expectTypeOf(camera).toMatchTypeOf<TownCameraView>();
    expectTypeOf(publicEvent.type).toEqualTypeOf<'camera:change'>();
    expectTypeOf(editorEvent.type).toEqualTypeOf<'life:move'>();

    // @ts-expect-error Editor-only discriminants must never enter the public event union.
    const invalidPublicEvent: TownPublicEvent = editorEvent;
    expect(invalidPublicEvent.type).toBe('life:move');
  });
});
