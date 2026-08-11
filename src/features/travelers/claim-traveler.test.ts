import { expect, it } from 'vitest';
import { canConsumeAccountToken } from '@/features/auth/account-token';

it('allows initial claim only for unclaimed travelers and recovery only for claimed travelers', () => {
  const active = { status: 'active', expiresAt: new Date('2026-08-12'), consumedAt: null };
  expect(canConsumeAccountToken({ ...active, purpose: 'initial_claim' }, 'initial_claim', 'unclaimed', new Date('2026-08-11'))).toBe(true);
  expect(canConsumeAccountToken({ ...active, purpose: 'initial_claim' }, 'initial_claim', 'claimed', new Date('2026-08-11'))).toBe(false);
  expect(canConsumeAccountToken({ ...active, purpose: 'credential_recovery' }, 'credential_recovery', 'claimed', new Date('2026-08-11'))).toBe(true);
  expect(canConsumeAccountToken({ ...active, purpose: 'credential_recovery', consumedAt: new Date() }, 'credential_recovery', 'claimed', new Date('2026-08-11'))).toBe(false);
});
