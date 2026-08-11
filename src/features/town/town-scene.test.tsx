import { render, screen, within } from '@testing-library/react';

import { TownScene, resolveGrowthAsset, type TownWorry } from './town-scene';

const worries: TownWorry[] = [
  {
    id: 'worry-1', slug: 'leave-or-stay', title: '留下，还是重新开始？', publishedViewpointCount: 2,
    placement: { zone: 'forest', x: 25, y: 36, zIndex: 1 },
    life: { id: 'mist-pine', name: '雾松', type: 'tree', growthStage: 2, growthPath: '/town/life/mist-pine-2.svg', previewPath: '/town/life/mist-pine-0.svg' },
  },
  {
    id: 'worry-2', slug: 'rest-guilt', title: '休息的时候也会内疚', publishedViewpointCount: 0,
    placement: { zone: 'pasture', x: 68, y: 70, zIndex: 2 },
    life: { id: 'warm-sheep', name: '暖绒羊', type: 'animal', growthStage: 0, growthPath: '/town/life/warm-sheep-0.svg', previewPath: '/town/life/warm-sheep-0.svg' },
  },
];

it('exposes both regions and the same worries as links in the scene and fallback list', () => {
  render(<TownScene worries={worries} />);

  expect(screen.getByRole('region', { name: '林场' })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: '牧场' })).toBeInTheDocument();
  const map = screen.getByLabelText('解忧小镇地图');
  const list = screen.getByRole('region', { name: '烦恼列表' });
  for (const worry of worries) {
    expect(within(map).getByRole('link', { name: new RegExp(worry.title) })).toHaveAttribute('href', `/worries/${worry.slug}`);
    expect(within(list).getByRole('link', { name: new RegExp(worry.title) })).toHaveAttribute('href', `/worries/${worry.slug}`);
  }
});

it('uses the nearest available stage asset instead of hiding a worry', () => {
  expect(resolveGrowthAsset(3, ['/life-0.svg', '', '/life-2.svg'], '/preview.svg')).toBe('/life-2.svg');
  expect(resolveGrowthAsset(2, [], '/preview.svg')).toBe('/preview.svg');
});
