import { AdminDraftForm } from '@/features/admin/admin-draft-form';
import { StatusButton } from '@/features/admin/status-button';
import { requireAdminPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export default async function AdminEventsPage() {
  await requireAdminPage();
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { features: true } } } });
  return <main id="main-content" className="admin-main"><header><span className="eyebrow">活动管理</span><h1>让一次相遇有清楚的开场</h1></header><section className="admin-panel"><h2>新活动草稿</h2><AdminDraftForm kind="event" /></section><section className="admin-records"><h2>已有活动</h2>{events.map((event) => <article key={event.id}><div><strong>{event.title}</strong><span>{event.status} · {event._count.features} 个精选</span></div><div className="record-actions">{event.status === 'draft' ? <><StatusButton resource="events" id={event.id} status="active">启用</StatusButton><StatusButton resource="events" id={event.id} status="archived">归档</StatusButton></> : null}{event.status === 'active' ? <StatusButton resource="events" id={event.id} status="ended">结束</StatusButton> : null}{event.status === 'ended' ? <StatusButton resource="events" id={event.id} status="archived">归档</StatusButton> : null}</div></article>)}</section></main>;
}
