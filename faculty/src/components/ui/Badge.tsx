'use client';

import { ReactNode } from 'react';

import { classNames } from '@/lib/utils';

type Variant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        variant === 'neutral' && 'bg-surface text-textSecondary',
        variant === 'success' && 'bg-emerald-950/50 text-emerald-300',
        variant === 'warning' && 'bg-amber-950/50 text-amber-300',
        variant === 'danger' && 'bg-red-950/50 text-red-300',
        variant === 'info' && 'bg-sky-950/50 text-sky-300'
      )}
    >
      {children}
    </span>
  );
}
