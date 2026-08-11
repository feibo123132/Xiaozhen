import { render, screen } from '@testing-library/react';
import { SiteHeader } from './site-header';

it('offers the three primary journeys', () => {
  render(<SiteHeader />);
  expect(screen.getByRole('link', { name: '跳到正文' })).toHaveAttribute('href', '#main-content');
  expect(screen.getByRole('link', { name: '本场问题' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: '完整小镇' })).toHaveAttribute('href', '/town');
  expect(screen.getByRole('link', { name: '我的旅人' })).toHaveAttribute('href', '/login');
});
