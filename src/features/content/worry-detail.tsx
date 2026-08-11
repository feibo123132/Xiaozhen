import Image from 'next/image';
import Link from 'next/link';

import { ViewpointCard, type PublicViewpoint } from './viewpoint-card';

export type PublicWorryDetail = {
  id: string; slug: string; title: string; body: string; background: string | null; sensitive: boolean;
  publishedViewpointCount: number; growthStage: number;
  placement: { id: string; worryId: string; zone: string; x: number; y: number; zIndex: number } | null;
  life: { id: string; name: string; type: string; previewPath: string; growthStage: number; growthPath: string };
  viewpoints: PublicViewpoint[];
};

const STAGE_NAMES = ['刚刚被种下', '开始舒展', '长出新的枝叶', '在回应里丰盛'];

export function WorryDetail({ worry, crisisNotice }: { worry: PublicWorryDetail; crisisNotice?: string }) {
  return (
    <main id="main-content" className="story-page">
      <Link className="back-link" href="/town">← 回到小镇</Link>
      <header className="story-hero">
        <div className="story-life">
          <span>{worry.life.type === 'tree' ? '林场来信' : '牧场来信'}</span>
          <Image src={worry.life.growthPath} alt={`${worry.life.name}，成长阶段 ${worry.growthStage + 1}`} width={360} height={360} priority />
          <strong>{worry.life.name}</strong>
        </div>
        <div className="story-heading">
          <span className="eyebrow">一个真实烦恼</span>
          <h1>{worry.title}</h1>
          <p>{worry.body}</p>
          <div className="growth-note"><span>阶段 {worry.growthStage + 1}</span><strong>{STAGE_NAMES[worry.growthStage] ?? '继续生长'}</strong><small>被 {worry.publishedViewpointCount} 个回答认真看见</small></div>
        </div>
      </header>
      {worry.background ? <section className="story-background"><span>主理人手记</span><p>{worry.background}</p></section> : null}
      {worry.sensitive && crisisNotice ? <aside className="crisis-note" role="note"><strong>请优先照顾此刻的安全</strong><p>{crisisNotice}</p></aside> : null}
      <section className="viewpoints-section">
        <div className="section-heading"><div><span className="eyebrow">来自路演现场</span><h2>不同的人，怎样理解它</h2></div><p>{worry.publishedViewpointCount} 份公开回答</p></div>
        {worry.viewpoints.length ? <div className="viewpoint-grid">{worry.viewpoints.map((viewpoint, index) => <ViewpointCard key={viewpoint.id} viewpoint={viewpoint} index={index} />)}</div> : <p className="quiet-empty">这份烦恼正在等第一个认真回答。</p>}
      </section>
    </main>
  );
}
