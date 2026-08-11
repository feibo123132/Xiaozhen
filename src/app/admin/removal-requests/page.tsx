import { requireAdminPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { RemovalActions } from '@/features/admin/removal-actions';
export const dynamic = 'force-dynamic';
export default async function RemovalRequestsPage() { await requireAdminPage(); const requests = await prisma.removalRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { traveler: true, viewpoint: { include: { worry: true } } } }); return <main id="main-content" className="admin-main"><header><span className="eyebrow">隐私请求</span><h1>把永久删除，当成一件需要认真核对的事</h1></header><section className="admin-records"><h2>请求队列</h2>{requests.map((request) => <article key={request.id}><div><strong>{request.traveler.pseudonym} · {request.viewpoint.worry.title}</strong><span>{request.status} · {request.createdAt.toLocaleString('zh-CN')}</span><p>{request.viewpoint.body}</p></div>{request.status === 'pending' ? <RemovalActions id={request.id} /> : null}</article>)}</section></main>; }
