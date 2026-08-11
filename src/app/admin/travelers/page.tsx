import { TravelerForm } from '@/features/admin/traveler-form';
import { requireAdminPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
import { ClaimCard } from './[id]/claim-card';
export const dynamic = 'force-dynamic';
export default async function AdminTravelersPage() { await requireAdminPage(); const travelers = await prisma.traveler.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { viewpoints: true } } } }); return <main id="main-content" className="admin-main"><header><span className="eyebrow">旅人管理</span><h1>给一段真实回答，一个不暴露现实身份的名字</h1></header><section className="admin-panel"><h2>创建虚拟旅人</h2><TravelerForm /></section><section className="admin-records"><h2>旅人册</h2>{travelers.map((traveler) => <article key={traveler.id}><div><strong>{traveler.pseudonym}</strong><span>{traveler.publicId} · {traveler.status} · {traveler._count.viewpoints} 条足迹</span></div><ClaimCard travelerId={traveler.id} claimed={traveler.status === 'claimed'} /></article>)}</section></main>; }
