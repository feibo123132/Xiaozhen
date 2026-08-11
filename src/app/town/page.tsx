import { createPublicRepository } from '@/features/content/public-repository';
import { TownScene } from '@/features/town/town-scene';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TownPage() {
  const worries = await createPublicRepository(prisma).getTownWorries();
  return (
    <main id="main-content" className="town-page">
      <header className="town-intro">
        <span className="eyebrow">一张可以慢慢展开的画卷</span>
        <h1>每个烦恼，<br />都在这里有了生命</h1>
        <p>拖动画卷，走过林场与牧场。点击一棵树或一只动物，听见它背后的真实问题与不同回答。</p>
      </header>
      {worries.length ? <TownScene worries={worries} /> : <p className="empty-town">小镇还在播种，晚些再来看看。</p>}
    </main>
  );
}
