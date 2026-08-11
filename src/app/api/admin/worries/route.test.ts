import { expect, it, vi } from 'vitest';

import { createWorryHandler } from './route';

const request = (body: unknown) => new Request('http://localhost/api/admin/worries', { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: JSON.stringify(body) });

it('returns field errors for invalid drafts', async () => {
  const handler = createWorryHandler({ authorize: async () => true, lifeAssetExists: async () => true, createDraft: vi.fn() });
  const response = await handler(request({ title: '', slug: 'Not Valid' }));
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ fieldErrors: { title: expect.any(Array), slug: expect.any(Array) } });
});

it('creates a draft and never publishes directly', async () => {
  const createDraft = vi.fn(async (data) => ({ id: 'worry-1', ...data }));
  const handler = createWorryHandler({ authorize: async () => true, lifeAssetExists: async () => true, createDraft });
  const response = await handler(request({ slug: 'a-real-question', title: '一个真实问题', body: '这是问题正文。', lifeAssetId: 'mist-pine' }));
  expect(response.status).toBe(201);
  expect(createDraft).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft' }));
});
