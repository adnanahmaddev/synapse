"use client";

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, Send } from 'lucide-react';

interface ActiveRecallProps {
  lessonId: string;
  lessonConcept: string;
  lessonContent: string;
  onPass: () => void;
  isCompleted: boolean;
}

export default function ActiveRecall({
  lessonId,
  lessonConcept,
  lessonContent,
  onPass,
  isCompleted
}: ActiveRecallProps) {
  const [summary, setSummary] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clear inputs when switching lessons
  useEffect(() => {
    setSummary('');
    setEvalResult(null);
    setError(null);
  }, [lessonId]);

  const handleEvaluate = async () => {
    if (!summary.trim()) return;

    setEvalLoading(true);
    setError(null);
    setEvalResult(null);

    try {
      // Get Model config
      let modelConfig = { provider: 'gemini' };
      const storedConfig = localStorage.getItem('fenzo_model_config');
      if (storedConfig) {
        modelConfig = JSON.parse(storedConfig);
      }

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonConcept,
          lessonContent,
          userSummary: summary,
          modelConfig
        })
      });

      if (!response.ok) {
        const errText = await response.json();
        throw new Error(errText.error || "Failed to evaluate recall.");
      }

      const data = await response.json();
      setEvalResult(data);

      // If score is >= 75, trigger lesson completion
      if (data.score >= 75) {
        onPass();
      }

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong during grading. Please try again.");
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div className="w-full border border-slate-100 bg-white rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider">
          <Award className="w-4.5 h-4.5" />
          Active Recall Checkpoint
        </div>
        {isCompleted && (
          <span className="text-[10px] bg-brand-50 text-brand-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-100">
            <CheckCircle className="w-3 h-3" /> Passed
          </span>
        )}
      </div>

      {/* Intro Text */}
      <div className="text-slate-500 text-[11px] leading-relaxed">
        To lock in this concept, type a brief summary of what you learned in your own words. We will evaluate your understanding and give you immediate feedback.
      </div>

      {/* Input or Output panel */}
      {!evalResult && !evalLoading ? (
        <div className="space-y-3">
          <textarea
            className="w-full min-h-[90px] p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 text-slate-800 placeholder-slate-400 leading-relaxed resize-none"
            placeholder="Summarize the core concept in your own words..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleEvaluate();
              }
            }}
          />
          <button
            onClick={handleEvaluate}
            disabled={!summary.trim()}
            className={`w-full py-2.5 px-4 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              !summary.trim()
                ? 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
            }`}
          >
            Submit Recall Check
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : evalLoading ? (
        /* Loading skeleton */
        <div className="space-y-3 py-2 animate-pulse">
          <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
          <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
          <div className="h-8 bg-slate-100 rounded-lg w-full"></div>
        </div>
      ) : (
        /* Grading results */
        <div className="space-y-4 animate-fade-in text-xs">
          {/* Score Circle & Status */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="relative flex items-center justify-center">
              {/* Radial Score */}
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                <circle 
                  cx="24" 
                  cy="24" 
                  r="20" 
                  stroke={evalResult.score >= 75 ? "#10b981" : "#f59e0b"} 
                  strokeWidth="4" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - evalResult.score / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-[11px] font-extrabold text-slate-700">
                {evalResult.score}%
              </span>
            </div>
            
            <div>
              <div className="font-bold text-slate-800">
                {evalResult.score >= 75 ? 'Recall Approved!' : 'Needs Review'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                {evalResult.score >= 75 
                  ? 'Great job! You demonstrated a solid grasp of the core concepts.' 
                  : 'Try incorporating details mentioned in the gaps list below to raise your score.'}
              </div>
            </div>
          </div>

          {/* Correct items */}
          {evalResult.correctPoints?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-brand-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                Key Concepts Retained
              </span>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                {evalResult.correctPoints.map((pt: string, idx: number) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Gaps / Misconceptions */}
          {evalResult.gaps?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Understanding Gaps
              </span>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                {evalResult.gaps.map((pt: string, idx: number) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {evalResult.suggestions && (
            <div className="p-3 bg-brand-50/50 border border-brand-100/50 text-[11px] text-slate-600 rounded-xl leading-relaxed flex gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-brand-500 mt-0.5" />
              <span>{evalResult.suggestions}</span>
            </div>
          )}

          {/* Buttons */}
          <button
            onClick={() => setEvalResult(null)}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Grading Again
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[11px] text-center border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
