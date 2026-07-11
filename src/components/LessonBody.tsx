"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LessonBodyProps {
  title: string;
  content: string;
}

export default function LessonBody({ title, content }: LessonBodyProps) {
  return (
    <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-3 leading-tight tracking-tight">
        {title}
      </h1>

      {/* Markdown Text */}
      <div className="text-sm space-y-4 markdown-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({node, ...props}) => <h2 className="text-base font-bold text-slate-800 mt-6 mb-2" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-slate-800 mt-4 mb-2" {...props} />,
            p: ({node, ...props}) => <p className="mb-3 text-slate-600 text-sm leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 text-slate-600 mb-3 text-sm" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 text-slate-600 mb-3 text-sm" {...props} />,
            li: ({node, ...props}) => <li className="pl-0.5" {...props} />,
            code: ({node, className, children, ...props}) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed my-3 border border-slate-800 shadow-inner">
                  <code className="block" {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-4 rounded-xl border border-slate-100 shadow-xs">
                <table className="min-w-full divide-y divide-slate-200" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
            th: ({node, ...props}) => <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider" {...props} />,
            tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
            td: ({node, ...props}) => <td className="px-4 py-2 text-xs text-slate-600" {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/40 px-4 py-2.5 rounded-r-lg text-slate-600 italic my-3 text-xs" {...props} />
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
