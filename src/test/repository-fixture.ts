import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { PrismaClient } from '@/generated/prisma/client';
import { createPrismaClient } from '@/lib/db';

export function createRepositoryFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'relief-town-'));
  const databasePath = join(directory, 'test.db').replaceAll('\\', '/');
  const databaseUrl = `file:${databasePath}`;
  let client: PrismaClient | undefined;

  return {
    get prisma() {
      if (!client) throw new Error('Fixture has not started');
      return client;
    },

    async start() {
      execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--url', databaseUrl], {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: databaseUrl },
        stdio: 'ignore',
      });
      client = createPrismaClient(databaseUrl);
      const asset = await client.lifeAsset.create({
        data: {
          id: 'mist-pine',
          type: 'tree',
          name: '雾松',
          previewPath: '/town/life/mist-pine-0.svg',
          growthStagePaths: ['/town/life/mist-pine-0.svg', '/town/life/mist-pine-1.svg'],
          growthThresholds: [0, 1],
        },
      });
      const worry = await client.worry.create({
        data: {
          slug: 'leave-or-stay',
          title: '留下，还是重新开始？',
          body: '我不知道该留在稳定的工作，还是重新开始。',
          status: 'published',
          lifeAssetId: asset.id,
        },
      });
      await client.worry.create({
        data: {
          slug: 'draft-worry',
          title: '还没有公开的问题',
          body: '草稿不应该出现在公共端。',
          status: 'draft',
          lifeAssetId: asset.id,
        },
      });
      const event = await client.event.create({
        data: {
          slug: 'first-roadshow',
          title: '第一次路演',
          intro: '在街角认真谈一次。',
          status: 'active',
        },
      });
      await client.eventFeature.create({ data: { eventId: event.id, worryId: worry.id, position: 0 } });
      const traveler = await client.traveler.create({
        data: { publicId: 'traveler-wind', pseudonym: '晚风', avatarKey: 'fox', status: 'claimed' },
      });
      await client.viewpoint.createMany({
        data: [
          {
            body: '先走一小步，再观察自己。',
            status: 'published',
            publishedAt: new Date(),
            worryId: worry.id,
            travelerId: traveler.id,
          },
          {
            body: '这条不应公开。',
            status: 'hidden',
            worryId: worry.id,
            travelerId: traveler.id,
          },
        ],
      });
    },

    async stop() {
      await client?.$disconnect();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
