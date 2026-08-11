import { expect, it } from 'vitest';

import { clampPlacement } from './map-editor';

it('normalizes public map coordinates into the safe scene bounds', () => {
  expect(clampPlacement({ x: -12, y: 105 })).toEqual({ x: 0, y: 100 });
  expect(clampPlacement({ x: 42.25, y: 68.5 })).toEqual({ x: 42.25, y: 68.5 });
});
