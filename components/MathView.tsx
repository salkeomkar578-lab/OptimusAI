"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
  label?: string;
}

export function MathView({ math, block = true, className = "", label }: MathViewProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        output: "htmlAndMathml",
      });
    } catch (e: any) {
      console.warn("KaTeX render error:", e);
      return `<code class="font-mono text-indigo-300">${math}</code>`;
    }
  }, [math, block]);

  return (
    <div className={`group relative ${block ? "my-2" : "inline-block"} ${className}`}>
      {label && (
        <span className="block text-[10px] font-mono uppercase tracking-wider text-indigo-400/80 mb-1">
          {label}
        </span>
      )}
      <div
        className={`overflow-x-auto transition-all ${
          block
            ? "p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-slate-100 shadow-inner group-hover:border-indigo-500/40"
            : "inline px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-200"
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
