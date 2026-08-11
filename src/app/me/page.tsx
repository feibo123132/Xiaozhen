import { ProfileForm } from '@/features/travelers/profile-form';
import { ViewpointActions } from '@/features/travelers/viewpoint-actions';
import { requireTravelerPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function MePage() { const traveler = await requireTravelerPage(); const viewpoints = await prisma.viewpoint.findMany({ where: { travelerId: traveler.id, status: { in: ['published', 'hidden'] } }, include: { worry: true }, orderBy: { createdAt: 'desc' } }); return <main id="main-content" className="my-page"><header><span className="eyebrow">我的旅人 · {traveler.publicId}</span><h1>{traveler.pseudonym}</h1><p>你可以维护虚拟资料、隐藏自己的观点或提出永久删除申请；观点文字只能联系主理人核对。</p></header><section className="admin-panel"><h2>虚拟资料</h2><ProfileForm traveler={traveler} /></section><section className="my-footprints"><h2>我的观点</h2>{viewpoints.map((viewpoint) => <article key={viewpoint.id}><div><strong>{viewpoint.worry.title}</strong><span>{viewpoint.status === 'published' ? '公开中' : '已隐藏'}</span><p>{viewpoint.body}</p></div><ViewpointActions id={viewpoint.id} status={viewpoint.status} /></article>)}</section></main>; }
