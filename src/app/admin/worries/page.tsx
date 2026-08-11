import { AdminDraftForm } from '@/features/admin/admin-draft-form';
import { StatusButton } from '@/features/admin/status-button';
import { requireAdminPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export default async function AdminWorriesPage() {
  await requireAdminPage();
  const [worries, assets] = await Promise.all([prisma.worry.findMany({ orderBy: { createdAt: 'desc' }, include: { lifeAsset: true, _count: { select: { viewpoints: true } } } }), prisma.lifeAsset.findMany({ orderBy: { name: 'asc' } })]);
  return <main id="main-content" className="admin-main"><header><span className="eyebrow">烦恼管理</span><h1>先把问题写准确，再邀请别人回答</h1></header><section className="admin-panel"><h2>新烦恼草稿</h2><AdminDraftForm kind="worry" assets={assets.map(({ id, name, type }) => ({ id, name, type }))} /></section><section className="admin-records"><h2>已有烦恼</h2>{worries.map((worry) => <article key={worry.id}><div><strong>{worry.title}</strong><span>{worry.status} · {worry.lifeAsset.name} · {worry._count.viewpoints} 个回答</span></div><div className="record-actions">{worry.status === 'draft' ? <><StatusButton resource="worries" id={worry.id} status="published">发布</StatusButton><StatusButton resource="worries" id={worry.id} status="archived">归档</StatusButton></> : null}{worry.status === 'published' ? <StatusButton resource="worries" id={worry.id} status="archived">归档</StatusButton> : null}</div></article>)}</section></main>;
}
