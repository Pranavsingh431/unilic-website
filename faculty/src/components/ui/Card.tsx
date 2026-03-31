'use client';

import { ReactNode } from 'react';

import { classNames } from '@/lib/utils';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames('rounded-2xl border border-border bg-surfaceLight p-4 shadow-card', className)}>
      {children}
    </div>
  );
}
