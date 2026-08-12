import { WORLD_SIZE } from './town-layout';

export type Point = { x: number; y: number };
export type CameraState = {
  x: number; y: number; scale: number; viewportWidth: number; viewportHeight: number;
  baseScale: number; zoom: number;
  minX: number; maxX: number; minY: number; maxY: number;
};

export const MIN_ZOOM = 0.8;
export const MAX_ZOOM = 2.4;

function finite(...values: number[]) {
  if (values.some((value) => !Number.isFinite(value))) throw new RangeError('Camera values must be finite');
}

function bounds(viewportWidth: number, viewportHeight: number, scale: number) {
  const width = WORLD_SIZE.width * scale;
  const height = WORLD_SIZE.height * scale;
  const horizontal = viewportWidth >= width
    ? { minX: (viewportWidth - width) / 2, maxX: (viewportWidth - width) / 2 }
    : { minX: viewportWidth - width, maxX: 0 };
  const vertical = viewportHeight >= height
    ? { minY: (viewportHeight - height) / 2, maxY: (viewportHeight - height) / 2 }
    : { minY: viewportHeight - height, maxY: 0 };
  return { ...horizontal, ...vertical };
}

function reclamp(camera: Omit<CameraState, 'minX' | 'maxX' | 'minY' | 'maxY'>): CameraState {
  const limits = bounds(camera.viewportWidth, camera.viewportHeight, camera.scale);
  return {
    ...camera, ...limits,
    x: Math.min(limits.maxX, Math.max(limits.minX, camera.x)),
    y: Math.min(limits.maxY, Math.max(limits.minY, camera.y)),
  };
}

export function fitWorldToViewport(viewportWidth: number, viewportHeight: number): CameraState {
  finite(viewportWidth, viewportHeight);
  if (viewportWidth <= 0 || viewportHeight <= 0) throw new RangeError('Viewport dimensions must be positive');
  const baseScale = Math.min(viewportWidth / WORLD_SIZE.width, viewportHeight / WORLD_SIZE.height, 1);
  const zoom = 1;
  const scale = baseScale * zoom;
  const limits = bounds(viewportWidth, viewportHeight, scale);
  return reclamp({ x: limits.maxX, y: limits.maxY, scale, baseScale, zoom, viewportWidth, viewportHeight });
}

export function panCamera(camera: CameraState, dx: number, dy: number): CameraState {
  finite(dx, dy);
  return reclamp({ ...camera, x: camera.x + dx, y: camera.y + dy });
}

export function screenToWorld(camera: CameraState, point: Point): Point {
  finite(point.x, point.y);
  return { x: (point.x - camera.x) / camera.scale, y: (point.y - camera.y) / camera.scale };
}

export function worldToScreen(camera: CameraState, point: Point): Point {
  finite(point.x, point.y);
  return { x: point.x * camera.scale + camera.x, y: point.y * camera.scale + camera.y };
}

export function zoomAtPointer(camera: CameraState, pointer: Point, scale: number): CameraState {
  finite(scale);
  const world = screenToWorld(camera, pointer);
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
  const effectiveScale = camera.baseScale * zoom;
  return reclamp({ ...camera, zoom, scale: effectiveScale, x: pointer.x - world.x * effectiveScale, y: pointer.y - world.y * effectiveScale });
}

export function updatePinch(camera: CameraState, before: readonly [Point, Point], after: readonly [Point, Point]): CameraState {
  finite(before[0].x, before[0].y, before[1].x, before[1].y, after[0].x, after[0].y, after[1].x, after[1].y);
  const midpoint = (points: readonly [Point, Point]) => ({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
  const distance = (points: readonly [Point, Point]) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  const start = midpoint(before);
  const end = midpoint(after);
  const anchored = screenToWorld(camera, start);
  if (distance(before) <= Number.EPSILON * Math.max(1, camera.viewportWidth, camera.viewportHeight)) {
    return panCamera(camera, end.x - start.x, end.y - start.y);
  }
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * distance(after) / distance(before)));
  const scale = camera.baseScale * zoom;
  return reclamp({ ...camera, zoom, scale, x: end.x - anchored.x * scale, y: end.y - anchored.y * scale });
}

export function ensureWorldPointVisible(camera: CameraState, point: Point, padding = 0): CameraState {
  finite(padding);
  padding = Math.min(Math.max(0, padding), Math.min(camera.viewportWidth, camera.viewportHeight) / 2);
  const screen = worldToScreen(camera, point);
  const dx = screen.x < padding ? padding - screen.x : screen.x > camera.viewportWidth - padding ? camera.viewportWidth - padding - screen.x : 0;
  const dy = screen.y < padding ? padding - screen.y : screen.y > camera.viewportHeight - padding ? camera.viewportHeight - padding - screen.y : 0;
  return panCamera(camera, dx, dy);
}

export function classifyPointerIntent(start: Point, end: Point): 'tap' | 'drag' {
  finite(start.x, start.y, end.x, end.y);
  return Math.hypot(end.x - start.x, end.y - start.y) > 6 ? 'drag' : 'tap';
}
