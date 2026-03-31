'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { supabase, User } from '@/lib/supabase';

export default function FacultyDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();

      if (!mounted) {
        return;
      }

      if (!data || data.role !== 'faculty') {
        await supabase.auth.signOut();
        router.replace('/auth');
        return;
      }

      setUser(data);
      setLoading(false);
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading || !user) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded-xl bg-surfaceLight" />
          <div className="h-40 rounded-3xl bg-surfaceLight" />
          <div className="h-40 rounded-3xl bg-surfaceLight" />
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      user={user}
      onLogout={async () => {
        await supabase.auth.signOut();
        router.replace('/auth');
      }}
    >
      {children}
    </AppLayout>
  );
}
