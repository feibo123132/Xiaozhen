import { render, screen } from '@testing-library/react';

import { PublicProfile, type PublicTraveler } from '@/features/travelers/public-profile';

const traveler: PublicTraveler = {
  publicId: 'traveler-wind', pseudonym: '晚风', avatarKey: 'fox', bio: '愿意停下来认真想一会儿。',
  viewpoints: [{ id: 'vp-1', body: '先走一小步，再观察自己。', publishedAt: new Date('2026-08-11'), worry: { slug: 'leave-or-stay', title: '留下，还是重新开始？' } }],
};

it('shows only pseudonymous profile fields and published footprints', () => {
  render(<PublicProfile traveler={traveler} />);
  expect(screen.getByRole('heading', { name: '晚风' })).toBeInTheDocument();
  expect(screen.getByText('愿意停下来认真想一会儿。')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /留下，还是重新开始/ })).toHaveAttribute('href', '/worries/leave-or-stay');
  expect(screen.queryByText(/手机号|真实姓名/)).not.toBeInTheDocument();
});

it('keeps an empty public footprint gentle and useful', () => {
  render(<PublicProfile traveler={{ ...traveler, viewpoints: [] }} />);
  expect(screen.getByText(/还没有公开的思考足迹/)).toBeInTheDocument();
});
