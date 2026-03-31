'use client';

import { HTMLAttributes, ReactNode } from 'react';

function classNames(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

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
      className={classNames('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition', className)}
    >
      {children}
    </div>
  );
}
