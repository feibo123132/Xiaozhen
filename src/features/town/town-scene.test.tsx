import { render, screen, within } from '@testing-library/react';

import { TownScene, resolveGrowthAsset, type TownWorry } from './town-scene';

const worries: TownWorry[] = [
  { id: 'worry-1', slug: 'leave', title: '留下吗', publishedViewpointCount: 2, placement: { zone: 'forest', x: 25, y: 50, zIndex: 1, layoutVersion: 1 }, life: { id: 'mist-pine', name: '雾松', type: 'tree', growthStage: 2, growthPath: '/pine.svg', previewPath: '/pine.svg' } },
  { id: 'worry-2', slug: 'rest', title: '休息吗', publishedViewpointCount: 0, placement: null, life: { id: 'warm-sheep', name: '暖绒羊', type: 'animal', growthStage: 0, growthPath: '/sheep.svg', previewPath: '/sheep.svg' } },
];

it('renders the server-first poster and retains every worry in the fallback list', () => {
  render(<TownScene worries={worries} />);
  expect(screen.getByAltText('解忧小镇地图预览')).toHaveAttribute('src', expect.stringContaining('poster.png'));
  const list = screen.getByRole('region', { name: '烦恼列表' });
  expect(within(list).getByRole('link', { name: /留下吗/ })).toBeInTheDocument();
  expect(within(list).getByRole('link', { name: /休息吗/ })).toBeInTheDocument();
});

it('uses the nearest available stage asset instead of hiding a worry', () => {
  expect(resolveGrowthAsset(3, ['/life-0.svg', '', '/life-2.svg'], '/preview.svg')).toBe('/life-2.svg');
});
