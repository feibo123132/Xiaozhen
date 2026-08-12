import Link from 'next/link';
import type { TownWorry } from './town-scene';

export function WorryListFallback({ worries }: { worries: readonly TownWorry[] }) {
  return (
    <section className="town-list" aria-label="烦恼列表" id="town-list">
      <div className="section-heading">
        <div><span className="eyebrow">地图看不清也没关系</span><h2>按文字慢慢逛</h2></div>
        <p>地图和列表通向同一批公开内容。</p>
      </div>
      <ol>{worries.map((worry, index) => <li key={worry.id}><Link href={`/worries/${worry.slug}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{worry.title}</strong><small>{worry.life.name} · {worry.publishedViewpointCount} 个回应</small></Link></li>)}</ol>
    </section>
  );
}
