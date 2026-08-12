'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ensureWorldPointVisible, worldToScreen, type CameraState } from './camera-controller';
import type { TownWorry } from './town-scene';
import type { TownWorldModel } from './world-model';
import styles from './town-experience.module.css';

export function InteractionOverlay({ world, worries, camera, onCameraChange }: { world: TownWorldModel; worries: readonly TownWorry[]; camera: CameraState; onCameraChange(camera: CameraState): void }) {
  const [active, setActive] = useState<string | null>(null);
  return <div className={styles.overlay}>{world.lives.map((life) => {
    const worry = worries.find(({ id }) => id === life.worryId);
    if (!worry) return null;
    const point = worldToScreen(camera, life);
    const open = active === life.worryId;
    return <div key={life.worryId} className={styles.hotspotWrap} style={{ left: point.x, top: point.y }}>
      <Link className={styles.hotspot} href={`/worries/${life.slug}`} aria-label={`${life.title}，${worry.life.name}，${life.responseCount} 个回应`}
        onFocus={() => { setActive(life.worryId); onCameraChange(ensureWorldPointVisible(camera, life, 72)); }} onMouseEnter={() => setActive(life.worryId)}
        onMouseLeave={() => setActive(null)} onBlur={() => setActive(null)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setActive(null); } }}
        ><span aria-hidden="true" /></Link>
      {open ? <article className={styles.card}><strong>{life.title}</strong><span>{worry.life.name}</span><small>成长阶段 {life.growthStage + 1} · {life.responseCount} 个回应</small></article> : null}
    </div>;
  })}</div>;
}
