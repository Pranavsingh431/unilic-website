'use client';

import { ReactNode } from 'react';

export default function Topbar({ title, subtitle, action }: { title?: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        <p className="text-sm font-medium text-textPrimary">{title ?? 'Welcome back'}</p>
        {subtitle ? <p className="text-xs text-textSecondary">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
