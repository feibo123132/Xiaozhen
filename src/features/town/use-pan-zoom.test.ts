import { describe, expect, it } from 'vitest';

import { INITIAL_VIEW, reducePanZoom } from './use-pan-zoom';

describe('town pan and zoom', () => {
  it('moves the view while keeping it inside the scene bounds', () => {
    expect(reducePanZoom(INITIAL_VIEW, { type: 'pan', dx: 80, dy: -40 })).toEqual({ x: 80, y: -40, scale: 1 });
    expect(reducePanZoom(INITIAL_VIEW, { type: 'pan', dx: 900, dy: -900 })).toEqual({ x: 240, y: -180, scale: 1 });
  });

  it('clamps wheel and pinch zoom between the supported scales', () => {
    expect(reducePanZoom(INITIAL_VIEW, { type: 'zoom', factor: 10 }).scale).toBe(2.4);
    expect(reducePanZoom(INITIAL_VIEW, { type: 'zoom', factor: 0.01 }).scale).toBe(0.8);
  });

  it('resets and avoids animated movement when reduced motion is requested', () => {
    const moved = reducePanZoom(INITIAL_VIEW, { type: 'pan', dx: 20, dy: 10 });
    expect(reducePanZoom(moved, { type: 'reset' })).toEqual(INITIAL_VIEW);
    expect(reducePanZoom(moved, { type: 'pan', dx: 30, dy: 20, reducedMotion: true })).toEqual(moved);
  });
});
