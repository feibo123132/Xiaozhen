import {
  classifyPointerIntent, ensureWorldPointVisible, fitWorldToViewport, panCamera,
  screenToWorld, updatePinch, worldToScreen, zoomAtPointer,
} from './camera-controller';

it('centers the complete world at reset for landscape and portrait viewports', () => {
  expect(fitWorldToViewport(1000, 600)).toMatchObject({ x: 0, y: 18.75, scale: 1000 / 1536, baseScale: 1000 / 1536, zoom: 1 });
  expect(fitWorldToViewport(2000, 1200)).toMatchObject({ x: 232, y: 168, scale: 1, zoom: 1 });
  const portrait = fitWorldToViewport(400, 800);
  expect(portrait).toMatchObject({ y: 287.5, scale: 400 / 1536, zoom: 1 });
  expect(portrait.x).toBeCloseTo(0);
  expect(() => fitWorldToViewport(0, 600)).toThrow(RangeError);
});

it('clamps pan and scale to coherent world bounds', () => {
  const camera = fitWorldToViewport(1000, 600);
  expect(panCamera(camera, -9999, -9999)).toMatchObject({ x: 0, y: 18.75 });
  const maximum = zoomAtPointer(camera, { x: 500, y: 300 }, 99);
  expect(maximum.zoom).toBe(2.4);
  expect(maximum.scale).toBeCloseTo((1000 / 1536) * 2.4);
  expect(zoomAtPointer(maximum, { x: 500, y: 300 }, 0.01).zoom).toBe(0.8);
});

it('keeps the pointer world point stable while zooming', () => {
  const camera = fitWorldToViewport(1000, 600);
  const pointer = { x: 300, y: 250 };
  const world = screenToWorld(camera, pointer);
  const zoomed = zoomAtPointer(camera, pointer, 1.5);
  expect(worldToScreen(zoomed, world)).toEqual(pointer);
});

it('keeps a moving pinch midpoint anchored to the same world point', () => {
  const camera = fitWorldToViewport(1000, 600);
  const pinched = updatePinch(camera, [{ x: 200, y: 200 }, { x: 400, y: 200 }], [{ x: 250, y: 250 }, { x: 550, y: 250 }]);
  expect(worldToScreen(pinched, screenToWorld(camera, { x: 300, y: 200 }))).toEqual({ x: 400, y: 250 });
});

it('handles coincident pinch points as translation-only and rejects nonfinite points', () => {
  const camera = fitWorldToViewport(1000, 600);
  const translated = updatePinch(camera, [{ x: 200, y: 200 }, { x: 200, y: 200 }], [{ x: 250, y: 250 }, { x: 250, y: 250 }]);
  expect(translated.zoom).toBe(camera.zoom);
  expect(Object.values(translated).every(Number.isFinite)).toBe(true);
  expect(() => updatePinch(camera, [{ x: Number.NaN, y: 0 }, { x: 1, y: 1 }], [{ x: 0, y: 0 }, { x: 1, y: 1 }])).toThrow(RangeError);
  expect(() => updatePinch(camera, [{ x: 0, y: 0 }, { x: 1, y: 1 }], [{ x: 0, y: Infinity }, { x: 1, y: 1 }])).toThrow(RangeError);
});

it('focuses points, classifies the six-pixel threshold, and rejects invalid values', () => {
  const focused = ensureWorldPointVisible(fitWorldToViewport(500, 400), { x: 1200, y: 700 }, 40);
  const screen = worldToScreen(focused, { x: 1200, y: 700 });
  expect(screen.x).toBeGreaterThanOrEqual(40);
  expect(screen.x).toBeLessThanOrEqual(460);
  expect(classifyPointerIntent({ x: 0, y: 0 }, { x: 6, y: 0 })).toBe('tap');
  expect(classifyPointerIntent({ x: 0, y: 0 }, { x: 6.01, y: 0 })).toBe('drag');
  expect(() => panCamera(fitWorldToViewport(500, 400), Number.NaN, 0)).toThrow(RangeError);
});

it('clamps finite focus padding to the viewport half-size and rejects nonfinite padding', () => {
  const camera = fitWorldToViewport(500, 400);
  expect(ensureWorldPointVisible(camera, { x: 100, y: 100 }, -20)).toEqual(ensureWorldPointVisible(camera, { x: 100, y: 100 }, 0));
  expect(Object.values(ensureWorldPointVisible(camera, { x: 100, y: 100 }, 9999)).every(Number.isFinite)).toBe(true);
  expect(() => ensureWorldPointVisible(camera, { x: 100, y: 100 }, Number.NaN)).toThrow(RangeError);
});
