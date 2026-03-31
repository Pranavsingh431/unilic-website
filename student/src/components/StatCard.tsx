'use client';

import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}

export default function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-textSecondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-textPrimary">{value}</p>
      {hint ? <p className="mt-2 text-xs text-textSecondary">{hint}</p> : null}
    </Card>
  );
}
