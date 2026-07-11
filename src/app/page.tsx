"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Paperclip, Sliders, ArrowRight, Sparkles } from 'lucide-react';
import { QUICK_START_TOPICS, LOADING_STEPS_TEXTS } from '@/utils/constants';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS_TEXTS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleCreateCourse = async (coursePrompt: string) => {
    if (!coursePrompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      // Get Model Configuration from localStorage
      let modelConfig = { provider: 'gemini' };
      const storedConfig = localStorage.getItem('fenzo_model_config');
      if (storedConfig) {
        modelConfig = JSON.parse(storedConfig);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: coursePrompt,
          modelConfig
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate course syllabus.");
      }

      const syllabus = await response.json();
      
      // Save course in history
      const newCourseId = `course_${Date.now()}`;
      const newCourse = {
        id: newCourseId,
        title: syllabus.title || coursePrompt,
        prompt: coursePrompt,
        syllabus: syllabus,
        completedLessons: [],
        createdAt: new Date().toISOString()
      };

      // Retrieve existing history
      let history: any[] = [];
      const storedHistory = localStorage.getItem('fenzo_course_history');
      if (storedHistory) {
        try {
          history = JSON.parse(storedHistory);
        } catch (e) {
          console.error(e);
        }
      }

      // Add to beginning of history
      history = [newCourse, ...history];
      localStorage.setItem('fenzo_course_history', JSON.stringify(history));
      localStorage.setItem('fenzo_active_course_id', newCourseId);

      // Redirect to workspace
      router.push(`/workspace?courseId=${newCourseId}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while generating the course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Gradient Dashboard Panel */}
      <main className="flex-1 h-full wave-bg flex flex-col justify-between items-center px-6 py-12 relative overflow-y-auto">
        {/* Top Header Buttons */}
        <div className="w-full flex justify-end gap-3 absolute top-6 right-6">
          <button className="text-xs font-semibold px-4 py-2 border border-slate-700/60 text-white rounded-lg bg-slate-800/40 hover:bg-slate-800/60 backdrop-blur-xs transition-all">
            Upgrade
          </button>
          <button className="text-xs font-semibold px-4 py-2 text-slate-300 hover:text-white transition-colors">
            Feedback
          </button>
        </div>

        {/* Center Panel Container */}
        <div className="flex-1 flex flex-col justify-center items-center max-w-2xl w-full my-auto z-10 space-y-8 animate-fade-in">
          {/* Main Titles */}
          <div className="text-center space-y-3">
            <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
              The perfect course, <span className="font-serif italic font-normal text-indigo-300">every time.</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              Type any question or concept. Get an interactive course, custom-tailored just for you.
            </p>
          </div>

          {/* Central Prompt Area */}
          <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col transition-all focus-within:shadow-2xl">
            {/* Upgrade banner if needed */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-2 text-[10px] text-slate-500 font-medium flex items-center justify-between">
              <span>Free account limits apply. Custom generation powered by Gemini & Local Models.</span>
              <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Upgrade to Pro</span>
            </div>

            {/* Main Textarea input */}
            <textarea
              className="w-full min-h-[120px] p-5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none resize-none"
              placeholder="What caused the 2008 financial crisis? / Learn React Hooks / CSS Grid principles..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreateCourse(prompt);
                }
              }}
              disabled={loading}
            />

            {/* Bottom Actions strip */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3 text-slate-400">
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors hover:text-slate-600">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors hover:text-slate-600">
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleCreateCourse(prompt)}
                disabled={loading || !prompt.trim()}
                className={`flex items-center gap-1.5 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md ${
                  loading || !prompt.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.01]'
                }`}
              >
                Create
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Errors */}
          {error && (
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Quick topics recommendation */}
          <div className="w-full space-y-3">
            <h4 className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Or try one of these
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_START_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(topic.text);
                    handleCreateCourse(topic.text);
                  }}
                  className="flex items-center gap-1 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 rounded-full px-3.5 py-1.5 text-xs text-slate-300 hover:text-white transition-all shadow-sm hover:scale-[1.02]"
                >
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom footer text */}
        <div className="text-[10px] text-slate-500 select-none z-10 mt-6">
          © {new Date().getFullYear()} Fenzo AI Clone. Developed locally for study and prep.
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col justify-center items-center p-6 select-none">
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl animate-scale-in">
              <div className="relative flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <Sparkles className="w-5 h-5 text-indigo-400 absolute animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Generating Course</h3>
                <p className="text-xs text-slate-400 min-h-[36px] transition-all duration-300">
                  {LOADING_STEPS_TEXTS[loadingStep]}
                </p>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1">
                <div 
                  className="bg-indigo-500 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${((loadingStep + 1) / LOADING_STEPS_TEXTS.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
