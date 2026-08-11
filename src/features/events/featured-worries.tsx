import Image from 'next/image';
import Link from 'next/link';
import type { HomeEvent } from './home-screen';

export function FeaturedWorries({ worries }: { worries: HomeEvent['featuredWorries'] }) {
  return (
    <section id="featured-worries" className="featured-section" aria-labelledby="featured-title">
      <div className="section-heading">
        <div><span className="eyebrow">今夜被点亮的生命</span><h2 id="featured-title">选一个，让我们认真谈谈</h2></div>
        <Link className="text-link" href="/town">浏览全部烦恼</Link>
      </div>
      <div className="worry-grid">
        {worries.map((worry, index) => (
          <Link className="worry-card" href={`/worries/${worry.slug}`} key={worry.id}>
            <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
            <div className="life-portrait"><Image src={worry.life.growthPath} alt={worry.life.name} width={150} height={150} unoptimized /></div>
            <div className="card-copy">
              <span>{worry.life.name} · 阶段 {worry.life.growthStage + 1}</span>
              <h3>{worry.title}</h3>
              <p>{worry.publishedViewpointCount > 0 ? `${worry.publishedViewpointCount} 位旅人来过这里` : '等待第一位旅人'}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
