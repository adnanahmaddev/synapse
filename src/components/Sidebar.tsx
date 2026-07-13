"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DEFAULT_OLLAMA_HOST, DEFAULT_OLLAMA_MODEL, PRODUCT_NAME } from '@/utils/constants';
import BrandLogo from '@/components/BrandLogo';
import { 
  Settings, 
  CheckCircle2, 
  Sliders, 
  Globe, 
  Cpu,
  Bookmark,
  X,
  Plus
} from 'lucide-react';

interface SidebarProps {
  activeCourse?: any;
  activeLessonId?: string;
  onSelectLesson?: (lessonId: string) => void;
  completedLessons?: string[];
}

export default function Sidebar({ 
  activeCourse, 
  activeLessonId, 
  onSelectLesson, 
  completedLessons = [] 
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [history, setHistory] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Model Settings State
  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaHost, setOllamaHost] = useState(process.env.NEXT_PUBLIC_OLLAMA_HOST || DEFAULT_OLLAMA_HOST);
  const [ollamaModel, setOllamaModel] = useState(process.env.NEXT_PUBLIC_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL);
  
  // Collapsed modules inside syllabus
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load Settings
    const storedConfig = localStorage.getItem('fenzo_model_config');
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        setProvider(config.provider || 'gemini');
        setApiKey(config.apiKey || '');
        setOllamaHost(config.host || process.env.NEXT_PUBLIC_OLLAMA_HOST || DEFAULT_OLLAMA_HOST);
        setOllamaModel(config.model || process.env.NEXT_PUBLIC_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL);
      } catch (e) {
        console.error(e);
      }
    }

    // Load History
    const storedHistory = localStorage.getItem('fenzo_course_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  }, [pathname]);

  const saveSettings = () => {
    const config = {
      provider,
      apiKey: provider === 'gemini' ? apiKey : '',
      host: provider === 'ollama' ? ollamaHost : '',
      model: provider === 'gemini' ? 'gemini-2.5-flash' : ollamaModel
    };
    localStorage.setItem('fenzo_model_config', JSON.stringify(config));
    setShowSettings(false);
  };

  const startNewCourse = () => {
    router.push('/');
  };

  const loadPastCourse = (course: any) => {
    localStorage.setItem('fenzo_active_course_id', course.id);
    router.push(`/workspace?courseId=${course.id}`);
  };

  const flatLessonsList: any[] = [];
  if (Array.isArray(activeCourse?.syllabus?.modules)) {
    activeCourse.syllabus.modules.forEach((mod: any) => {
      if (Array.isArray(mod.lessons)) {
        mod.lessons.forEach((les: any) => {
          flatLessonsList.push(les);
        });
      }
    });
  }

  const progressPercent = flatLessonsList.length > 0 
    ? Math.round((completedLessons.length / flatLessonsList.length) * 100) 
    : 0;

  return (
    <aside className="w-[260px] border-r border-slate-200 bg-[#fafafa] flex flex-col h-full shrink-0 text-slate-800 relative z-30">
      {/* Brand Header */}
      {!activeCourse && (
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <BrandLogo size="md" textColor="text-slate-800" />
        </div>
      )}

      {/* Dynamic Content Pane */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Render Active Syllabus Navigation if inside a course workspace */}
        {activeCourse ? (
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Course Outline</h3>
              <button 
                onClick={startNewCourse}
                className="p-1 hover:bg-slate-200/50 rounded transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Create New Course"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="px-2 mb-6 select-none">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>Progress</span>
                <span className="font-bold text-slate-800">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200/60 rounded-full h-1 overflow-hidden mt-1.5">
                <div 
                  className="bg-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              {flatLessonsList.map((les: any, index: number) => {
                const isCompleted = completedLessons.includes(les.id);
                const isActive = activeLessonId === les.id;
                
                return (
                  <button
                    key={les.id}
                    onClick={() => onSelectLesson?.(les.id)}
                    className={`w-full flex items-start gap-2.5 text-left text-sm py-2 px-2.5 rounded-lg border transition-all focus:outline-none cursor-pointer ${
                      isActive 
                        ? 'bg-brand-50 text-brand-600 font-semibold border-brand-100/50' 
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-medium'
                    }`}
                  >
                    <span className={`text-sm font-bold shrink-0 font-mono w-4 text-left ${
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="leading-tight">{les.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* History / Recent Content */}
        {!activeCourse && (
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Content</h3>
            </div>
            {history.length === 0 ? (
              <div className="text-xs text-slate-400 italic px-2">No past courses generated.</div>
            ) : (
              <div className="space-y-1">
                {history.slice(0, 8).map((course: any) => (
                  <button
                    key={course.id}
                    onClick={() => loadPastCourse(course)}
                    className="w-full text-left text-xs py-2 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors truncate cursor-pointer"
                    title={course.prompt}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{course.title || course.prompt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      {!activeCourse && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm overflow-hidden">
              AA
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-none">Adnan Ahmad</div>
              <div className="text-[10px] font-medium text-slate-400 mt-1">Free account</div>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Model Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Model Settings Drawer */}
      {showSettings && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-[280px] bg-white h-full shadow-2xl p-5 flex flex-col justify-between border-l border-slate-100 animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                  <Sliders className="w-4 h-4 text-brand-500" />
                  Model Configuration
                </span>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProvider('gemini')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      provider === 'gemini'
                        ? 'border-brand-600 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Gemini Cloud
                  </button>
                  <button
                    onClick={() => setProvider('ollama')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      provider === 'ollama'
                        ? 'border-brand-600 bg-brand-50 text-brand-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Ollama Local
                  </button>
                </div>
              </div>

              {/* Gemini API Key */}
              {provider === 'gemini' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="Paste GEMINI_API_KEY..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Uses <strong>gemini-2.5-flash</strong> for fast structured syllabus layout.
                  </p>
                </div>
              )}

              {/* Ollama Options */}
              {provider === 'ollama' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Ollama Host</label>
                    <input
                      type="text"
                      placeholder="http://localhost:11434"
                      value={ollamaHost}
                      onChange={(e) => setOllamaHost(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Name</label>
                    <input
                      type="text"
                      placeholder={DEFAULT_OLLAMA_MODEL}
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={saveSettings}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm mt-4 cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
