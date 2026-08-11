import { expect, it } from 'vitest';
import { nextOwnedViewpointStatus } from './viewpoint-control';
it('lets the owner hide and restore a viewpoint without editing its text', () => { expect(nextOwnedViewpointStatus('published', 'hide')).toBe('hidden'); expect(nextOwnedViewpointStatus('hidden', 'restore')).toBe('published'); expect(() => nextOwnedViewpointStatus('deleted', 'restore')).toThrow(); });
