import { render, screen } from '@testing-library/react';
import { HomeScreen, type HomeEvent } from './home-screen';

const event: HomeEvent = {
  id: 'event-1',
  slug: 'first-roadshow',
  title: '今晚，认真谈一会儿',
  intro: '从一个真实烦恼开始。',
  eventDate: new Date('2026-08-11T12:00:00.000Z'),
  featuredWorries: [
    {
      id: 'worry-1', slug: 'leave-or-stay', title: '留下，还是重新开始？', publishedViewpointCount: 3,
      life: { id: 'mist-pine', name: '雾松', type: 'tree', previewPath: '/tree.svg', growthStage: 2, growthPath: '/tree-2.svg' },
    },
  ],
};

it('shows the active event and featured worries', () => {
  render(<HomeScreen event={event} />);
  expect(screen.getByRole('heading', { name: '今晚，认真谈一会儿' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /留下，还是重新开始/ })).toHaveAttribute('href', '/worries/leave-or-stay');
  expect(screen.getByRole('link', { name: '进入完整小镇' })).toHaveAttribute('href', '/town');
});

it('offers the full town when no event is active', () => {
  render(<HomeScreen event={null} />);
  expect(screen.getByRole('heading', { name: '小镇正在准备下一次相遇' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '先逛逛小镇' })).toHaveAttribute('href', '/town');
});
