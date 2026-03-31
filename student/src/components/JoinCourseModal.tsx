'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, AlertCircle } from 'lucide-react';

interface JoinCourseModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JoinCourseModal({ userId, onClose, onSuccess }: JoinCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = joinCode.trim().toUpperCase();

    if (!code) {
      setError('Please enter a course code');
      setLoading(false);
      return;
    }

    try {
      // Find course by join code
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('join_code', code)
        .single();

      if (courseError || !courseData) {
        throw new Error('Invalid course code. Please check and try again.');
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_students')
        .select('id')
        .eq('course_id', courseData.id)
        .eq('student_id', userId)
        .single();

      if (existingEnrollment) {
        throw new Error('You are already enrolled in this course');
      }

      // Enroll student
      const { error: enrollError } = await supabase
        .from('course_students')
        .insert([
          {
            course_id: courseData.id,
            student_id: userId,
          },
        ]);

      if (enrollError) throw enrollError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to join course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-dark-900 rounded-3xl border border-dark-800 w-full max-w-md">
        {/* Header */}
        <div className="border-b border-dark-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Join Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-800 rounded-xl transition"
          >
            <X className="w-6 h-6 text-dark-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Course Code
            </label>
            <input
              type="text"
              required
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-600 transition font-mono text-lg tracking-wider text-center"
              placeholder="XXXXXXXX"
              maxLength={8}
            />
            <p className="mt-2 text-xs text-dark-500">
              Enter the 8-character code shared by your professor
            </p>
          </div>

          {/* Submit */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-xl transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl transition font-semibold"
            >
              {loading ? 'Joining...' : 'Join Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
