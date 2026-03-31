import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';

const sections = [
  {
    title: 'Information we collect',
    body:
      'We collect only the information needed to run the platform, including account details, course relationships, academic workflow data, and service usage signals required for reliability and support.',
  },
  {
    title: 'How we use information',
    body:
      'Information is used to power attendance, course operations, grading, communication, and platform improvements. It is not sold or used outside the educational service context.',
  },
  {
    title: 'Storage and security',
    body:
      'Data is stored using managed infrastructure and protected with access controls, secure authentication, encrypted transport, and operational safeguards appropriate for academic software.',
  },
  {
    title: 'Information sharing',
    body:
      'We do not sell personal information. Data is shared only within the product context, with institutional stakeholders where necessary, or when required by law or policy.',
  },
  {
    title: 'Your rights',
    body:
      'Users can request access, correction, or clarification of stored information, subject to institutional requirements and product responsibilities.',
  },
  {
    title: 'Retention',
    body:
      'We retain information only as long as needed to operate the service, comply with obligations, preserve academic records, and maintain platform integrity.',
  },
  {
    title: 'Policy updates',
    body:
      'If this policy changes, the updated version will be published here with a revised effective date so users can review the latest terms.',
  },
  {
    title: 'Contact us',
    body:
      'Questions about privacy practices can be raised through the support page so the team can respond in a documented and accountable way.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <AppLayout>
      <PageContainer>
        <Card className="mx-auto max-w-3xl animate-[fadeIn_0.3s_ease] p-6 hover:shadow-sm">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mb-6 mt-4">
            <p className="text-sm text-slate-500">Legal</p>
            <h1 className="mb-4 text-2xl font-semibold text-slate-900">Privacy Policy</h1>
            <p className="text-sm leading-relaxed text-slate-500">
              This policy explains how Unilic handles the information required to power academic operations across
              faculty and student workflows.
            </p>
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">{section.title}</h2>
                <p className="text-sm leading-relaxed text-slate-500">{section.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-500">
            Last updated: January 17, 2026. For terms governing use of the platform, see the{' '}
            <Link href="/terms" className="text-blue-600 transition hover:text-blue-700">
              terms & conditions
            </Link>
            .
          </p>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
