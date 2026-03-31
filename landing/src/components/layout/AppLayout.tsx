'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Unilic Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <p className="text-lg font-semibold text-slate-900">Unilic</p>
              <p className="text-xs text-slate-500">Academic operations platform</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm text-slate-600 transition hover:text-slate-900">
              Home
            </Link>
            <Link href="/support" className="text-sm text-slate-600 transition hover:text-slate-900">
              Support
            </Link>
            <Link href="/terms" className="text-sm text-slate-600 transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-slate-600 transition hover:text-slate-900">
              Privacy
            </Link>
          </nav>
          <Link
            href="/auth"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Open portal
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
