import { scryptSync, randomBytes } from 'node:crypto';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

const assets = [
  ['mist-pine', 'tree', '雾松'], ['sun-oak', 'tree', '向阳栎'], ['quiet-birch', 'tree', '静白桦'],
  ['wandering-deer', 'animal', '远行鹿'], ['warm-sheep', 'animal', '暖绒羊'], ['night-fox', 'animal', '夜行狐'],
] as const;

const worries = [
  ['leave-or-stay', '留下，还是重新开始？', '我不知道该留在稳定的工作，还是重新开始。', 'mist-pine'],
  ['being-left-behind', '总觉得自己落在别人后面', '刷到别人的生活时，我会怀疑自己是不是走得太慢。', 'wandering-deer'],
  ['parents-expectations', '父母的期待和我的生活', '我理解他们的担心，却不知道怎样把自己的选择说清楚。', 'sun-oak'],
  ['friendship-fading', '朋友慢慢走散了', '大家都在长大，可我还不习惯有些关系自然结束。', 'warm-sheep'],
  ['fear-to-start', '想做的事，为什么迟迟不敢开始？', '越在意一件事，越害怕第一步做得不好。', 'night-fox'],
  ['work-without-meaning', '工作稳定，却感受不到意义', '日子按部就班，但我不知道为什么要一直这样继续。', 'quiet-birch'],
  ['love-and-self', '亲密关系里怎样不弄丢自己？', '我想靠近一个人，也想保留自己的边界。', 'warm-sheep'],
  ['city-or-home', '留在大城市，还是回到家乡？', '机会、生活成本和家人，每一样都无法轻易舍弃。', 'wandering-deer'],
  ['information-anxiety', '信息越多，为什么越焦虑？', '我每天看见很多答案，却越来越难听见自己的判断。', 'mist-pine'],
  ['rest-guilt', '休息的时候也会内疚', '只要停下来，我就觉得自己正在被别人超过。', 'quiet-birch'],
] as const;

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${digest}`;
}

async function main() {
  for (const [id, type, name] of assets) {
    await prisma.lifeAsset.upsert({
      where: { id },
      update: {},
      create: {
        id, type, name,
        previewPath: `/town/life/${id}-0.svg`,
        growthStagePaths: [0, 1, 2, 3].map((stage) => `/town/life/${id}-${stage}.svg`),
        growthThresholds: [0, 1, 3, 6],
      },
    });
  }

  for (const [index, [slug, title, body, lifeAssetId]] of worries.entries()) {
    await prisma.worry.upsert({
      where: { slug },
      update: {},
      create: {
        slug, title, body, lifeAssetId, status: 'published',
        placement: { create: { zone: index < 5 ? 'forest' : 'pasture', x: 12 + (index % 5) * 18, y: index < 5 ? 30 + (index % 2) * 24 : 62 + (index % 2) * 16, zIndex: index } },
      },
    });
  }

  const event = await prisma.event.upsert({
    where: { slug: 'first-roadshow' },
    update: {},
    create: { slug: 'first-roadshow', title: '今晚，认真谈一会儿', intro: '从一个真实烦恼开始，听见不同年轻人的生活判断。', status: 'active', eventDate: new Date() },
  });
  const featured = ['leave-or-stay', 'being-left-behind', 'fear-to-start', 'information-anxiety'];
  for (const [position, slug] of featured.entries()) {
    const worry = await prisma.worry.findUniqueOrThrow({ where: { slug } });
    await prisma.eventFeature.upsert({
      where: { eventId_worryId: { eventId: event.id, worryId: worry.id } },
      update: { position },
      create: { eventId: event.id, worryId: worry.id, position },
    });
  }

  const traveler = await prisma.traveler.upsert({
    where: { publicId: 'traveler-evening-wind' }, update: {},
    create: { publicId: 'traveler-evening-wind', pseudonym: '晚风', avatarKey: 'fox', bio: '在路边停下来认真想过一次的人。', status: 'claimed' },
  });
  const firstWorry = await prisma.worry.findUniqueOrThrow({ where: { slug: 'leave-or-stay' } });
  await prisma.viewpoint.upsert({
    where: { idempotencyKey: 'seed-viewpoint-1' }, update: {},
    create: { body: '先走一小步，再观察自己。选择不一定要一次完成。', status: 'published', authorizationConfirmedAt: new Date(), authorizationNote: '演示种子内容', publishedAt: new Date(), idempotencyKey: 'seed-viewpoint-1', worryId: firstWorry.id, travelerId: traveler.id },
  });

  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (password) {
    await prisma.adminUser.upsert({ where: { username: 'curator' }, update: {}, create: { username: 'curator', passwordHash: hashPassword(password) } });
  }
}

main().finally(() => prisma.$disconnect());
