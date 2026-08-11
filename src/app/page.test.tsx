import { render, screen } from '@testing-library/react';
import { HomeScreen } from '@/features/events/home-screen';

it('introduces the town when no event is active', () => {
  render(<HomeScreen event={null} />);
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '先逛逛小镇' })).toBeInTheDocument();
});
