'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { classNames } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        'w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary placeholder:text-dark-400 focus:border-primary',
        className
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        'min-h-[120px] w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary placeholder:text-dark-400 focus:border-primary',
        className
      )}
    />
  );
}
