import { expect, it, vi } from 'vitest';

import { createPlacementHandler } from './route';

const request = (body: unknown) => new Request('http://localhost/api/admin/placements', { method: 'POST', headers: { origin: 'http://localhost', 'content-type': 'application/json' }, body: JSON.stringify(body) });

it('requires an admin and clamps normalized coordinates', async () => {
  const save = vi.fn(async (data) => data);
  const denied = createPlacementHandler({ authorize: async () => false, assetMatchesWorry: async () => true, save });
  expect((await denied(request({ worryId: 'w1', lifeAssetId: 'a1', zone: 'forest', x: 30, y: 40 }))).status).toBe(401);
  const allowed = createPlacementHandler({ authorize: async () => true, assetMatchesWorry: async () => true, save });
  expect((await allowed(request({ worryId: 'w1', lifeAssetId: 'a1', zone: 'forest', x: 120, y: -5 }))).status).toBe(200);
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ x: 100, y: 0 }));
});

it('rejects arbitrary asset identifiers', async () => {
  const handler = createPlacementHandler({ authorize: async () => true, assetMatchesWorry: async () => false, save: vi.fn() });
  expect((await handler(request({ worryId: 'w1', lifeAssetId: 'uploaded-file', zone: 'forest', x: 20, y: 20 }))).status).toBe(400);
});
