export function resolveGrowthAsset(stage: number, paths: string[], previewPath: string) {
  for (let index = Math.min(stage, paths.length - 1); index >= 0; index -= 1) {
    if (paths[index]) return paths[index];
  }
  return previewPath;
}
