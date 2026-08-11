function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function calculateGrowthStage(
  publishedCount: number,
  thresholds: number[],
): number {
  if (!isNonNegativeInteger(publishedCount)) {
    throw new Error('publishedCount must be a non-negative integer');
  }

  if (thresholds.length === 0) {
    throw new Error('thresholds must not be empty');
  }

  if (thresholds[0] !== 0) {
    throw new Error('thresholds must start at 0');
  }

  if (
    thresholds.some(
      (threshold, index) =>
        !isNonNegativeInteger(threshold) ||
        (index > 0 && threshold <= thresholds[index - 1]),
    )
  ) {
    throw new Error('thresholds must be strictly ascending non-negative integers');
  }

  let stage = 0;

  for (let index = 1; index < thresholds.length; index += 1) {
    if (publishedCount < thresholds[index]) {
      break;
    }

    stage = index;
  }

  return stage;
}
