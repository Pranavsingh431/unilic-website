'use client';

import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';

export default function StudentProfilePage() {
  return (
    <PageContainer>
      <Card className="p-6">
        <h1 className="text-xl font-semibold text-textPrimary">Profile</h1>
        <p className="mt-2 text-sm text-textSecondary">
          Student profile settings are being integrated into the same portal system.
        </p>
      </Card>
    </PageContainer>
  );
}
