export const WORLD_SIZE = { width: 1536, height: 864, tile: 32 } as const;

export type TownZone = 'forest' | 'pasture';

export const TOWN_LAYOUTS = {
  1: {
    sourceRects: {
      forest: { minX: 8, maxX: 92, minY: 18, maxY: 60 },
      pasture: { minX: 8, maxX: 92, minY: 50, maxY: 88 },
    },
  },
  2: {
    zones: {
      forest: {
        safeRect: { minX: 6, maxX: 30, minY: 40, maxY: 84 },
        centroid: { x: 17, y: 62 },
        polygon: [
          { x: 4, y: 34 },
          { x: 27, y: 31 },
          { x: 36, y: 43 },
          { x: 33, y: 67 },
          { x: 29, y: 88 },
          { x: 4, y: 94 },
        ],
      },
      pasture: {
        safeRect: { minX: 70, maxX: 94, minY: 42, maxY: 84 },
        centroid: { x: 82, y: 63 },
        polygon: [
          { x: 66, y: 38 },
          { x: 95, y: 34 },
          { x: 97, y: 94 },
          { x: 70, y: 90 },
          { x: 65, y: 65 },
        ],
      },
    },
  },
} as const;

type Point = { x: number; y: number };
const GEOMETRY_EPSILON = 1e-10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function assertFinitePoint(point: Point): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError('Town coordinates must be finite numbers');
  }
}

export function normalizedToWorld(point: Point): Point {
  assertFinitePoint(point);

  return {
    x: (point.x / 100) * WORLD_SIZE.width,
    y: (point.y / 100) * WORLD_SIZE.height,
  };
}

export function worldToNormalized(point: Point): Point {
  assertFinitePoint(point);

  return {
    x: (point.x / WORLD_SIZE.width) * 100,
    y: (point.y / WORLD_SIZE.height) * 100,
  };
}

export function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  assertFinitePoint(point);

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const edge = { x: end.x - start.x, y: end.y - start.y };
    const offset = { x: point.x - start.x, y: point.y - start.y };
    const edgeLengthSquared = edge.x * edge.x + edge.y * edge.y;
    const cross = edge.x * offset.y - edge.y * offset.x;
    const crossTolerance = GEOMETRY_EPSILON * Math.max(1, Math.sqrt(edgeLengthSquared) * Math.hypot(offset.x, offset.y));
    const dot = offset.x * edge.x + offset.y * edge.y;
    const boundsTolerance = GEOMETRY_EPSILON * Math.max(1, edgeLengthSquared);

    if (
      Math.abs(cross) <= crossTolerance &&
      dot >= -boundsTolerance &&
      dot <= edgeLengthSquared + boundsTolerance
    ) {
      return true;
    }
  }

  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current];
    const b = polygon[previous];
    const crossesScanline = a.y > point.y !== b.y > point.y;
    const edgeX = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (crossesScanline && point.x < edgeX) inside = !inside;
  }

  return inside;
}

function rayBoundaryIntersection(origin: Point, candidate: Point, polygon: readonly Point[]): Point | null {
  const ray = { x: candidate.x - origin.x, y: candidate.y - origin.y };
  const rayLength = Math.hypot(ray.x, ray.y);
  let closestDistance = Number.POSITIVE_INFINITY;
  let closest: Point | null = null;

  for (let index = 0; index < polygon.length; index += 1) {
    const edgeStart = polygon[index];
    const edgeEnd = polygon[(index + 1) % polygon.length];
    const edge = { x: edgeEnd.x - edgeStart.x, y: edgeEnd.y - edgeStart.y };
    const denominator = ray.x * edge.y - ray.y * edge.x;
    const denominatorTolerance = GEOMETRY_EPSILON * Math.max(1, rayLength * Math.hypot(edge.x, edge.y));

    if (Math.abs(denominator) <= denominatorTolerance) continue;

    const offset = { x: edgeStart.x - origin.x, y: edgeStart.y - origin.y };
    const rayDistance = (offset.x * edge.y - offset.y * edge.x) / denominator;
    const edgeDistance = (offset.x * ray.y - offset.y * ray.x) / denominator;

    if (
      rayDistance >= -GEOMETRY_EPSILON &&
      edgeDistance >= -GEOMETRY_EPSILON &&
      edgeDistance <= 1 + GEOMETRY_EPSILON &&
      rayDistance < closestDistance - GEOMETRY_EPSILON
    ) {
      closestDistance = rayDistance;
      closest = {
        x: origin.x + rayDistance * ray.x,
        y: origin.y + rayDistance * ray.y,
      };
    }
  }

  return closest;
}

export function projectIntoZone(zone: TownZone, point: Point): Point & { inside: true } {
  assertFinitePoint(point);

  const source = TOWN_LAYOUTS[1].sourceRects[zone];
  const target = TOWN_LAYOUTS[2].zones[zone];
  const sourcePoint = {
    x: clamp(point.x, source.minX, source.maxX),
    y: clamp(point.y, source.minY, source.maxY),
  };
  const relative = {
    x: (sourcePoint.x - source.minX) / (source.maxX - source.minX),
    y: (sourcePoint.y - source.minY) / (source.maxY - source.minY),
  };
  const candidate = {
    x: target.safeRect.minX + relative.x * (target.safeRect.maxX - target.safeRect.minX),
    y: target.safeRect.minY + relative.y * (target.safeRect.maxY - target.safeRect.minY),
  };

  if (pointInPolygon(candidate, target.polygon)) return { ...candidate, inside: true };

  const boundary = rayBoundaryIntersection(target.centroid, candidate, target.polygon);
  if (!boundary) return { ...target.centroid, inside: true };

  const boundaryWorld = normalizedToWorld(boundary);
  const centroidWorld = normalizedToWorld(target.centroid);
  const inward = {
    x: centroidWorld.x - boundaryWorld.x,
    y: centroidWorld.y - boundaryWorld.y,
  };
  const inwardLength = Math.hypot(inward.x, inward.y);
  const insetWorld = {
    x: boundaryWorld.x + (inward.x / inwardLength) * 16,
    y: boundaryWorld.y + (inward.y / inwardLength) * 16,
  };

  return { ...worldToNormalized(insetWorld), inside: true };
}

export function deriveZoneForLifeType(type: 'tree' | 'animal'): TownZone {
  return type === 'tree' ? 'forest' : 'pasture';
}

export function depthForLife(worldY: number, zIndex: number): number {
  if (!Number.isFinite(worldY)) {
    throw new RangeError('Life depth worldY must be finite');
  }
  // A bounded integer tie-breaker keeps every 1-world-pixel y difference primary.
  if (!Number.isInteger(zIndex) || zIndex < -499 || zIndex > 499) {
    throw new RangeError('Life depth zIndex must be an integer between -499 and 499');
  }

  return worldY * 1000 + zIndex;
}
