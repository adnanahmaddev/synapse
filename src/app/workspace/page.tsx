"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LessonBody from '@/components/LessonBody';
import QuizCard from '@/components/QuizCard';
import { ArrowLeft, ArrowRight, CheckCircle, Home } from 'lucide-react';

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
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar navigation */}
      <Sidebar 
        activeCourse={activeCourse} 
        activeLessonId={activeLessonId} 
        onSelectLesson={handleSelectLesson}
        completedLessons={completedLessons}
      />

      {/* Main layout split */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header details */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
              title="Return to Home"
            >
              <Home className="w-4.5 h-4.5" />
            </button>
            <div className="border-l border-slate-200 h-5"></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {activeCourse.title}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 max-w-[400px]">
                Active Topic: {activeCourse.prompt}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 select-none">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-700">{progressPercent}% Complete</div>
              <div className="text-[9px] font-semibold text-slate-400">
                {completedLessons.length} / {flatLessons.length} lessons passed
              </div>
            </div>
            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/40">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Core Workspace Panels */}
        <div className="flex-1 overflow-y-auto bg-white p-6 md:p-10 space-y-8">
          {activeLesson ? (
            <>
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

              {/* Lesson pagination controls */}
              <div className="flex justify-between items-center select-none pt-2">
                <button
                  onClick={handlePrevLesson}
                  disabled={!hasPrev}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-lg font-bold text-xs transition-all ${
                    hasPrev 
                      ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-xs' 
                      : 'text-slate-300 border border-slate-100 cursor-not-allowed'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div className="text-[10px] font-bold text-slate-400">
                  {activeIdx + 1} / {flatLessons.length}
                </div>

                {hasNext ? (
                  <button
                    onClick={handleNextLesson}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Complete Course
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
              Select a lesson from the syllabus on the left to begin.
            </div>
          )}
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
