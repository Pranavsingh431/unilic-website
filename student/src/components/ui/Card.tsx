'use client';

import { HTMLAttributes, ReactNode } from 'react';

import { classNames } from '@/lib/utils';

export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      {...props}
      className={classNames('rounded-2xl border border-border bg-surfaceLight p-4 shadow-card', className)}
    >
      {children}
    </div>
  );
}
