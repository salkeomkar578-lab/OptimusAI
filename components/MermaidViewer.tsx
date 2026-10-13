"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidViewerProps {
  chart: string;
}

export function MermaidViewer({ chart }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#0f172a",
        primaryColor: "#6366f1",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#4f46e5",
        lineColor: "#38bdf8",
        secondaryColor: "#1e293b",
        tertiaryColor: "#090d16",
        fontFamily: "inherit",
      },
      securityLevel: "loose",
    });

    const renderChart = async () => {
      try {
        setError(null);
        const cleanChart = chart.trim();
        if (!cleanChart) return;
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanChart);
        setSvgContent(svg);
      } catch (err: any) {
        console.warn("Mermaid render error:", err);
        setError("Diagram rendering unavailable for custom expression.");
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">Architecture Graph Schema:</p>
        <pre className="overflow-x-auto text-indigo-300 font-mono text-[11px] p-2 bg-slate-950 rounded">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex justify-center items-center min-h-[220px]">
      {svgContent ? (
        <div
          ref={containerRef}
          className="mermaid-output max-w-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <div className="text-xs text-slate-500 animate-pulse">Rendering Concept Architecture...</div>
      )}
    </div>
  );
}
