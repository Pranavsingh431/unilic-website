'use client';

import { ReactNode } from 'react';

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { User } from '@/lib/supabase';

export default function AppLayout({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void | Promise<void>;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-textPrimary">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title="Faculty workspace" subtitle="Course administration, grading, and LMS operations" />
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-200 ease-in-out">{children}</main>
      </div>
    </div>
  );
}
