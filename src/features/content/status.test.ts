import { describe, expect, it } from 'vitest';

import {
  isGrowthEligibleViewpoint,
  isPublicViewpoint,
  type ViewpointStatus,
} from './status';

describe('viewpoint publication status rules', () => {
  const statuses: ViewpointStatus[] = ['draft', 'published', 'hidden', 'deleted'];

  it.each(statuses)('marks %s as publicly visible only when published', (status) => {
    expect(isPublicViewpoint(status)).toBe(status === 'published');
  });

  it.each(statuses)('marks %s as growth eligible only when published', (status) => {
    expect(isGrowthEligibleViewpoint(status)).toBe(status === 'published');
  });
});
