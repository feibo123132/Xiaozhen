'use client';

import { useReducer } from 'react';

export type TownView = { x: number; y: number; scale: number };

export type PanZoomAction =
  | { type: 'pan'; dx: number; dy: number; reducedMotion?: boolean }
  | { type: 'zoom'; factor: number }
  | { type: 'reset' };

export const INITIAL_VIEW: TownView = { x: 0, y: 0, scale: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function reducePanZoom(state: TownView, action: PanZoomAction): TownView {
  if (action.type === 'reset') return INITIAL_VIEW;
  if (action.type === 'pan') {
    if (action.reducedMotion) return state;
    return { ...state, x: clamp(state.x + action.dx, -240, 240), y: clamp(state.y + action.dy, -180, 180) };
  }
  return { ...state, scale: clamp(Number((state.scale * action.factor).toFixed(3)), 0.8, 2.4) };
}

export function usePanZoom() {
  return useReducer(reducePanZoom, INITIAL_VIEW);
}
