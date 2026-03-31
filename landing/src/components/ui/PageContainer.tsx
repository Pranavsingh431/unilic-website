'use client';

import { ReactNode } from 'react';

function classNames(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={classNames('mx-auto max-w-7xl space-y-6 px-6 py-10', className)}>{children}</div>;
}
