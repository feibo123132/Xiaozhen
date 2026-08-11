import Image from 'next/image';
import Link from 'next/link';

import type { TownWorry } from './town-scene';

export function LifeHotspot({ worry }: { worry: TownWorry }) {
  if (!worry.placement) return null;
  return (
    <Link
      className={`life-hotspot life-hotspot--${worry.life.type}`}
      href={`/worries/${worry.slug}`}
      aria-label={`${worry.title}，${worry.life.name}，已有 ${worry.publishedViewpointCount} 个回应`}
      style={{ left: `${worry.placement.x}%`, top: `${worry.placement.y}%`, zIndex: worry.placement.zIndex + 2 }}
    >
      <span className="life-hotspot__halo" aria-hidden="true" />
      <Image src={worry.life.growthPath} alt="" width={118} height={118} priority={worry.placement.zIndex < 4} />
      <span className="life-hotspot__label">{worry.title}</span>
    </Link>
  );
}
