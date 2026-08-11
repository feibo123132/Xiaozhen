import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type SurfaceProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Surface<T extends ElementType = 'section'>({ as, children, className = '', ...props }: SurfaceProps<T>) {
  const Component = as ?? 'section';
  return <Component className={`paper-surface ${className}`.trim()} {...props}>{children}</Component>;
}
