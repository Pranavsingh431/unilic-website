'use client';

import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';

export default function StudentSettingsPage() {
  return (
    <PageContainer>
      <Card className="p-6">
        <h1 className="text-xl font-semibold text-textPrimary">Settings</h1>
        <p className="mt-2 text-sm text-textSecondary">
          Student settings are being polished into the same shared design system as the rest of the portal.
        </p>
      </Card>
    </PageContainer>
  );
}
