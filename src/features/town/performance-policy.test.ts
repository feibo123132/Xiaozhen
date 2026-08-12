import { createPerformancePolicy, samplePerformance } from './performance-policy';

it('ignores warmup then degrades after two consecutive low-fps windows without restarting', () => {
  let policy = createPerformancePolicy({ parallax: true, fireflies: true }, 0);
  for (let t = 100; t <= 8000; t += 25) policy = samplePerformance(policy, { timestamp: t, frameDuration: 25, visible: true, onscreen: true });
  expect(policy.effects).toEqual({ parallax: false, fireflies: false });
  for (let t = 8100; t < 12000; t += 10) policy = samplePerformance(policy, { timestamp: t, frameDuration: 10, visible: true, onscreen: true });
  expect(policy.effects).toEqual({ parallax: false, fireflies: false });
});

it('pauses immediately while hidden or offscreen and resumes without restoring degraded effects', () => {
  const initial = createPerformancePolicy({ parallax: false, fireflies: true }, 0);
  const hidden = samplePerformance(initial, { timestamp: 1, frameDuration: 16, visible: false, onscreen: true });
  expect(hidden.paused).toBe(true);
  expect(samplePerformance(hidden, { timestamp: 2, frameDuration: 16, visible: true, onscreen: true }).paused).toBe(false);
});

it('ignores invalid and out-of-order samples', () => {
  const initial = createPerformancePolicy({ parallax: true, fireflies: true }, 100);
  const sampled = samplePerformance(initial, { timestamp: 200, frameDuration: 16, visible: true, onscreen: true });
  expect(samplePerformance(sampled, { timestamp: 199, frameDuration: 16, visible: true, onscreen: true })).toEqual(sampled);
  expect(samplePerformance(sampled, { timestamp: 200, frameDuration: 16, visible: true, onscreen: true })).toEqual(sampled);
  expect(samplePerformance(sampled, { timestamp: 300, frameDuration: -1, visible: true, onscreen: true })).toEqual(sampled);
});

it('discards partial low windows across pause and requires two fresh active windows', () => {
  let policy = createPerformancePolicy({ parallax: true, fireflies: true }, 0);
  for (let t = 2000; t < 4000; t += 25) policy = samplePerformance(policy, { timestamp: t, frameDuration: 25, visible: true, onscreen: true });
  policy = samplePerformance(policy, { timestamp: 4000, frameDuration: 25, visible: false, onscreen: true });
  policy = samplePerformance(policy, { timestamp: 10000, frameDuration: 25, visible: true, onscreen: true });
  for (let t = 10025; t < 16000; t += 25) policy = samplePerformance(policy, { timestamp: t, frameDuration: 25, visible: true, onscreen: true });
  expect(policy.effects.parallax).toBe(true);
  policy = samplePerformance(policy, { timestamp: 16000, frameDuration: 25, visible: true, onscreen: true });
  expect(policy.effects).toEqual({ parallax: false, fireflies: false });
});
