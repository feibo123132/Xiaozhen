import { AssetPicker } from '@/features/admin/asset-picker';
import { FeaturedEditor } from '@/features/admin/featured-editor';
import { MapEditor } from '@/features/admin/map-editor';
import { requireAdminPage } from '@/features/auth/guards';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function AdminMapPage() { await requireAdminPage(); const [worries, assets, events] = await Promise.all([prisma.worry.findMany({ where: { status: 'published' }, include: { placement: true }, orderBy: { createdAt: 'asc' } }), prisma.lifeAsset.findMany({ orderBy: { name: 'asc' } }), prisma.event.findMany({ where: { status: { in: ['draft', 'active'] } }, orderBy: { createdAt: 'desc' } })]); return <main id="main-content" className="admin-main"><header><span className="eyebrow">地图策展</span><h1>为每个问题，找一块可以生长的地方</h1></header><MapEditor worries={worries.map(({ id, title, lifeAssetId, placement }) => ({ id, title, lifeAssetId, placement }))} assets={assets} /><FeaturedEditor events={events} worries={worries} /><AssetPicker assets={assets} /></main>; }
