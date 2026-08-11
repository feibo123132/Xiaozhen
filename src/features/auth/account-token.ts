import { createHash, randomBytes } from 'node:crypto';
export type TokenPurpose = 'initial_claim' | 'credential_recovery';
export function hashAccountToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function createAccountToken(purpose: TokenPurpose, now = new Date()) { const token = randomBytes(32).toString('base64url'); return { token, tokenHash: hashAccountToken(token), purpose, status: 'active' as const, expiresAt: new Date(now.getTime() + 24 * 60 * 60_000) }; }
export function canConsumeAccountToken(record: { purpose: string; status: string; expiresAt: Date; consumedAt: Date | null } | null, purpose: TokenPurpose, travelerStatus: string, now = new Date()) { if (!record || record.purpose !== purpose || record.status !== 'active' || record.consumedAt || record.expiresAt <= now) return false; return purpose === 'initial_claim' ? travelerStatus === 'unclaimed' : travelerStatus === 'claimed'; }
