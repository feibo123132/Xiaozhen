import Link from 'next/link';

import { requireAdminPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const admin = await requireAdminPage();
  const [events, worries, travelers, viewpoints] = await Promise.all([prisma.event.count(), prisma.worry.count(), prisma.traveler.count(), prisma.viewpoint.count({ where: { status: 'published' } })]);
  return <main id="main-content" className="admin-main"><header><span className="eyebrow">欢迎回来，{admin.username}</span><h1>今天，要把哪件事认真留下？</h1></header><section className="admin-stats"><div><strong>{events}</strong><span>场活动</span></div><div><strong>{worries}</strong><span>个烦恼</span></div><div><strong>{travelers}</strong><span>位旅人</span></div><div><strong>{viewpoints}</strong><span>条公开回答</span></div></section><section className="admin-entry-grid"><Link href="/admin/events"><small>01</small><strong>安排活动</strong><span>建立草稿、启用或结束一场路演</span></Link><Link href="/admin/worries"><small>02</small><strong>整理烦恼</strong><span>写下问题，并挑选它的树或动物</span></Link></section></main>;
}
