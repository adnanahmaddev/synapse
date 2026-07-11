"use client";

import React, { useState, useEffect } from 'react';
import { HelpCircle, Check, X, AlertCircle } from 'lucide-react';

interface QuizCardProps {
  quizData?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export default function QuizCard({ quizData }: QuizCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Reset state when quizData changes
  useEffect(() => {
    setSelectedIdx(null);
    setSubmitted(false);
  }, [quizData]);

  if (!quizData) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic">
        No quiz parameters available for this lesson.
      </div>
    );
  }

  const { question, options, correctIndex, explanation } = quizData;

  const handleOptionClick = (idx: number) => {
    if (submitted) return;
    setSelectedIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedIdx === null) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setSubmitted(false);
  };

  return (
    <div className="w-full bg-[#1e293b] text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6 flex flex-col justify-between h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Header Badge */}
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Lesson Quiz Checkpoint
        </div>

        {/* Question Text */}
        <h3 className="text-base font-bold text-white leading-relaxed">
          {question}
        </h3>

        {/* Options */}
        <div className="space-y-2.5">
          {options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === correctIndex;
            
            let btnClass = "border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300";
            let iconElement = null;

            if (submitted) {
              if (isCorrect) {
                btnClass = "border-emerald-500 bg-emerald-950/40 text-emerald-300 font-semibold";
                iconElement = <Check className="w-4 h-4 text-emerald-400 shrink-0" />;
              } else if (isSelected) {
                btnClass = "border-rose-500 bg-rose-950/40 text-rose-300 font-semibold";
                iconElement = <X className="w-4 h-4 text-rose-400 shrink-0" />;
              } else {
                btnClass = "border-slate-800 bg-slate-900/40 text-slate-500 opacity-60";
              }
            } else if (isSelected) {
              btnClass = "border-indigo-500 bg-indigo-950/40 text-indigo-300 font-semibold";
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => handleOptionClick(idx)}
                className={`w-full text-left text-xs p-3.5 rounded-xl border flex justify-between items-center gap-3 transition-all cursor-pointer ${btnClass}`}
              >
                <span>{option}</span>
                {iconElement}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Zone & Feedback */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIdx === null}
            className={`w-full py-3 px-4 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 ${
              selectedIdx === null
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-800'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99] cursor-pointer'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-4">
            {/* Feedback alert */}
            <div className={`p-4 rounded-xl border text-xs flex gap-3 leading-relaxed animate-fade-in ${
              selectedIdx === correctIndex
                ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/20 bg-rose-950/20 text-rose-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 text-current mt-0.5" />
              <div>
                <p className="font-bold mb-1.5">
                  {selectedIdx === correctIndex ? 'Correct! Excellent job.' : 'Not quite right. Let\'s learn why:'}
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{explanation}</p>
              </div>
            </div>

            {/* Try Again / Reset button */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-xs transition-all cursor-pointer"
            >
              Reset Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
