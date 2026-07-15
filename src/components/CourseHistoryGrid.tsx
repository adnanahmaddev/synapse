"use client";

import React from 'react';
import { Bookmark, ArrowRight, CheckCircle } from 'lucide-react';
import { Course, Lesson } from '@/types';

interface CourseHistoryGridProps {
  history: Course[];
  onSelectCourse: (course: Course) => void;
}

export default function CourseHistoryGrid({ history, onSelectCourse }: CourseHistoryGridProps) {
  if (history.length === 0) {
    return (
      <div className="w-full text-center py-10 bg-slate-900/20 border border-slate-800/50 rounded-2xl backdrop-blur-xs select-none">
        <p className="text-slate-500 text-xs italic">Your generated courses will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full select-none">
      {history.slice(0, 6).map((course) => {
        // Calculate total lessons
        const flatLessons: Lesson[] = [];
        if (Array.isArray(course.syllabus?.modules)) {
          course.syllabus.modules.forEach((mod) => {
            if (Array.isArray(mod.lessons)) {
              mod.lessons.forEach((les) => {
                flatLessons.push(les);
              });
            }
          });
        }

        const totalLessons = flatLessons.length;
        const completedCount = course.completedLessons?.length || 0;
        const progressPercent = totalLessons > 0 
          ? Math.round((completedCount / totalLessons) * 100) 
          : 0;

        return (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className="group relative bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/60 hover:border-brand-500/30 backdrop-blur-xs rounded-2xl p-5 cursor-pointer flex flex-col justify-between h-40 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-brand-500/5"
          >
            {/* Top Row: Icon and Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-lg">
                  <Bookmark className="w-4 h-4" />
                </div>
                {progressPercent === 100 && (
                  <span className="text-[10px] bg-brand-500/10 text-brand-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-500/20">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-1 leading-snug">
                  {course.title || course.prompt}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                  Topic: {course.prompt}
                </p>
              </div>
            </div>

            {/* Bottom Row: Progress and Resume */}
            <div className="space-y-3.5 pt-2 border-t border-slate-800/40">
              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>Progress</span>
                <span className="font-bold text-slate-200">{progressPercent}% ({completedCount}/{totalLessons} lessons)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-800/50 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="text-[10px] font-bold text-brand-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Resume
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
