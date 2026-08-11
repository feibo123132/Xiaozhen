import { expect, it } from 'vitest';
import { canTransitionRemovalRequest } from '@/features/travelers/removal-request';
it('allows cancellation before review and requires a reason for rejection', () => { expect(canTransitionRemovalRequest('pending', 'cancelled')).toBe(true); expect(canTransitionRemovalRequest('pending', 'approved')).toBe(true); expect(canTransitionRemovalRequest('approved', 'cancelled')).toBe(false); expect(canTransitionRemovalRequest('pending', 'rejected', '')).toBe(false); expect(canTransitionRemovalRequest('pending', 'rejected', '参与者撤回范围不明确')).toBe(true); });
