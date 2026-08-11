import Link from 'next/link';

export type PublicTraveler = {
  publicId: string; pseudonym: string; avatarKey: string; bio: string | null;
  viewpoints: Array<{ id: string; body: string; publishedAt: Date | null; worry: { slug: string; title: string } }>;
};

export function PublicProfile({ traveler }: { traveler: PublicTraveler }) {
  return (
    <main id="main-content" className="traveler-page">
      <Link className="back-link" href="/town">← 回到小镇</Link>
      <header className="traveler-hero">
        <div className={`traveler-seal traveler-avatar--${traveler.avatarKey}`} aria-hidden="true"><span>旅</span></div>
        <div><span className="eyebrow">虚拟旅人 · {traveler.publicId}</span><h1>{traveler.pseudonym}</h1><p>{traveler.bio ?? '一位愿意把思考留在小镇的旅人。'}</p></div>
      </header>
      <section className="footprints">
        <div className="section-heading"><div><span className="eyebrow">思考足迹</span><h2>Ta 曾认真回应过</h2></div><p>{traveler.viewpoints.length} 次停留</p></div>
        {traveler.viewpoints.length ? <ol>{traveler.viewpoints.map((viewpoint, index) => <li key={viewpoint.id}><span>{String(index + 1).padStart(2, '0')}</span><div><blockquote>{viewpoint.body}</blockquote><Link href={`/worries/${viewpoint.worry.slug}`}>回到烦恼：{viewpoint.worry.title} →</Link></div></li>)}</ol> : <p className="quiet-empty">这里还没有公开的思考足迹。</p>}
      </section>
    </main>
  );
}
