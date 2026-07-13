"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LessonBody from '@/components/LessonBody';
import QuizCard from '@/components/QuizCard';
import { ArrowLeft, ArrowRight, CheckCircle, Leaf, Share2 } from 'lucide-react';
import { PRODUCT_NAME } from '@/utils/constants';

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [flatLessons, setFlatLessons] = useState<any[]>([]);

  // Load course details
  useEffect(() => {
    if (!courseId) {
      router.push('/');
      return;
    }

    const storedHistory = localStorage.getItem('fenzo_course_history');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        const course = history.find((c: any) => c.id === courseId);
        
        if (course) {
          setActiveCourse(course);
          setCompletedLessons(course.completedLessons || []);
          
          // Flatten lessons for easier navigation checks
          const list: any[] = [];
          course.syllabus?.modules?.forEach((mod: any) => {
            mod.lessons?.forEach((les: any) => {
              list.push(les);
            });
          });
          setFlatLessons(list);

          // Default active lesson to first lesson
          if (list.length > 0) {
            setActiveLessonId(list[0].id);
          }
        } else {
          router.push('/');
        }
      } catch (e) {
        console.error(e);
        router.push('/');
      }
    }
  }, [courseId, router]);

  if (!activeCourse) {
    return (
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-900 text-white space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-400">Loading learning environment...</span>
      </div>
    );
  }

  // Get currently active lesson details
  const activeLesson = flatLessons.find((l) => l.id === activeLessonId);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  const handlePassActiveRecall = () => {
    if (completedLessons.includes(activeLessonId)) return;

    const updatedCompleted = [...completedLessons, activeLessonId];
    setCompletedLessons(updatedCompleted);

    // Sync back to local storage history list
    const storedHistory = localStorage.getItem('fenzo_course_history');
    if (storedHistory) {
      try {
        let history = JSON.parse(storedHistory);
        const index = history.findIndex((c: any) => c.id === courseId);
        if (index !== -1) {
          history[index].completedLessons = updatedCompleted;
          localStorage.setItem('fenzo_course_history', JSON.stringify(history));
          
          // Sync active course state
          setActiveCourse(history[index]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Nav actions
  const activeIdx = flatLessons.findIndex((l) => l.id === activeLessonId);
  const hasNext = activeIdx !== -1 && activeIdx < flatLessons.length - 1;
  const hasPrev = activeIdx > 0;

  const handleNextLesson = () => {
    if (hasNext) {
      setActiveLessonId(flatLessons[activeIdx + 1].id);
    }
  };

  const handlePrevLesson = () => {
    if (hasPrev) {
      setActiveLessonId(flatLessons[activeIdx - 1].id);
    }
  };

  // Progress maths
  const progressPercent = flatLessons.length > 0 
    ? Math.round((completedLessons.length / flatLessons.length) * 100) 
    : 0;

  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden text-slate-800">
      {/* Top Header details */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            {/* Synapse brand logo */}
            <div className="flex items-center gap-2 cursor-pointer pl-1 select-none" onClick={() => router.push('/')}>
              <div className="w-5.5 h-5.5 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-md flex items-center justify-center text-white shadow-xs">
                <Leaf className="w-3 h-3 text-white fill-emerald-100/20" />
              </div>
              <span className="text-lg font-serif italic font-normal text-slate-800 lowercase tracking-wide">
                {PRODUCT_NAME}
              </span>
            </div>
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

// Suspense wrap required for useSearchParams() hooks in Next.js App Router static optimization layouts
export default function Workspace() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col justify-center items-center bg-slate-900 text-white space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-400">Loading learning environment...</span>
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}
