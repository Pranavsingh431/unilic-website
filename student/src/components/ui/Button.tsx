'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

import { classNames } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: Variant }) {
  return (
    <button
      {...props}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-primary text-white hover:bg-primaryHover',
        variant === 'secondary' && 'border border-border bg-surface text-textPrimary hover:bg-surfaceLight',
        variant === 'ghost' && 'bg-transparent text-textSecondary hover:bg-surface hover:text-textPrimary',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
        className
      )}
    />
  );
}
