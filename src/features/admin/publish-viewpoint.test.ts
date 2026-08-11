import { expect, it } from 'vitest';

import { validatePublication } from './publish-viewpoint';

it('requires final text, worry, traveler, authorization time and note', () => {
  expect(() => validatePublication({ body: '', worryId: '', travelerId: '', authorizationConfirmedAt: null as unknown as Date, authorizationNote: '', idempotencyKey: 'key' })).toThrow();
  expect(validatePublication({ body: '这是最终确认的观点。', worryId: 'w1', travelerId: 't1', authorizationConfirmedAt: new Date(), authorizationNote: '现场口头确认', idempotencyKey: 'valid-key' }).status).toBe('published');
});
