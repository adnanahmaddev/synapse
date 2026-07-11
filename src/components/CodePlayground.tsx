"use client";

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Code, Eye } from 'lucide-react';
import { DEFAULT_PLAYGROUND_TEMPLATES } from '@/utils/constants';

interface CodePlaygroundProps {
  codeTemplate?: {
    html: string;
    css: string;
    js: string;
  };
}

export default function CodePlayground({ codeTemplate }: CodePlaygroundProps) {
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [srcDoc, setSrcDoc] = useState('');

  // Initialize templates
  useEffect(() => {
    if (codeTemplate) {
      setHtml(codeTemplate.html || '');
      setCss(codeTemplate.css || '');
      setJs(codeTemplate.js || '');
    } else {
      // Defaults
      setHtml(DEFAULT_PLAYGROUND_TEMPLATES.html);
      setCss(DEFAULT_PLAYGROUND_TEMPLATES.css);
      setJs(DEFAULT_PLAYGROUND_TEMPLATES.js);
    }
  }, [codeTemplate]);

  // Compile full code document
  const compileCode = () => {
    const doc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          // Redirect console logs to page for visibility if desired
          try {
            ${js}
          } catch(err) {
            document.body.innerHTML += '<div style="color: #ef4444; font-family: monospace; font-size: 11px; padding: 10px; margin-top: 10px; border: 1px solid #ef4444; border-radius: 6px; background: #fef2f2;">Error: ' + err.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
    setSrcDoc(doc);
  };

  // Compile on run or changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      compileCode();
    }, 800); // Debounce compilation to prevent freezing on typing
    return () => clearTimeout(timeout);
  }, [html, css, js]);

  const handleReset = () => {
    if (codeTemplate) {
      setHtml(codeTemplate.html || '');
      setCss(codeTemplate.css || '');
      setJs(codeTemplate.js || '');
    }
  };

  return (
    <div className="w-full bg-[#1e293b] text-slate-100 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Editor Header Control strip */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Code className="w-4 h-4 text-indigo-400" />
          Web Sandbox Editor
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-[10px] flex items-center gap-1 cursor-pointer"
            title="Reset to default code template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={compileCode}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
          >
            <Play className="w-3 h-3 fill-current" />
            Run
          </button>
        </div>
      </div>

      {/* Editor Panel Split */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Editor Zone */}
        <div className="flex-1 flex flex-col min-h-0 border-b border-slate-800">
          {/* Tab selectors */}
          <div className="bg-slate-900 flex text-xs shrink-0 border-b border-slate-800/40">
            {(['html', 'css', 'js'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 font-semibold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-indigo-500 bg-slate-800/40 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                }`}
              >
                {tab === 'js' ? 'JavaScript' : tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Textareas */}
          <div className="flex-1 relative min-h-0">
            {activeTab === 'html' && (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 bg-slate-950 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                placeholder="<!-- Enter HTML here -->"
              />
            )}
            {activeTab === 'css' && (
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 bg-slate-950 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                placeholder="/* Enter CSS here */"
              />
            )}
            {activeTab === 'js' && (
              <textarea
                value={js}
                onChange={(e) => setJs(e.target.value)}
                className="absolute inset-0 w-full h-full p-4 bg-slate-950 font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                placeholder="// Enter JavaScript here"
              />
            )}
          </div>
        </div>

        {/* Live Preview Zone */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 shrink-0 select-none">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            Live Preview Output
          </div>
          <iframe
            title="sandbox-preview"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="flex-1 w-full border-none bg-white"
          />
        </div>
      </div>
    </div>
  );
}
