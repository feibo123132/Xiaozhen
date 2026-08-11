import { describe, expect, it } from 'vitest';

import { applyFailedAttempt, throttleKey } from './rate-limit';

describe('database-backed authentication throttling rules', () => {
  const now = new Date('2026-08-11T12:00:00Z');

  it('hashes endpoint scope and normalized identity', () => {
    expect(throttleKey('admin-login', ' Curator ')).toBe(throttleKey('admin-login', 'curator'));
    expect(throttleKey('admin-login', 'curator')).not.toBe(throttleKey('traveler-login', 'curator'));
  });

  it('blocks repeated failures and starts clean after the window', () => {
    let state = null;
    for (let attempt = 0; attempt < 5; attempt += 1) state = applyFailedAttempt(state, now);
    expect(state?.blockedUntil?.getTime()).toBeGreaterThan(now.getTime());
    const later = new Date(now.getTime() + 16 * 60_000);
    expect(applyFailedAttempt(state, later).failureCount).toBe(1);
  });
});
