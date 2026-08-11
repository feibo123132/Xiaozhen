import Image from 'next/image';

import { LifeHotspot } from './life-hotspot';
import { TownViewport } from './town-viewport';
import { WorryListFallback } from './worry-list-fallback';
export { resolveGrowthAsset } from './resolve-growth-asset';

export type TownWorry = {
  id: string;
  slug: string;
  title: string;
  publishedViewpointCount: number;
  placement: { zone: string; x: number; y: number; zIndex: number } | null;
  life: {
    id: string; name: string; type: string; previewPath: string; growthStage: number; growthPath: string;
  };
};

export function TownScene({ worries }: { worries: TownWorry[] }) {
  const placed = worries.filter((worry) => worry.placement);
  return (
    <>
      <TownViewport>
        <Image className="town-map-art" src="/town/town-map.svg" alt="" width={1600} height={900} priority />
        <section className="map-zone map-zone--forest" aria-label="林场"><h2>林场</h2></section>
        <section className="map-zone map-zone--pasture" aria-label="牧场"><h2>牧场</h2></section>
        {placed.map((worry) => <LifeHotspot key={worry.id} worry={worry} />)}
      </TownViewport>
      <WorryListFallback worries={worries} />
    </>
  );
}
