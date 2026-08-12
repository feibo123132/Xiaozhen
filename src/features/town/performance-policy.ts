export type Effects = { parallax: boolean; fireflies: boolean };
export type PerformancePolicy = {
  effects: Effects; paused: boolean; sessionStart: number; lastTimestamp: number;
  windowStart: number; frameTime: number; frameCount: number; consecutiveLow: number; degraded: boolean;
};

export function createPerformancePolicy(capabilities: Effects, timestamp: number): PerformancePolicy {
  if (!Number.isFinite(timestamp)) throw new RangeError('timestamp must be finite');
  return { effects: { ...capabilities }, paused: false, sessionStart: timestamp, lastTimestamp: timestamp, windowStart: timestamp + 2000, frameTime: 0, frameCount: 0, consecutiveLow: 0, degraded: false };
}

export function samplePerformance(policy: PerformancePolicy, sample: { timestamp: number; frameDuration: number; visible: boolean; onscreen: boolean }): PerformancePolicy {
  if (!sample.visible || !sample.onscreen) return { ...policy, paused: true, frameTime: 0, frameCount: 0, consecutiveLow: 0 };
  if (!Number.isFinite(sample.timestamp) || !Number.isFinite(sample.frameDuration) || sample.frameDuration <= 0 || sample.timestamp <= policy.lastTimestamp) return policy;
  if (policy.paused) return { ...policy, paused: false, lastTimestamp: sample.timestamp, windowStart: sample.timestamp, frameTime: 0, frameCount: 0, consecutiveLow: 0 };
  let next = { ...policy, paused: false, lastTimestamp: sample.timestamp };
  if (sample.timestamp < policy.sessionStart + 2000 || next.degraded) return next;
  next.frameTime += sample.frameDuration;
  next.frameCount += 1;
  if (sample.timestamp - next.windowStart < 3000) return next;
  const fps = next.frameTime > 0 ? next.frameCount * 1000 / next.frameTime : 60;
  const consecutiveLow = fps < 45 ? next.consecutiveLow + 1 : 0;
  const degraded = consecutiveLow >= 2;
  return {
    ...next,
    effects: degraded ? { parallax: false, fireflies: false } : next.effects,
    degraded,
    consecutiveLow,
    windowStart: sample.timestamp,
    frameTime: 0,
    frameCount: 0,
  };
}
