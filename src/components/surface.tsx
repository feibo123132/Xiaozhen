import { createElement, type ComponentPropsWithoutRef, type ReactNode } from 'react';

type HtmlElementName = Extract<keyof HTMLElementTagNameMap, keyof React.JSX.IntrinsicElements>;

export type SurfaceProps<T extends HtmlElementName = 'section'> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Surface<T extends HtmlElementName = 'section'>({ as, children, className = '', ...props }: SurfaceProps<T>) {
  const element = as ?? 'section';
  return createElement(element, { ...props, className: `paper-surface ${className}`.trim() }, children);
}
