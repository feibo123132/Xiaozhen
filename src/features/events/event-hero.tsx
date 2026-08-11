import Link from 'next/link';
import type { HomeEvent } from './home-screen';

export function EventHero({ event }: { event: HomeEvent }) {
  return (
    <section className="event-hero" aria-labelledby="event-title">
      <div className="hero-copy">
        <span className="eyebrow">本场路演 · 今日开放</span>
        <h1 id="event-title">{event.title}</h1>
        <p>{event.intro}</p>
        <div className="hero-actions">
          <a className="ink-button" href="#featured-worries">看看本场问题</a>
          <Link className="text-link" href="/town">进入完整小镇</Link>
        </div>
      </div>
      <div className="hero-illustration" aria-hidden="true">
        <span className="moon">11</span><span className="hill hill-back" /><span className="hill hill-front" />
        <span className="tree tree-one">♠</span><span className="tree tree-two">♠</span>
        <span className="guitar">𝄞</span><span className="camp-light" />
      </div>
    </section>
  );
}
