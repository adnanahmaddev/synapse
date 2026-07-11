"use client";

import React, { useState, useEffect } from 'react';
import { Sliders, Activity } from 'lucide-react';

interface MathVisualizerProps {
  visualizerData?: {
    type: 'linear' | 'sine' | 'interest';
    title: string;
    equation: string;
    params: { name: string; min: number; max: number; defaultValue: number }[];
  };
}

export default function MathVisualizer({ visualizerData }: MathVisualizerProps) {
  const [params, setParams] = useState<Record<string, number>>({});

  // Initialize parameters when data changes
  useEffect(() => {
    if (visualizerData?.params) {
      const initial: Record<string, number> = {};
      visualizerData.params.forEach(p => {
        initial[p.name] = p.defaultValue;
      });
      setParams(initial);
    } else {
      // Default to linear y = mx + c
      setParams({ m: 1, c: 0 });
    }
  }, [visualizerData]);

  if (!visualizerData) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs italic">
        No visualizer parameters available for this lesson.
      </div>
    );
  }

  const { type, title, equation, params: paramConfigs } = visualizerData;

  const handleSliderChange = (name: string, val: number) => {
    setParams(prev => ({ ...prev, [name]: val }));
  };

  // Dimensions of SVG Canvas
  const width = 400;
  const height = 250;
  const padding = 30;

  // Render SVG Path based on parameters
  const renderGraph = () => {
    if (type === 'linear') {
      const m = params.m ?? 1;
      const c = params.c ?? 0;
      
      // Grid dimensions: X goes from -10 to 10, Y goes from -10 to 10
      // Map x [-10, 10] -> [padding, width - padding]
      // Map y [-10, 10] -> [height - padding, padding]
      const toSvgX = (x: number) => padding + ((x + 10) / 20) * (width - 2 * padding);
      const toSvgY = (y: number) => (height - padding) - ((y + 10) / 20) * (height - 2 * padding);

      const x1 = -10;
      const y1 = m * x1 + c;
      const x2 = 10;
      const y2 = m * x2 + c;

      return (
        <line
          x1={toSvgX(x1)}
          y1={toSvgY(y1)}
          x2={toSvgX(x2)}
          y2={toSvgY(y2)}
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );
    }

    if (type === 'sine') {
      const A = params.A ?? 4; // Amplitude
      const f = params.f ?? 1; // Frequency
      
      const toSvgX = (x: number) => padding + ((x + 10) / 20) * (width - 2 * padding);
      const toSvgY = (y: number) => (height - padding) - ((y + 10) / 20) * (height - 2 * padding);

      let points = [];
      for (let x = -10; x <= 10; x += 0.2) {
        const y = A * Math.sin(f * x);
        points.push(`${toSvgX(x)},${toSvgY(y)}`);
      }

      return (
        <path
          d={`M ${points.join(' L ')}`}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      );
    }

    if (type === 'interest') {
      // Compound interest
      // P: principal, r: rate, t: years
      // A = P * (1 + r/100)^x
      const P = params.P ?? 1000;
      const r = params.r ?? 5;
      const t = params.t ?? 10;

      // X scale: 0 to t, Y scale: 0 to P * (1 + r/100)^t
      const finalVal = P * Math.pow(1 + r / 100, t);
      
      const toSvgX = (x: number) => padding + (x / t) * (width - 2 * padding);
      const toSvgY = (y: number) => (height - padding) - (y / finalVal) * (height - 2 * padding);

      let points = [];
      for (let year = 0; year <= t; year += 0.5) {
        const y = P * Math.pow(1 + r / 100, year);
        points.push(`${toSvgX(year)},${toSvgY(y)}`);
      }

      return (
        <>
          {/* Curve */}
          <path
            d={`M ${points.join(' L ')}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Fill under path */}
          <path
            d={`M ${toSvgX(0)},${toSvgY(0)} L ${points.join(' L ')} L ${toSvgX(t)},${toSvgY(0)} Z`}
            fill="url(#indigoGrad)"
            opacity="0.1"
          />
          {/* Endpoint dot */}
          <circle
            cx={toSvgX(t)}
            cy={toSvgY(finalVal)}
            r="5"
            fill="#6366f1"
          />
          <text
            x={toSvgX(t) - 60}
            y={toSvgY(finalVal) - 10}
            fill="#a5b4fc"
            fontSize="9"
            fontWeight="bold"
          >
            ${Math.round(finalVal)}
          </text>
        </>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-[#1e293b] text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="space-y-4 shrink-0 mb-4">
        <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Activity className="w-4.5 h-4.5" />
          Math Slider Playground
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          <code className="text-indigo-300 text-xs font-mono bg-slate-900/60 px-2 py-0.5 rounded-md mt-1 inline-block">
            {equation}
          </code>
        </div>
      </div>

      {/* SVG Canvas Grid */}
      <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-900 flex items-center justify-center p-3 relative min-h-[260px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[250px]">
          <defs>
            <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines (Standard 10x10) */}
          <g stroke="#334155" strokeWidth="0.5" opacity="0.3" strokeDasharray="3">
            {Array.from({ length: 9 }).map((_, i) => {
              const pos = padding + ((i + 1) / 10) * (width - 2 * padding);
              return <line key={i} x1={pos} y1={padding} x2={pos} y2={height - padding} />;
            })}
            {Array.from({ length: 9 }).map((_, i) => {
              const pos = padding + ((i + 1) / 10) * (height - 2 * padding);
              return <line key={i} x1={padding} y1={pos} x2={width - padding} y2={pos} />;
            })}
          </g>

          {/* X & Y Axes */}
          {type !== 'interest' ? (
            <g stroke="#475569" strokeWidth="1.5">
              {/* Y Axis (middle) */}
              <line x1={width / 2} y1={padding} x2={width / 2} y2={height - padding} />
              {/* X Axis (middle) */}
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} />
            </g>
          ) : (
            <g stroke="#475569" strokeWidth="1.5">
              {/* Y Axis (left) */}
              <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
              {/* X Axis (bottom) */}
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
            </g>
          )}

          {/* Axis Labels */}
          {type === 'interest' ? (
            <>
              <text x={padding - 5} y={padding + 5} fill="#64748b" fontSize="8" textAnchor="end">Value</text>
              <text x={width - padding} y={height - padding + 15} fill="#64748b" fontSize="8" textAnchor="middle">Years</text>
            </>
          ) : (
            <>
              <text x={width / 2 + 5} y={padding + 5} fill="#64748b" fontSize="8">y</text>
              <text x={width - padding} y={height / 2 - 5} fill="#64748b" fontSize="8">x</text>
            </>
          )}

          {/* Graph Path Drawing */}
          {renderGraph()}
        </svg>
      </div>

      {/* Parameter Sliders */}
      <div className="space-y-4 mt-5 pt-4 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5" />
          Sliders Controls
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paramConfigs.map((param) => {
            const currentVal = params[param.name] ?? param.defaultValue;
            return (
              <div key={param.name} className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="font-semibold">{param.name}</span>
                  <span className="font-mono text-indigo-400">{currentVal.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={(param.max - param.min) / 100}
                  value={currentVal}
                  onChange={(e) => handleSliderChange(param.name, parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-900 h-1 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>{param.min}</span>
                  <span>{param.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
