"use client";

import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Network, AlertCircle, RefreshCw } from 'lucide-react';

// Initialize mermaid library
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#1e293b',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    lineColor: '#475569',
    secondaryColor: '#475569',
  }
});

interface MermaidDiagramProps {
  mermaidCode?: string;
}

export default function MermaidDiagram({ mermaidCode }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate unique render ID
  const renderId = useRef(`mermaid-diagram-${Math.floor(Math.random() * 100000)}`);

  const renderDiagram = async () => {
    if (!mermaidCode) {
      setSvgContent('');
      setError(null);
      return;
    }

    try {
      setError(null);
      // Clean mermaid code block brackets from dynamic models
      const cleanCode = mermaidCode
        .replace(/```mermaid\s*|```\s*/g, '')
        .trim();

      // Render SVGs using mermaid API
      const { svg } = await mermaid.render(renderId.current, cleanCode);
      setSvgContent(svg);
    } catch (err: any) {
      console.error("Mermaid parsing error:", err);
      setError("AI-generated diagram syntax error. Clicking below resets diagram.");
      
      // Clean up the DOM element mermaid leaves behind in case of errors
      const badElement = document.getElementById(renderId.current);
      if (badElement) {
        badElement.remove();
      }
    }
  };

  useEffect(() => {
    // Small delay to ensure container element is mounted
    const timeout = setTimeout(() => {
      renderDiagram();
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [mermaidCode]);

  const handleRetry = () => {
    // Generate new ID to clear old mermaid states
    renderId.current = `mermaid-diagram-${Math.floor(Math.random() * 100000)}`;
    renderDiagram();
  };

  return (
    <div className="w-full bg-[#1e293b] text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="space-y-4 shrink-0 mb-4">
        <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Network className="w-4.5 h-4.5" />
          Interactive Flowchart & Mind-Map
        </div>
      </div>

      {/* SVG Output Display */}
      <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-900 overflow-auto flex items-center justify-center p-6 relative min-h-[300px]">
        {error ? (
          <div className="text-center p-6 space-y-3 max-w-xs">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={handleRetry}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold border border-slate-800 rounded-lg text-[10px] flex items-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Force Render
            </button>
          </div>
        ) : svgContent ? (
          <div 
            ref={containerRef}
            className="w-full h-full flex items-center justify-center mermaid-svg-container select-none text-slate-200"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="text-center text-slate-500 text-xs italic">
            Parsing diagram components...
          </div>
        )}
      </div>
    </div>
  );
}
