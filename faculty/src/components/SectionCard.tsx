'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
    <Card className="rounded-3xl p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-textPrimary">{title}</h2>
          {description ? <p className="mt-1 text-sm text-textSecondary">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </Card>
  );
}
