import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';

const sections = [
  {
    title: 'Acceptance of terms',
    body:
      'By accessing and using Unilic, you agree to be bound by these terms. If you do not agree with them, please do not use the service.',
  },
  {
    title: 'Use license',
    body:
      'Unilic is provided for academic operations and classroom management. You may use it only for legitimate institutional purposes and may not misuse, reverse engineer, or compromise the platform.',
  },
  {
    title: 'Account responsibilities',
    body:
      'You are responsible for maintaining the confidentiality of your account, monitoring activity under it, and promptly reporting unauthorized access or misuse.',
  },
  {
    title: 'Faculty responsibilities',
    body:
      'Faculty members are expected to provide accurate course information, maintain fair academic records, and handle student data in line with institutional policy.',
  },
  {
    title: 'Student responsibilities',
    body:
      'Students must use the platform only for courses they are enrolled in, keep their information accurate, and follow institutional academic and attendance policies.',
  },
  {
    title: 'Data usage',
    body:
      'We process data only to provide the Unilic service and improve academic workflows. For full details, please refer to the privacy policy.',
  },
  {
    title: 'Termination',
    body:
      'Access may be suspended or terminated if these terms are violated or if continued access would compromise the service or its users.',
  },
  {
    title: 'Changes to terms',
    body:
      'We may revise these terms over time. Continued use of the platform after changes are published constitutes acceptance of the updated terms.',
  },
  {
    title: 'Contact',
    body:
      'Questions about these terms can be raised through the support page so the team can respond and document any clarifications.',
  },
] as const;

export default function TermsPage() {
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
            <h1 className="mb-4 text-2xl font-semibold text-slate-900">Terms & Conditions</h1>
            <p className="text-sm leading-relaxed text-slate-500">
              These terms describe the responsibilities, limits, and expectations for using Unilic across faculty and
              student workflows.
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
            Last updated: January 17, 2026. You can also visit the{' '}
            <Link href="/privacy" className="text-blue-600 transition hover:text-blue-700">
              privacy policy
            </Link>{' '}
            for more detail on how information is handled.
          </p>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
