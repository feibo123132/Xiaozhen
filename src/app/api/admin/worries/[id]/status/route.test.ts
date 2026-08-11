import { expect, it, vi } from 'vitest';

import { createWorryStatusHandler } from './route';

const request = (status: string) => new Request('http://localhost/api/admin/worries/worry-1/status', { method: 'PATCH', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: JSON.stringify({ status }) });

it('allows draft → published → archived but never republishes archived worries', async () => {
  const update = vi.fn(async () => undefined);
  const publish = createWorryStatusHandler({ authorize: async () => true, getStatus: async () => 'draft', update });
  expect((await publish(request('published'), { params: Promise.resolve({ id: 'worry-1' }) })).status).toBe(200);
  const archived = createWorryStatusHandler({ authorize: async () => true, getStatus: async () => 'archived', update });
  expect((await archived(request('published'), { params: Promise.resolve({ id: 'worry-1' }) })).status).toBe(409);
});
