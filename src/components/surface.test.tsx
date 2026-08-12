import { render, screen } from '@testing-library/react';

import { Surface } from './surface';

it('renders a section by default and preserves class names', () => {
  render(<Surface className="custom">Town</Surface>);

  expect(screen.getByText('Town').tagName).toBe('SECTION');
  expect(screen.getByText('Town')).toHaveClass('paper-surface', 'custom');
});

it('preserves attributes for the selected HTML element', () => {
  render(
    <>
      <Surface as="a" href="/town">Town link</Surface>
      <Surface as="button" type="button" disabled>Town button</Surface>
    </>,
  );

  expect(screen.getByRole('link')).toHaveAttribute('href', '/town');
  expect(screen.getByRole('button')).toBeDisabled();
});

// Compile-time contract: element-specific DOM attributes remain available.
void <Surface as="a" href="/town">link</Surface>;
void <Surface as="button" type="submit" disabled>button</Surface>;

// @ts-expect-error Pixi JSX tags are not valid DOM surfaces.
void <Surface as="pixiContainer">pixi</Surface>;

