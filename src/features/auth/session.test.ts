import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password';
import { buildSessionCookie, validateSessionRecord } from './session';

describe('passwords and sessions', () => {
  it('uses unique scrypt salts and verifies without storing plaintext', () => {
    const first = hashPassword('a-long-private-password');
    const second = hashPassword('a-long-private-password');
    expect(first).not.toBe(second);
    expect(first).not.toContain('a-long-private-password');
    expect(verifyPassword('a-long-private-password', first)).toBe(true);
    expect(verifyPassword('wrong-password', first)).toBe(false);
  });

  it('sets an opaque admin cookie with secure browser attributes', () => {
    const cookie = buildSessionCookie('opaque-token', new Date('2026-08-12T00:00:00Z'), true);
    expect(cookie).toContain('relief_town_admin=opaque-token');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Secure/i);
  });

  it('rejects expired, revoked, or wrong-role sessions', () => {
    const now = new Date('2026-08-11T12:00:00Z');
    const active = { actorType: 'admin', expiresAt: new Date('2026-08-12T12:00:00Z'), revokedAt: null };
    expect(validateSessionRecord(active, 'admin', now)).toBe(true);
    expect(validateSessionRecord({ ...active, actorType: 'traveler' }, 'admin', now)).toBe(false);
    expect(validateSessionRecord({ ...active, expiresAt: new Date('2026-08-10') }, 'admin', now)).toBe(false);
    expect(validateSessionRecord({ ...active, revokedAt: now }, 'admin', now)).toBe(false);
  });
});
