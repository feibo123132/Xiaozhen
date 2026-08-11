import { notFound } from 'next/navigation';
import { hashAccountToken } from '@/features/auth/account-token';
import { ClaimForm } from '@/features/travelers/claim-form';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; const record = await prisma.accountToken.findUnique({ where: { tokenHash: hashAccountToken(token) }, include: { traveler: true } }); if (!record) notFound(); const valid = record.status === 'active' && !record.consumedAt && record.expiresAt > new Date(); return <main id="main-content" className="claim-page"><span className="eyebrow">一次性旅人通行证</span><h1>{record.purpose === 'credential_recovery' ? '重新找回旅途' : `你好，${record.traveler.pseudonym}`}</h1>{valid ? <><p>确认这个虚拟身份属于你，然后设置只有你知道的长期密码。</p><ClaimForm token={token} purpose={record.purpose} /></> : <p className="quiet-empty">这张旅人证已经使用或过期，请联系主理人重新生成同用途链接。</p>}</main>; }
