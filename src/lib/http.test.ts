import { expect, it } from 'vitest';

import { isSameOrigin } from './http';

it('accepts the browser origin when Next uses a different internal request host', () => {
  const request = new Request('http://localhost:3187/api/admin/session', {
    headers: { origin: 'http://127.0.0.1:3187', host: '127.0.0.1:3187', 'x-forwarded-proto': 'http' },
  });
  expect(isSameOrigin(request)).toBe(true);
});

it('still rejects a genuinely cross-origin mutation', () => {
  const request = new Request('http://localhost:3187/api/admin/session', {
    headers: { origin: 'https://attacker.example', host: '127.0.0.1:3187', 'x-forwarded-proto': 'http' },
  });
  expect(isSameOrigin(request)).toBe(false);
});
