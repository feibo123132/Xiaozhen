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

  it('returns unchanged versioned placement data from town and detail endpoints', async () => {
    const repository = createPublicRepository(fixture.prisma);
    const storedWorry = await fixture.prisma.worry.findUniqueOrThrow({
      where: { slug: 'leave-or-stay' },
      include: { placement: true },
    });
    const expectedPlacement = {
      id: storedWorry.placement?.id,
      worryId: storedWorry.id,
      zone: 'forest',
      x: 12,
      y: 30,
      zIndex: 0,
      layoutVersion: 1,
    };

    const town = await repository.getTownWorries();
    const worry = await repository.getWorryBySlug('leave-or-stay');

    expect(town[0]?.placement).toEqual(expectedPlacement);
    expect(worry?.placement).toEqual(expectedPlacement);
    expect(Object.keys(town[0]?.placement ?? {}).sort()).toEqual(
      ['id', 'layoutVersion', 'worryId', 'x', 'y', 'zIndex', 'zone'].sort(),
    );
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
