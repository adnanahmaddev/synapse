"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LessonBody from '@/components/LessonBody';
import QuizCard from '@/components/QuizCard';
import { Share2 } from 'lucide-react';


import BrandLogo from '@/components/BrandLogo';

async function loadCourse(courseId: string | undefined) {
  if (!courseId) return null;
  
  // 1. Try DB
  try {
    const res = await fetch('/api/courses');
    if (res.ok) {
      const data = await res.json();
      const course = data.history?.find((c: any) => c.id === courseId);
      if (course) return course;
    }
  } catch (err) {
    console.error('Failed to load course from DB, falling back to localStorage:', err);
  }

  // 2. Try localStorage fallback
  if (typeof window !== 'undefined') {
    try {
      const storedHistory = localStorage.getItem('synapse_course_history');
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        return history.find((c: any) => c.id === courseId) ?? null;
      }
    } catch {}
  }
  return null;
}

function flattenLessons(course: any): any[] {
  const list: any[] = [];
  if (Array.isArray(course?.syllabus?.modules)) {
    course.syllabus.modules.forEach((mod: any) => {
      if (Array.isArray(mod.lessons)) mod.lessons.forEach((les: any) => list.push(les));
    });
  }
  return list;
}

function WorkspaceContent({ courseId }: { courseId?: string }) {
  const router = useRouter();

  // All state starts with server-safe defaults (null / empty).
  // localStorage is only available after mount, so we populate state in the
  // useEffect below. This avoids a hydration mismatch where the server renders
  // the loading spinner (window === undefined → null) but the client renders
  // the full workspace (localStorage available → real data).
  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [flatLessons, setFlatLessons] = useState<any[]>([]);

  // Load course after mount, then redirect if not found.
  useEffect(() => {
    if (!courseId) {
      router.push('/');
      return;
    }
    
    const fetchCourse = async () => {
      const course = await loadCourse(courseId);
      if (!course) {
        router.push('/');
        return;
      }
      const lessons = flattenLessons(course);
      setActiveCourse(course);
      setFlatLessons(lessons);
      setActiveLessonId(lessons[0]?.id ?? '');
      setCompletedLessons(course.completedLessons ?? []);
    };

    fetchCourse();
  }, [courseId, router]);

  if (!activeCourse) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-900 text-white space-y-4">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-400">Loading learning environment...</span>
      </div>
    );
  }


  // Get currently active lesson details
  const activeLesson = flatLessons.find((l) => l.id === activeLessonId);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  const handlePassActiveRecall = async () => {
    if (completedLessons.includes(activeLessonId)) return;

    const updatedCompleted = [...completedLessons, activeLessonId];
    setCompletedLessons(updatedCompleted);

    const updatedCourse = {
      ...activeCourse,
      completedLessons: updatedCompleted
    };

    // Sync active course state
    setActiveCourse(updatedCourse);

    // 1. Sync to MongoDB
    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course: updatedCourse })
      });
    } catch (e) {
      console.error('Failed to sync progress to DB:', e);
    }

    // 2. Sync back to local storage history list as fallback
    const storedHistory = localStorage.getItem('synapse_course_history');
    if (storedHistory) {
      try {
        let history = JSON.parse(storedHistory);
        const index = history.findIndex((c: any) => c.id === courseId);
        if (index !== -1) {
          history[index].completedLessons = updatedCompleted;
          localStorage.setItem('synapse_course_history', JSON.stringify(history));
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const activeIdx = flatLessons.findIndex((l) => l.id === activeLessonId);

  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden text-slate-800">
      {/* Top Header details */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" textColor="text-slate-800" />
            <div className="border-l border-slate-200 h-4 mx-2"></div>
            <h2 className="text-base font-semibold text-slate-800 leading-tight">
              {activeCourse.title}
            </h2>
          </div>
          <div className="flex items-center text-slate-400 pr-1 hover:text-slate-600 transition-colors cursor-pointer" title="Share Course">
            <Share2 className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Workspace split layout */}
      <div className="flex-1 flex min-h-0 bg-white">
        {/* Sidebar navigation */}
        <Sidebar 
          activeCourse={activeCourse} 
          activeLessonId={activeLessonId} 
          onSelectLesson={handleSelectLesson}
          completedLessons={completedLessons}
        />

        {/* Main layout split */}
        <div className="flex-1 flex flex-col h-full min-w-0">

        {/* Core Workspace Panels */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {activeLesson ? (
            /* Scrollable Content Area */
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="max-w-4xl mx-auto w-full space-y-8">
                {/* Stepper position tag */}
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Lesson {activeIdx + 1} of {flatLessons.length}
                </div>

                {/* Lesson details */}
                <LessonBody 
                  title={activeLesson.title} 
                  content={activeLesson.content} 
                />

                {/* Interactive MCQ Quiz */}
                <div className="min-h-0">
                  <QuizCard 
                    quizData={activeLesson.quizData || {
                      question: `Review checkpoint: Have you understood the core concept of "${activeLesson.title}"?`,
                      options: [
                        "Yes, I understand it fully",
                        "I need to review it again",
                        "I'm not sure",
                        "I didn't read it"
                      ],
                      correctIndex: 0,
                      explanation: "Self-assessment passed! Keep going."
                    }} 
                    onPass={handlePassActiveRecall}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic text-xs">
              Select a lesson from the syllabus on the left to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function Workspace({ searchParams }: PageProps) {
  const resolvedParams = React.use(searchParams);
  const courseId = resolvedParams.courseId as string | undefined;

  return (
    <WorkspaceContent courseId={courseId} />
  );
}
