"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DEFAULT_OLLAMA_HOST, DEFAULT_OLLAMA_MODEL } from '@/utils/constants';
import { 
  Sparkles, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Sliders, 
  Globe, 
  Cpu,
  Bookmark,
  ChevronUp,
  X
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

  const toggleModule = (moduleId: string) => {
    setCollapsedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  return (
    <aside className="w-[300px] border-r border-slate-200 bg-white flex flex-col h-screen shrink-0 text-slate-800 relative z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          {/* Flame Icon */}
          <div className="w-7 h-7 bg-gradient-to-tr from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white shadow-sm font-semibold">
            f
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            fenzo
          </span>
        </div>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          title="Model Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Actions */}
      <div className="p-4">
        <button
          onClick={startNewCourse}
          className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 font-semibold py-3 px-4 rounded-xl border border-indigo-100 transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] duration-150 text-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          New Course
        </button>
      </div>

      {/* Dynamic Content Pane */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {/* Render Active Syllabus Navigation if inside a course workspace */}
        {activeCourse ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">Syllabus</h3>
            <div className="space-y-3">
              {activeCourse.syllabus?.modules?.map((mod: any) => {
                const isCollapsed = collapsedModules[mod.id];
                return (
                  <div key={mod.id} className="space-y-1.5">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 px-2 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <span className="truncate max-w-[200px]">{mod.title}</span>
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    
                    {!isCollapsed && (
                      <div className="pl-2 border-l border-slate-100 ml-3 space-y-1">
                        {mod.lessons?.map((les: any) => {
                          const isCompleted = completedLessons.includes(les.id);
                          const isActive = activeLessonId === les.id;
                          return (
                            <button
                              key={les.id}
                              onClick={() => onSelectLesson?.(les.id)}
                              className={`w-full flex items-center gap-2.5 text-left text-xs py-2 px-2.5 rounded-lg transition-all ${
                                isActive 
                                  ? 'bg-indigo-50/80 text-indigo-600 font-medium border-l-2 border-indigo-600 pl-2' 
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span className="truncate">{les.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* History / Recent Content */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">Recent Content</h3>
          {history.length === 0 ? (
            <div className="text-xs text-slate-400 italic px-2">No past courses generated.</div>
          ) : (
            <div className="space-y-1">
              {history.slice(0, 8).map((course: any) => (
                <button
                  key={course.id}
                  onClick={() => loadPastCourse(course)}
                  className="w-full text-left text-xs py-2 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center gap-2 transition-colors truncate"
                  title={course.prompt}
                >
                  <Bookmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{course.title || course.prompt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm overflow-hidden">
            AA
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 leading-none">Adnan Ahmad</div>
            <div className="text-[10px] font-medium text-slate-400 mt-1">Free account</div>
          </div>
        </div>
        <div className="text-slate-400">
          <ChevronUp className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Model Settings Drawer */}
      {showSettings && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-[280px] bg-white h-full shadow-2xl p-5 flex flex-col justify-between border-l border-slate-100 animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Model Configuration
                </span>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
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
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
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
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
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
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
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
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Model Name</label>
                    <input
                      type="text"
                      placeholder={DEFAULT_OLLAMA_MODEL}
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={saveSettings}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm mt-4"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
