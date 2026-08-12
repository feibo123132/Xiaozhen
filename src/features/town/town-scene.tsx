import manifestJson from '../../../public/town/pixel/v2/manifest.json';
import { parseTownAssetManifest } from './asset-manifest';
import { TownExperience } from './town-experience';
import { adaptTownWorries, type TownWorryDto } from './world-adapter';
import { WorryListFallback } from './worry-list-fallback';
export { resolveGrowthAsset } from './resolve-growth-asset';

export type TownWorry = TownWorryDto & { life: TownWorryDto['life'] & { name: string } };

export function TownScene({ worries }: { worries: TownWorry[] }) {
  const adapted = adaptTownWorries(worries, parseTownAssetManifest(manifestJson));
  return (
    <>
      <TownExperience world={adapted.world} worries={worries} />
      <WorryListFallback worries={worries} />
    </>
  );
}
