import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createRepositoryFixture } from '../../test/repository-fixture';
import { createPublicRepository } from './public-repository';

describe('public content repository', () => {
  const fixture = createRepositoryFixture();

  beforeAll(async () => {
    await fixture.start();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('returns the active event with ordered published features', async () => {
    const repository = createPublicRepository(fixture.prisma);

    await expect(repository.getCurrentEvent()).resolves.toMatchObject({
      title: '第一次路演',
      featuredWorries: [{ slug: 'leave-or-stay' }],
    });
  });

  it('excludes drafts and hidden viewpoints from public worry details', async () => {
    const repository = createPublicRepository(fixture.prisma);

    const worry = await repository.getWorryBySlug('leave-or-stay');

    expect(worry).toMatchObject({
      publishedViewpointCount: 1,
      growthStage: 1,
    });
    expect(worry?.viewpoints).toHaveLength(1);
    expect(worry?.viewpoints[0]?.body).toBe('先走一小步，再观察自己。');
  });
});
