import { render, screen } from '@testing-library/react';

import { WorryDetail, type PublicWorryDetail } from '@/features/content/worry-detail';

const worry: PublicWorryDetail = {
  id: 'worry-1', slug: 'leave-or-stay', title: '留下，还是重新开始？', body: '稳定与未知之间，我不知道怎样选择。',
  background: null, sensitive: true, publishedViewpointCount: 1, growthStage: 1,
  placement: { id: 'placement-1', worryId: 'worry-1', zone: 'forest', x: 20, y: 30, zIndex: 1 },
  life: { id: 'mist-pine', name: '雾松', type: 'tree', previewPath: '/town/life/mist-pine-0.svg', growthStage: 1, growthPath: '/town/life/mist-pine-1.svg' },
  viewpoints: [{ id: 'vp-1', body: '先走一小步，再观察自己。', publishedAt: new Date('2026-08-11'), traveler: { publicId: 'traveler-wind', pseudonym: '晚风', avatarKey: 'fox' } }],
};

it('shows growth as attention rather than a solved problem and links the virtual author', () => {
  render(<WorryDetail worry={worry} crisisNotice="若你正处于危险中，请联系当地紧急援助。" />);
  expect(screen.getByRole('heading', { name: worry.title })).toBeInTheDocument();
  expect(screen.getByText(/被 1 个回答认真看见/)).toBeInTheDocument();
  expect(screen.queryByText(/治愈|解决/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /晚风/ })).toHaveAttribute('href', '/travelers/traveler-wind');
  expect(screen.getByRole('note')).toHaveTextContent('当地紧急援助');
});

it('renders only the viewpoints supplied by the public repository', () => {
  render(<WorryDetail worry={worry} />);
  expect(screen.getByText('先走一小步，再观察自己。')).toBeInTheDocument();
  expect(screen.queryByText('这条不应公开。')).not.toBeInTheDocument();
});
