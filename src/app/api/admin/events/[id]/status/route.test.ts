import { expect, it, vi } from 'vitest';

import { createEventStatusHandler } from './route';

const request = (body: unknown, origin = 'http://localhost') => new Request('http://localhost/api/admin/events/event-1/status', { method: 'PATCH', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });

it('rejects unauthenticated and cross-origin event mutations', async () => {
  const update = vi.fn();
  const unauthorized = createEventStatusHandler({ authorize: async () => false, getStatus: async () => 'draft', canActivate: async () => true, update });
  expect((await unauthorized(request({ status: 'active' }), { params: Promise.resolve({ id: 'event-1' }) })).status).toBe(401);
  const crossOrigin = createEventStatusHandler({ authorize: async () => true, getStatus: async () => 'draft', canActivate: async () => true, update });
  expect((await crossOrigin(request({ status: 'active' }, 'https://attacker.example'), { params: Promise.resolve({ id: 'event-1' }) })).status).toBe(403);
  expect(update).not.toHaveBeenCalled();
});

it('allows only draft → active → ended → archived and requires publishable features', async () => {
  const update = vi.fn(async () => undefined);
  const activate = createEventStatusHandler({ authorize: async () => true, getStatus: async () => 'draft', canActivate: async () => true, update });
  expect((await activate(request({ status: 'active' }), { params: Promise.resolve({ id: 'event-1' }) })).status).toBe(200);
  expect(update).toHaveBeenCalledWith('event-1', 'active');
  const archived = createEventStatusHandler({ authorize: async () => true, getStatus: async () => 'archived', canActivate: async () => true, update });
  expect((await archived(request({ status: 'active' }), { params: Promise.resolve({ id: 'event-1' }) })).status).toBe(409);
  const empty = createEventStatusHandler({ authorize: async () => true, getStatus: async () => 'draft', canActivate: async () => false, update });
  expect((await empty(request({ status: 'active' }), { params: Promise.resolve({ id: 'event-1' }) })).status).toBe(409);
});
