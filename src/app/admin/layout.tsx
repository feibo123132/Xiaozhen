import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-shell"><header className="admin-header"><Link href="/admin"><strong>解忧小镇 · 主理台</strong></Link><nav aria-label="后台导航"><Link href="/admin/events">活动</Link><Link href="/admin/worries">烦恼</Link><Link href="/admin/map">地图</Link><Link href="/admin/travelers">旅人</Link><Link href="/admin/viewpoints">观点</Link><Link href="/admin/removal-requests">隐私</Link><Link href="/town">查看小镇 ↗</Link></nav></header>{children}</div>;
}
