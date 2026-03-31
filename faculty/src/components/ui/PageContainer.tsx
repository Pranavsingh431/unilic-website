'use client';

import { ReactNode } from 'react';

import { classNames } from '@/lib/utils';

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={classNames('mx-auto max-w-7xl space-y-8', className)}>{children}</div>;
}
