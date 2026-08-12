import type { TownZone, WORLD_SIZE } from './town-layout';

export type TownWorldLife = {
  worryId: string;
  slug: string;
  title: string;
  responseCount: number;
  zone: TownZone;
  x: number;
  y: number;
  depthOffset: number;
  assetId: string;
  growthStage: number;
};

export type TownWorldModel = {
  layoutVersion: 2;
  width: typeof WORLD_SIZE.width;
  height: typeof WORLD_SIZE.height;
  lives: readonly TownWorldLife[];
};

export type TownCameraView = {
  x: number;
  y: number;
  scale: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type TownPublicEvent =
  | { type: 'life:activate'; lifeId: string }
  | { type: 'camera:change'; view: TownCameraView };

export type TownEditorEvent =
  | { type: 'life:select'; lifeId: string | null }
  | {
      type: 'life:move';
      lifeId: string;
      zone: TownZone;
      normalized: { x: number; y: number };
    }
  | { type: 'camera:change'; view: TownCameraView };
