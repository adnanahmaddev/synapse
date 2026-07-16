"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CourseHistoryGrid from '@/components/CourseHistoryGrid';
import BrandLogo from '@/components/BrandLogo';
import { Sliders, ArrowRight, Sparkles, Settings, X, Cpu, Globe } from 'lucide-react';
import { 
  QUICK_START_TOPICS, 
  LOADING_STEPS_TEXTS, 
  PRODUCT_NAME,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_MODEL
} from '@/utils/constants';
import { Course, ModelConfig } from '@/types';
import { 
  getCoursesFromIndexedDB, 
  saveCourseToIndexedDB, 
  saveCoursesToIndexedDB,
  migrateLocalStorageToIndexedDB 
} from '@/utils/indexedDB';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Course[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Model Settings State
  const [provider, setProvider] = useState<'gemini' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [ollamaHost, setOllamaHost] = useState(DEFAULT_OLLAMA_HOST);
  const [ollamaModel, setOllamaModel] = useState(DEFAULT_OLLAMA_MODEL);

  // Load configuration & history
  useEffect(() => {
    const loadData = async () => {
      let currentHistory: Course[] = [];
      let currentConfig: ModelConfig | null = null;

      // 1. Fetch from MongoDB
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          currentHistory = data.history || [];
        }
      } catch (err) {
        console.error('Failed to load courses from DB, using fallback:', err);
      }

      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          currentConfig = data.modelConfig;
        }
      } catch (err) {
        console.error('Failed to load config from DB, using fallback:', err);
      }

      // 2. Perform Migration check
      const migrated = localStorage.getItem('synapse_migrated_to_mongodb') === 'true';
      if (!migrated) {
        const storedHistory = localStorage.getItem('synapse_course_history');
        const storedConfig = localStorage.getItem('synapse_model_config');
        
        let migratedSomething = false;

        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory);
            if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
              // Save local history to DB
              await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courses: parsedHistory })
              });
              
              // Merge local history with DB history (no duplicates)
              const merged = [...parsedHistory];
              currentHistory.forEach((c) => {
                if (!merged.some((m) => m.id === c.id)) {
                  merged.push(c);
                }
              });
              currentHistory = merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              migratedSomething = true;
            }
          } catch (e) {
            console.error('Migration error history:', e);
          }
        }

        if (storedConfig) {
          try {
            const parsedConfig = JSON.parse(storedConfig);
            if (parsedConfig) {
              await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelConfig: parsedConfig })
              });
              currentConfig = parsedConfig;
              migratedSomething = true;
            }
          } catch (e) {
            console.error('Migration error config:', e);
          }
        }

        if (migratedSomething || storedHistory || storedConfig) {
          localStorage.setItem('synapse_migrated_to_mongodb', 'true');
        }
      }

      // 3. Migrate localStorage history to IndexedDB & clear legacy localStorage history key
      await migrateLocalStorageToIndexedDB();

      // 4. Set UI state and sync IndexedDB cache
      if (currentHistory.length > 0) {
        setHistory(currentHistory);
        await saveCoursesToIndexedDB(currentHistory);
      } else {
        const localHistory = await getCoursesFromIndexedDB();
        if (localHistory.length > 0) {
          setHistory(localHistory);
        }
      }

      if (currentConfig) {
        setProvider(currentConfig.provider || 'gemini');
        setApiKey(currentConfig.apiKey || '');
        setOllamaHost(currentConfig.host || DEFAULT_OLLAMA_HOST);
        setOllamaModel(currentConfig.model || DEFAULT_OLLAMA_MODEL);
      } else {
        const storedConfig = localStorage.getItem('synapse_model_config');
        if (storedConfig) {
          try {
            const config = JSON.parse(storedConfig);
            setProvider(config.provider || 'gemini');
            setApiKey(config.apiKey || '');
            setOllamaHost(config.host || DEFAULT_OLLAMA_HOST);
            setOllamaModel(config.model || DEFAULT_OLLAMA_MODEL);
          } catch {}
        }
      }
    };

    loadData();
  }, []);

  // Loading animation step timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS_TEXTS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const saveSettings = async () => {
    const config = {
      provider,
      apiKey: provider === 'gemini' ? apiKey : '',
      host: provider === 'ollama' ? ollamaHost : '',
      model: provider === 'gemini' ? 'gemini-2.5-flash' : ollamaModel
    };

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelConfig: config })
      });
    } catch (e) {
      console.error('Failed to save config to DB:', e);
    }

    localStorage.setItem('synapse_model_config', JSON.stringify(config));
    setShowSettings(false);
  };

  const handleCreateCourse = async (coursePrompt: string) => {
    if (!coursePrompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    try {
      const modelConfig = {
        provider,
        apiKey: provider === 'gemini' ? apiKey : '',
        host: provider === 'ollama' ? ollamaHost : '',
        model: provider === 'gemini' ? 'gemini-2.5-flash' : ollamaModel
      };

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
      
      const newCourseId = `course_${Date.now()}`;
      const newCourse = {
        id: newCourseId,
        title: syllabus.title || coursePrompt,
        prompt: coursePrompt,
        syllabus: syllabus,
        completedLessons: [],
        createdAt: new Date().toISOString()
      };

      const currentHistory = [newCourse, ...history];
      setHistory(currentHistory);

      // Save to MongoDB
      try {
        await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course: newCourse })
        });
        await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeCourseId: newCourseId })
        });
      } catch (e) {
        console.error('Failed to save course to DB:', e);
      }

      await saveCourseToIndexedDB(newCourse);
      localStorage.setItem('synapse_active_course_id', newCourseId);

      router.push(`/workspace?courseId=${newCourseId}`);

    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Something went wrong while generating the course. Please try again.";
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeCourseId: course.id })
      });
    } catch (e) {
      console.error('Failed to save active course ID to DB:', e);
    }

    localStorage.setItem('synapse_active_course_id', course.id);
    router.push(`/workspace?courseId=${course.id}`);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col wave-bg overflow-x-hidden text-slate-100">
      {/* Top Translucent Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between px-6 py-4 select-none z-20 shrink-0">
        <BrandLogo size="md" textColor="text-white" />

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/60 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer shadow-xs"
            title="Model Configuration"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
          <div className="w-8.5 h-8.5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm overflow-hidden border border-brand-500/20 select-none">
            AA
          </div>
        </div>
      </header>

      {/* Main Learning Hub Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 md:py-16 flex flex-col justify-start items-center gap-10 md:gap-14 z-10">
        {/* Hero Headline */}
        <div className="text-center space-y-4 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Master any topic, <span className="font-serif italic font-normal text-brand-400">organically.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Map any subject into a dynamic syllabus. Retain knowledge through active recall, quizzes, and deep conceptual checkpoints.
          </p>
        </div>

        {/* Search & Prompt Area (Dark Glassmorphism) */}
        <div className="w-full flex flex-col gap-6 items-center">
          <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 flex flex-col overflow-hidden focus-within:border-brand-500/50 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300">
            {/* Input Textarea */}
            <textarea
              className="w-full min-h-[110px] p-5 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
              placeholder="Enter a subject you want to master today (e.g. 'How Photosynthesis Works', 'CSS Grid', 'Sine Waves')..."
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

            {/* Prompt Actions strip */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-900/30 flex justify-between items-center">
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-slate-800/60 rounded-xl transition-all text-slate-500 hover:text-slate-300 cursor-pointer"
                title="Model Configuration"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleCreateCourse(prompt)}
                disabled={loading || !prompt.trim()}
                className={`flex items-center gap-1.5 font-bold py-2.5 px-4.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                  loading || !prompt.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-850'
                    : 'bg-brand-600 hover:bg-brand-700 text-white hover:scale-[1.01]'
                }`}
              >
                Create
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick-start Topic Recommendation Pills */}
          <div className="space-y-3 w-full text-center">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Or try one of these
            </h4>
            <div className="flex flex-wrap justify-center gap-2.5">
              {QUICK_START_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(topic.text);
                    handleCreateCourse(topic.text);
                  }}
                  className="flex items-center gap-1.5 bg-slate-900/30 hover:bg-slate-900/75 border border-slate-800/80 rounded-full px-4 py-2 text-xs text-slate-300 hover:text-white transition-all shadow-xs hover:scale-[1.02] hover:border-brand-500/20 cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                  {topic.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="w-full p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Continue Learning Course Grid */}
        <div className="w-full space-y-4 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Continue Learning
          </h2>
          <CourseHistoryGrid 
            history={history} 
            onSelectCourse={handleSelectCourse} 
          />
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-6xl mx-auto text-center py-8 text-[10px] text-slate-600 select-none z-10 shrink-0 border-t border-slate-900/40">
        © {new Date().getFullYear()} {PRODUCT_NAME}. Cultivating custom paths to understanding.
      </footer>

      {/* Generating/Loading Overlay Modal */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex flex-col justify-center items-center p-6 select-none">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl animate-scale-in">
            <div className="relative flex justify-center items-center">
              <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
              <Sparkles className="w-5 h-5 text-brand-400 absolute animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Generating Course</h3>
              <p className="text-xs text-slate-400 transition-all duration-300">
                {LOADING_STEPS_TEXTS[loadingStep]}
              </p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1">
              <div 
                className="bg-brand-500 h-1 rounded-full transition-all duration-500" 
                style={{ width: `${((loadingStep + 1) / LOADING_STEPS_TEXTS.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Model Settings Drawer */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="w-full max-w-[280px] bg-slate-900 h-full shadow-2xl p-5 flex flex-col justify-between border-l border-slate-800/80 animate-slide-up text-slate-100">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <span className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                  <Sliders className="w-4 h-4 text-brand-400" />
                  Model Configuration
                </span>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provider Select */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProvider('gemini')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      provider === 'gemini'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Gemini Cloud
                  </button>
                  <button
                    onClick={() => setProvider('ollama')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      provider === 'ollama'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="Paste GEMINI_API_KEY..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-brand-500 text-slate-200 placeholder-slate-700"
                  />
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    Uses <strong>gemini-2.5-flash</strong> for fast structured syllabus layout.
                  </p>
                </div>
              )}

              {/* Ollama Options */}
              {provider === 'ollama' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ollama Host</label>
                    <input
                      type="text"
                      placeholder="http://localhost:11434"
                      value={ollamaHost}
                      onChange={(e) => setOllamaHost(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-brand-500 text-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model Name</label>
                    <input
                      type="text"
                      placeholder={DEFAULT_OLLAMA_MODEL}
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-800 bg-slate-950 rounded-lg focus:outline-none focus:border-brand-500 text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={saveSettings}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm mt-4 cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
