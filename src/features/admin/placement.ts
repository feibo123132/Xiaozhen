export function clampPlacement(point: { x: number; y: number }) { return { x: Math.min(100, Math.max(0, point.x)), y: Math.min(100, Math.max(0, point.y)) }; }
