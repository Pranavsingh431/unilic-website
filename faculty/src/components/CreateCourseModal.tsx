'use client';

import { useState } from 'react';
import { supabase, ScheduleSlot } from '@/lib/supabase';
import { generateJoinCode, getDayName, generateTimeline } from '@/lib/utils';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CreateCourseModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({ userId, userName, onClose, onSuccess }: CreateCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    professor_name: userName,
    semester_start: null as Date | null,
    semester_end: null as Date | null,
  });

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [newSlot, setNewSlot] = useState({
    day: 1,
    start_time: '09:00',
    end_time: '10:00',
  });

  const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
  ];

  const addScheduleSlot = () => {
    if (schedule.some(s => s.day === newSlot.day && s.start_time === newSlot.start_time)) {
      setError('This time slot already exists');
      return;
    }
    setSchedule([...schedule, newSlot]);
    setError('');
  };

  const removeScheduleSlot = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.semester_start || !formData.semester_end) {
      setError('Please select start and end dates');
      setLoading(false);
      return;
    }

    if (schedule.length === 0) {
      setError('Please add at least one class schedule');
      setLoading(false);
      return;
    }

    try {
      const joinCode = generateJoinCode();

      // Create course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert([
          {
            course_code: formData.course_code,
            course_name: formData.course_name,
            professor_id: userId,
            professor_name: formData.professor_name,
            semester_start: formData.semester_start.toISOString().split('T')[0],
            semester_end: formData.semester_end.toISOString().split('T')[0],
            join_code: joinCode,
          },
        ])
        .select()
        .single();

      if (courseError) throw courseError;

      // Generate timeline
      const sessions = generateTimeline(
        formData.semester_start,
        formData.semester_end,
        schedule
      );

      // Create class sessions
      const sessionsToInsert = sessions.map(session => ({
        course_id: courseData.id,
        ...session,
      }));

      const { error: sessionsError } = await supabase
        .from('class_sessions')
        .insert(sessionsToInsert);

      if (sessionsError) throw sessionsError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-dark-900 rounded-3xl border border-dark-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-900 border-b border-dark-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create New Course</h2>
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
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Course Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Course Code
              </label>
              <input
                type="text"
                required
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-600 transition"
                placeholder="CS301"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Course Name
              </label>
              <input
                type="text"
                required
                value={formData.course_name}
                onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-600 transition"
                placeholder="Data Structures"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Professor Name
            </label>
            <input
              type="text"
              required
              value={formData.professor_name}
              onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-600 transition"
              placeholder="Dr. Smith"
            />
          </div>

          {/* Semester Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Semester Start
              </label>
              <DatePicker
                selected={formData.semester_start}
                onChange={(date) => setFormData({ ...formData, semester_start: date })}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-600 transition"
                dateFormat="MMM d, yyyy"
                placeholderText="Select start date"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Semester End
              </label>
              <DatePicker
                selected={formData.semester_end}
                onChange={(date) => setFormData({ ...formData, semester_end: date })}
                minDate={formData.semester_start || undefined}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-primary-600 transition"
                dateFormat="MMM d, yyyy"
                placeholderText="Select end date"
                required
              />
            </div>
          </div>

          {/* Schedule Builder */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Class Schedule
            </label>
            <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
              <div className="grid grid-cols-4 gap-3 mb-3">
                <select
                  value={newSlot.day}
                  onChange={(e) => setNewSlot({ ...newSlot, day: parseInt(e.target.value) })}
                  className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-600"
                >
                  {days.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-600"
                />
                <input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                  className="px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary-600"
                />
                <button
                  type="button"
                  onClick={addScheduleSlot}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Schedule List */}
              {schedule.length > 0 ? (
                <div className="space-y-2">
                  {schedule.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between bg-dark-900 p-3 rounded-lg">
                      <span className="text-white text-sm">
                        {getDayName(slot.day)} • {slot.start_time} - {slot.end_time}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeScheduleSlot(index)}
                        className="p-1 hover:bg-red-900/20 text-red-400 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-dark-500 text-sm">
                  No schedule added yet. Add your class timings above.
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex space-x-3 pt-4">
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
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
