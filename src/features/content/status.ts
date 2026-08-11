export type ViewpointStatus = 'draft' | 'published' | 'hidden' | 'deleted';

export function isPublicViewpoint(status: ViewpointStatus): boolean {
  return status === 'published';
}

export function isGrowthEligibleViewpoint(status: ViewpointStatus): boolean {
  return status === 'published';
}
