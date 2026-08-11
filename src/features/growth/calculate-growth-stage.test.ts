import { describe, expect, it } from 'vitest';

import { calculateGrowthStage } from './calculate-growth-stage';

describe('calculateGrowthStage', () => {
  const thresholds = [0, 1, 3, 6];

  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [6, 3],
  ])('%i published viewpoints selects stage %i', (count, stage) => {
    expect(calculateGrowthStage(count, thresholds)).toBe(stage);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid published count of %s',
    (count) => {
      expect(() => calculateGrowthStage(count, thresholds)).toThrow(
        'publishedCount must be a non-negative integer',
      );
    },
  );

  it.each([
    { thresholds: [], error: 'thresholds must not be empty' },
    { thresholds: [1, 3], error: 'thresholds must start at 0' },
    {
      thresholds: [0, 3, 1],
      error: 'thresholds must be strictly ascending non-negative integers',
    },
    {
      thresholds: [0, 1, 1],
      error: 'thresholds must be strictly ascending non-negative integers',
    },
    {
      thresholds: [0, -1],
      error: 'thresholds must be strictly ascending non-negative integers',
    },
    {
      thresholds: [0, 1.5],
      error: 'thresholds must be strictly ascending non-negative integers',
    },
  ])('rejects $thresholds', ({ thresholds: invalidThresholds, error }) => {
    expect(() => calculateGrowthStage(0, invalidThresholds)).toThrow(error);
  });
});
