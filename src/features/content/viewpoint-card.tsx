import Link from 'next/link';

export type PublicViewpoint = {
  id: string;
  body: string;
  publishedAt: Date | null;
  traveler: { publicId: string; pseudonym: string; avatarKey: string };
};

export function ViewpointCard({ viewpoint, index }: { viewpoint: PublicViewpoint; index: number }) {
  return (
    <article className="viewpoint-card">
      <span className="viewpoint-card__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <blockquote>{viewpoint.body}</blockquote>
      <footer>
        <Link href={`/travelers/${viewpoint.traveler.publicId}`} aria-label={`查看旅人 ${viewpoint.traveler.pseudonym} 的主页`}>
          <span className={`traveler-avatar traveler-avatar--${viewpoint.traveler.avatarKey}`} aria-hidden="true">旅</span>
          <span><strong>{viewpoint.traveler.pseudonym}</strong><small>虚拟旅人</small></span>
        </Link>
        {viewpoint.publishedAt ? <time dateTime={viewpoint.publishedAt.toISOString()}>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(viewpoint.publishedAt)}</time> : null}
      </footer>
    </article>
  );
}
