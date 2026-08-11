import type { PropsWithChildren } from 'react';

export function FocusLink({ children }: PropsWithChildren) {
  return <a className="skip-link" href="#main-content">{children}</a>;
}
