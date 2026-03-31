'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Support request:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <AppLayout>
      <PageContainer>
        <Card className="mx-auto max-w-3xl animate-[fadeIn_0.3s_ease] p-6 hover:shadow-sm">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mb-6 mt-4">
            <p className="text-sm text-slate-500">Support</p>
            <h1 className="mb-4 text-2xl font-semibold text-slate-900">Contact the Unilic team</h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Use this space to report issues, ask questions, or request help with workflows across the product.
            </p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-surfaceLight p-4 shadow-none">
              <Mail className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Email</h2>
              <p className="text-sm leading-relaxed text-slate-500">Write to the team directly for product support.</p>
              <a href="mailto:support@unilic.iitrpr.ac.in" className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700">
                support@unilic.iitrpr.ac.in
              </a>
            </Card>
            <Card className="bg-surfaceLight p-4 shadow-none">
              <MessageSquare className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Response window</h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Most support requests receive a response within one business day.
              </p>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <section>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Message details</h2>
              <p className="mb-4 text-sm leading-relaxed text-slate-500">
                Share the context clearly so the issue can be reproduced and resolved faster.
              </p>
            </section>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm text-slate-500">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-slate-500">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@iitrpr.ac.in"
                />
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm text-slate-500">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(event) => setFormData({ ...formData, subject: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm text-slate-500">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your issue or question..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitted}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitted ? 'Message Sent!' : 'Send Message'}
              {!submitted ? <Send className="h-4 w-4" /> : null}
            </button>
          </form>

          {submitted ? (
            <Card className="mt-6 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-none">
              Thank you for contacting us. We&apos;ll get back to you soon.
            </Card>
          ) : null}
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
