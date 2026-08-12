import { z } from 'zod';

const LIFE_IDS = [
  'mist-pine',
  'sun-oak',
  'quiet-birch',
  'wandering-deer',
  'warm-sheep',
  'night-fox',
] as const;

const rectSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
}).strict();

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
}).strict();

const hitAreaSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().finite(),
  height: z.number().positive().finite(),
}).strict();

const atlasSchema = z.object({
  imagePath: z.string().startsWith('/town/pixel/v2/'),
  dataPath: z.string().startsWith('/town/pixel/v2/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  frames: z.record(z.string().min(1), rectSchema),
}).strict();

const frameReferenceSchema = z.object({
  atlas: z.string().min(1),
  frame: z.string().min(1),
}).strict();

const idleSchema = z.object({
  frames: z.array(z.string().min(1)).min(1),
  frameMs: z.number().int().positive(),
  pauseMs: z.number().int().nonnegative(),
}).strict();

const stageSchema = z.object({
  stage: z.number().int().min(0).max(3),
  atlas: z.string().min(1),
  frame: z.string().min(1),
  anchor: pointSchema,
  hitArea: hitAreaSchema,
  idle: idleSchema,
  reducedMotionFrame: z.string().min(1),
}).strict();

const lifeSchema = z.object({
  id: z.enum(LIFE_IDS),
  kind: z.enum(['tree', 'animal']),
  stages: z.array(stageSchema).length(4),
}).strict();

const sceneSchema = z.object({
  distantMountains: frameReferenceSchema,
  forestTerrain: frameReferenceSchema,
  centralTerrain: frameReferenceSchema,
  pastureTerrain: frameReferenceSchema,
  waystation: frameReferenceSchema,
  bridge: frameReferenceSchema,
  noticeBoard: frameReferenceSchema,
}).strict();

const townAssetManifestBaseSchema = z.object({
  schemaVersion: z.literal(2),
  posterPath: z.string().startsWith('/town/pixel/v2/'),
  atlases: z.record(z.string().min(1), atlasSchema),
  scene: sceneSchema,
  lives: z.array(lifeSchema).length(LIFE_IDS.length),
}).strict();

export type AtlasFrame = z.infer<typeof rectSchema>;
export type TownAtlas = z.infer<typeof atlasSchema>;
export type TownLifeStage = z.infer<typeof stageSchema>;
export type TownLife = z.infer<typeof lifeSchema>;
export type TownAssetManifest = z.infer<typeof townAssetManifestBaseSchema>;
export type TownLifeId = (typeof LIFE_IDS)[number];

function assertFrameReference(
  manifest: TownAssetManifest,
  reference: { atlas: string; frame: string },
  label: string,
): void {
  const atlas = manifest.atlases[reference.atlas];
  if (!atlas) {
    throw new Error(`${label} references missing atlas: ${reference.atlas}`);
  }
  if (!atlas.frames[reference.frame]) {
    throw new Error(`${label} references missing frame: ${reference.frame}`);
  }
}

function validateManifestReferences(manifest: TownAssetManifest): void {
  for (const [atlasId, atlas] of Object.entries(manifest.atlases)) {
    for (const [frameId, frame] of Object.entries(atlas.frames)) {
      if (
        frame.x + frame.width > atlas.width ||
        frame.y + frame.height > atlas.height
      ) {
        throw new Error(`frame ${atlasId}.${frameId} is outside its atlas bounds`);
      }
    }
  }

  for (const [slot, reference] of Object.entries(manifest.scene)) {
    assertFrameReference(manifest, reference, `scene.${slot}`);
  }

  const lifeIds = new Set(manifest.lives.map(({ id }) => id));
  if (lifeIds.size !== LIFE_IDS.length || LIFE_IDS.some((id) => !lifeIds.has(id))) {
    throw new Error(`lives must contain exactly: ${LIFE_IDS.join(', ')}`);
  }

  for (const life of manifest.lives) {
    const stageNumbers = life.stages.map(({ stage }) => stage).sort();
    if (!stageNumbers.every((stage, index) => stage === index)) {
      throw new Error(`${life.id} must contain stages 0 through 3 exactly once`);
    }

    for (const stage of life.stages) {
      const frame = manifest.atlases[stage.atlas]?.frames[stage.frame];
      if (frame) {
        if (
          stage.anchor.x < 0 ||
          stage.anchor.y < 0 ||
          stage.anchor.x > frame.width ||
          stage.anchor.y > frame.height
        ) {
          throw new Error(
            `${life.id} stage ${stage.stage} anchor must use local coordinates inside ${stage.frame}`,
          );
        }
        if (
          stage.hitArea.x < 0 ||
          stage.hitArea.y < 0 ||
          stage.hitArea.x + stage.hitArea.width > frame.width ||
          stage.hitArea.y + stage.hitArea.height > frame.height
        ) {
          throw new Error(
            `${life.id} stage ${stage.stage} hitArea must use local coordinates inside ${stage.frame}`,
          );
        }
      }

      for (const frame of [
        stage.frame,
        ...stage.idle.frames,
        stage.reducedMotionFrame,
      ]) {
        assertFrameReference(
          manifest,
          { atlas: stage.atlas, frame },
          `${life.id} stage ${stage.stage}`,
        );
      }
    }
  }
}

export function parseTownAssetManifest(input: unknown): TownAssetManifest {
  const manifest = townAssetManifestBaseSchema.parse(input);
  validateManifestReferences(manifest);
  return manifest;
}

export type ResolveLifeStageOptions = {
  lifeId: string;
  requestedStage: number;
  previewPath: string;
};

export type ResolvedLifeStage =
  | {
      source: 'manifest';
      lifeId: string;
      requestedStage: number;
      resolvedStage: number;
      stage: TownLifeStage;
    }
  | {
      source: 'preview';
      lifeId: string;
      requestedStage: number;
      resolvedStage: null;
      previewPath: string;
    };

function normalizeStage(stage: number): number {
  if (!Number.isFinite(stage)) return 0;
  return Math.min(3, Math.max(0, Math.floor(stage)));
}

function isCompleteStage(
  manifest: TownAssetManifest,
  stage: TownLifeStage | undefined,
): stage is TownLifeStage {
  if (!stage) return false;
  const atlas = manifest.atlases[stage.atlas];
  if (!atlas) return false;
  return [stage.frame, ...stage.idle.frames, stage.reducedMotionFrame].every(
    (frame) => Boolean(atlas.frames[frame]),
  );
}

/**
 * Selects the requested life stage, searching toward stage zero when a stage is
 * incomplete. Unknown life IDs and manifests without a complete stage retain
 * the pre-v2 preview asset, so an incremental art rollout never removes a life.
 */
export function resolveLifeStage(
  manifest: TownAssetManifest,
  options: ResolveLifeStageOptions,
): ResolvedLifeStage {
  if (!options.previewPath.trim()) {
    throw new Error('previewPath is required for the manifest fallback contract');
  }

  const requestedStage = normalizeStage(options.requestedStage);
  const life = manifest.lives.find(({ id }) => id === options.lifeId);

  for (let stageNumber = requestedStage; stageNumber >= 0; stageNumber -= 1) {
    const stage = life?.stages.find((candidate) => candidate.stage === stageNumber);
    if (isCompleteStage(manifest, stage)) {
      return {
        source: 'manifest',
        lifeId: options.lifeId,
        requestedStage,
        resolvedStage: stageNumber,
        stage,
      };
    }
  }

  return {
    source: 'preview',
    lifeId: options.lifeId,
    requestedStage,
    resolvedStage: null,
    previewPath: options.previewPath,
  };
}
