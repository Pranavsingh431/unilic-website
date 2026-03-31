'use client';

import Link from 'next/link';
import { Course } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Calendar, Code, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/dashboard/course/${course.id}`}
      className="block group"
    >
      <Card className="rounded-3xl p-6 transition group-hover:border-primary">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Code className="h-6 w-6" />
          </div>
        </div>

        <h3 className="mb-1 text-xl font-semibold text-textPrimary transition group-hover:text-primary">
          {course.course_name}
        </h3>
        <p className="mb-4 text-textSecondary">{course.course_code}</p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-textSecondary">
            <GraduationCap className="mr-2 h-4 w-4" />
            <span>{course.professor_name}</span>
          </div>
          <div className="flex items-center text-sm text-textSecondary">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {formatDate(course.semester_start)} - {formatDate(course.semester_end)}
            </span>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <span className="text-sm font-medium text-primary">Open course →</span>
        </div>
      </Card>
    </Link>
  );
}
