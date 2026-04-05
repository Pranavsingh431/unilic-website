'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getLandingUrl } from '@/lib/env';
import { validateInstitutionEmail } from '@/lib/utils';
import { Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email domain for faculty
    if (!validateInstitutionEmail(formData.email)) {
      setError('Please use your institution email (@iitrpr.ac.in)');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Step 1: Create auth user (NO profile creation here)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              intended_role: 'faculty',
              name: formData.name,
            },
          },
        });

        if (authError) throw authError;

        // ✅ Email confirmation is ON → show verification message
        setError('');
        alert('✅ Account created! Please check your email to verify your account, then return to sign in.');
        setIsSignUp(false); // Switch to sign-in mode
        setLoading(false);
        return;
      } else {
        // Step 1: Sign in (session is created here)
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;

        // Step 2: Check if profile exists
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (expected for first login)
          console.error('Error fetching user role:', userError);
          await supabase.auth.signOut();
          throw new Error('Failed to verify account. Please contact support.');
        }

        // Step 3: If no profile exists, create it now (post-email-verification)
        if (!userData) {
          console.log('📝 Creating profile after email verification...');
          
          const role = data.user.user_metadata?.intended_role || 'faculty';
          
          const { error: profileError } = await supabase.rpc(
            'create_user_profile',
            { p_role: role }
          );

          if (profileError) {
            console.error('Profile creation error:', profileError);
            await supabase.auth.signOut();
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }

          // Update institution
          await supabase
            .from('users')
            .update({ institution: 'IIT Ropar' })
            .eq('id', data.user.id);

          console.log('✅ Profile created successfully');
        } else {
          // Step 4: Verify role matches portal
          if (userData.role !== 'faculty') {
            await supabase.auth.signOut();
            throw new Error('This account is registered as student. Please use the student portal.');
          }
        }

        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link 
          href={getLandingUrl()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <Image 
                src="/logo.png" 
                alt="Unilic Logo" 
                width={56} 
                height={56}
                className="rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome to Unilic</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isSignUp ? 'Create your faculty account' : 'Sign in to continue'}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-slate-100 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Institution Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-100 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="professor@iitrpr.ac.in"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Must be a valid @iitrpr.ac.in email
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-100 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 py-2.5 text-white transition-all duration-200 hover:scale-[1.01] hover:bg-blue-700 active:scale-[0.98]"
            >
              {loading ? 'Signing in...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
