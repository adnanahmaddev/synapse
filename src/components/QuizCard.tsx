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
  onPass?: () => void;
}

export default function QuizCard({ quizData, onPass }: QuizCardProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Reset state when quizData changes
  useEffect(() => {
    setSelectedIdx(null);
    setSubmitted(false);
  }, [quizData]);

  if (!quizData) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200">
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
    if (selectedIdx === correctIndex && onPass) {
      onPass();
    }
  };

  const handleReset = () => {
    setSelectedIdx(null);
    setSubmitted(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        {/* Header Badge */}
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Lesson Quiz Checkpoint
        </div>

        {/* Question Text */}
        <h3 className="text-base font-bold text-slate-900 leading-relaxed">
          {question}
        </h3>

        {/* Options */}
        <div className="space-y-2">
          {options.map((option, idx) => {
            const isSelected = selectedIdx === idx;
            const isCorrect = idx === correctIndex;
            
            let btnClass = "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700";
            let iconElement = null;
 
            if (submitted) {
              if (isCorrect) {
                btnClass = "border-brand-500 bg-brand-50 text-brand-800 font-semibold";
                iconElement = <Check className="w-4 h-4 text-brand-600 shrink-0" />;
              } else if (isSelected) {
                btnClass = "border-rose-500 bg-rose-50 text-rose-800 font-semibold";
                iconElement = <X className="w-4 h-4 text-rose-600 shrink-0" />;
              } else {
                btnClass = "border-slate-100 bg-white text-slate-400 opacity-60";
              }
            } else if (isSelected) {
              btnClass = "border-brand-500 bg-brand-50 text-brand-800 font-semibold";
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
      <div className="space-y-4">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIdx === null}
            className={`w-full py-3 px-4 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
              selectedIdx === null
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-brand-600 hover:bg-brand-700 text-white active:scale-[0.99] cursor-pointer shadow-sm'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <div className="space-y-4">
            {/* Feedback alert */}
            <div className={`p-4 rounded-xl border text-xs flex gap-3 leading-relaxed animate-fade-in ${
              selectedIdx === correctIndex
                ? 'border-brand-100 bg-brand-50/30 text-brand-800'
                : 'border-rose-200 bg-rose-50/30 text-rose-800'
            }`}>
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-current mt-0.5" />
              <div>
                <p className="font-bold mb-1">
                  {selectedIdx === correctIndex ? 'Correct! Excellent job.' : 'Not quite right. Let\'s learn why:'}
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">{explanation}</p>
              </div>
            </div>

            {/* Try Again / Reset button */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs transition-all cursor-pointer"
            >
              Reset Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
