"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  CalendarDays, 
  GraduationCap, 
  BarChart3, 
  UploadCloud, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  Layers, 
  ShieldCheck,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import { api, StudySession } from "@/lib/api";
import { MathView } from "@/components/MathView";
import { 
  NextjsLogo, 
  FastAPILogo, 
  PostgreSQLLogo, 
  SupabaseLogo, 
  DockerLogo, 
  RedisLogo, 
  PythonLogo 
} from "@/components/TechLogos";

export default function HomePage() {
  const [nextSession, setNextSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboardPreview();
  }, []);

  const loadDashboardPreview = async () => {
    try {
      setLoading(true);
      const sessions = await api.getUserSessions("demo-user-1");
      const pending = sessions.find((s) => s.status === "scheduled");
      if (pending) {
        setNextSession(pending);
      }
    } catch (err) {
      console.warn("Could not load next session:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* HERO SECTION */}
      <div className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Continuous Adaptive AI Study & Exam Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Convert Raw Syllabi & PYQs Into a{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
            Self-Healing Study Plan
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          OptimusAI continuously adapts your timetable when you miss study sessions or score below target on quizzes. 
          Powered by deterministic constraint scheduling, vector similarity PYQ mapping, and spaced repetition.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/onboarding"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/30 hover:scale-105"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Setup New Course / Syllabus</span>
          </Link>
          <Link
            href="/planner"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-800 hover:border-slate-700 transition-all"
          >
            <CalendarDays className="w-4 h-4 text-indigo-400" />
            <span>Open Adaptive Timeline</span>
          </Link>
        </div>
      </div>

      {/* TECH STACK LOGOS MARQUEE */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800">
        <div className="text-center text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3">
          Verified Production Infrastructure & Architecture Stack
        </div>
        <div className="flex items-center justify-around flex-wrap gap-6 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <NextjsLogo className="w-6 h-6" />
            <span>Next.js 16</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FastAPILogo className="w-6 h-6" />
            <span>FastAPI REST</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <PostgreSQLLogo className="w-6 h-6" />
            <span>PostgreSQL pgvector</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <SupabaseLogo className="w-6 h-6" />
            <span>Supabase Auth & RLS</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <DockerLogo className="w-6 h-6" />
            <span>Docker Multi-Stage</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <RedisLogo className="w-6 h-6" />
            <span>Redis Cache</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <PythonLogo className="w-6 h-6" />
            <span>PyMuPDF OCR</span>
          </div>
        </div>
      </div>

      {/* ACTIVE REPLANNING DEMO HERO BANNER */}
      {nextSession && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-slate-900/90 shadow-2xl shadow-indigo-950/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Next Scheduled Study Session
                </span>
                <span className="text-xs text-slate-500 font-mono">• Availability Slot</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {nextSession.topic_name}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {new Date(nextSession.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} •{" "}
                  {new Date(nextSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                  {new Date(nextSession.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {nextSession.calculated_priority && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono text-[10px] border border-indigo-500/20">
                    Priority {nextSession.calculated_priority.toFixed(1)}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/study/${nextSession.topic_id}`}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Launch Study Room</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MATHEMATICAL PRIORITY FORMULA DISPLAY */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Mathematical Foundation
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              Deterministic Topic Priority Ranking Formula
            </h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Zero LLM Guesswork
          </span>
        </div>

        <MathView
          math="\text{Priority} = (w_1 \times \text{PYQ Weight}) + (w_2 \times (10 - \text{Mastery Score})) + (w_3 \times \text{Exam Urgency}) + (w_4 \times \text{Revision Overdue Penalty})"
          block={true}
          label="Deterministic Priority Function"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-indigo-400 font-bold font-mono">w1 = 0.35</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Past Year Exam Marks & Frequency</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-amber-400 font-bold font-mono">w2 = 0.30</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Student Weakness Deficit</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-sky-400 font-bold font-mono">w3 = 0.20</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Exam Urgency Curve</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-rose-400 font-bold font-mono">w4 = 0.15</span>
            <p className="text-slate-400 text-[11px] mt-0.5">Spaced Retention Overdue Penalty</p>
          </div>
        </div>
      </div>

      {/* CORE ENGINES SHOWCASE */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Engine Architecture
          </h3>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Four Deterministic & Semantic Pillars
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Engine 1 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Semantic AI & PYQ Mapper</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Parses unstructured syllabus PDFs via PyMuPDF/OCR into clean hierarchies. Embeds past exam questions with pgvector cosine similarity to compute high-yield weights.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
              <span>Vector Similarity Matching</span>
            </div>
          </div>

          {/* Engine 2 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Deterministic Priority Engine</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ranks all syllabus topics with a strict mathematical formula. Dynamically calculates urgency curves and penalizes neglected topics.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-sky-400 flex items-center gap-1">
              <span>Zero LLM Hallucination</span>
            </div>
          </div>

          {/* Engine 3 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Constraint Scheduler</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Guarantees hard time constraints. Only books sessions inside student-approved weekly availability windows. Embeds 1, 3, 7, 14-day Spaced Repetition intervals.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-purple-400 flex items-center gap-1">
              <span>Ebbinghaus Retention Curves</span>
            </div>
          </div>

          {/* Engine 4 */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Adaptive Replanning Loop</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                When a session is skipped or a quiz score is &lt;70%, the engine triggers an immediate replan event: penalizes mastery, shoots topic priority up, and reslots it into the next window.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <span>Continuous Self-Healing</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK VIEW SHORTCUTS */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>OptimusAI Core Modules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/syllabus"
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Module 01</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-bold text-white mt-2">Interactive Syllabus Tree</h4>
            <p className="text-xs text-slate-400 mt-1">
              Explore Subject → Unit → Topic hierarchy with PYQ badges, expand/collapse, and mastery meters.
            </p>
          </Link>

          <Link
            href="/planner"
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Module 02</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-bold text-white mt-2">Adaptive Timeline View</h4>
            <p className="text-xs text-slate-400 mt-1">
              Daily and weekly timetable blocks with real-time Complete, Skip, and Judge live simulation triggers.
            </p>
          </Link>

          <Link
            href="/analytics"
            className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Module 03</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-base font-bold text-white mt-2">Analytics & Vulnerability Radar</h4>
            <p className="text-xs text-slate-400 mt-1">
              Coverage percentage, weak area leaderboard, and 7-day retention heatmap.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
