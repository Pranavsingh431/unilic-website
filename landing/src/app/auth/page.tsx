'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, GraduationCap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/ui/Card';

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<'faculty' | 'student' | null>(null);

  const handleRoleSelection = (role: 'faculty' | 'student') => {
    setSelectedRole(role);
    const url =
      role === 'faculty'
        ? process.env.NEXT_PUBLIC_FACULTY_URL || 'http://localhost:3001'
        : process.env.NEXT_PUBLIC_STUDENT_URL || 'http://localhost:3002';

    window.location.href = `${url}/auth`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <Image src="/logo.png" alt="Unilic Logo" width={56} height={56} className="rounded-xl" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome to Unilic</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelection('faculty')}
              className={`rounded-xl border bg-white p-4 text-left transition ${
                selectedRole === 'faculty' ? 'border-blue-300 shadow-md' : 'border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Faculty</h2>
              <p className="mt-2 text-sm text-slate-500">Create courses, grade students, and manage the academic workflow.</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelection('student')}
              className={`rounded-xl border bg-white p-4 text-left transition ${
                selectedRole === 'student' ? 'border-blue-300 shadow-md' : 'border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Student</h2>
              <p className="mt-2 text-sm text-slate-500">Join courses, track assignments, and stay updated with faculty activity.</p>
            </motion.button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 transition hover:text-blue-700">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 transition hover:text-blue-700">
              Privacy Policy
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
