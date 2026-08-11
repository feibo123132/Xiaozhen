import Link from 'next/link';
import { EventHero } from './event-hero';
import { FeaturedWorries } from './featured-worries';

export type HomeEvent = {
  id: string; slug: string; title: string; intro: string; eventDate: Date | null;
  featuredWorries: Array<{
    id: string; slug: string; title: string; publishedViewpointCount: number;
    life: { id: string; name: string; type: string; previewPath: string; growthStage: number; growthPath: string };
  }>;
};

export function HomeScreen({ event }: { event: HomeEvent | null }) {
  if (!event) {
    return (
      <main id="main-content" className="empty-state">
        <span className="eyebrow">歇一会儿</span>
        <h1>小镇正在准备下一次相遇</h1>
        <p>路演还没开始，但林场和牧场里已经留着一些值得慢慢想的问题。</p>
        <Link className="ink-button" href="/town">先逛逛小镇</Link>
      </main>
    );
  }
  return (
    <main id="main-content" className="home-main">
      <EventHero event={event} />
      <FeaturedWorries worries={event.featuredWorries} />
      <section className="manifesto">
        <span className="manifesto-index">为什么做这件事 / 01</span>
        <blockquote>“我们不急着给出标准答案。先把手机里的噪声放远一点，听一个真实的人，怎样理解另一种真实生活。”</blockquote>
      </section>
    </main>
  );
}
