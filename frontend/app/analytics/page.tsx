"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Clock, 
  ArrowUpRight, 
  Sparkles,
  Award,
  Layers,
  ChevronRight
} from "lucide-react";
import { api, AnalyticsData } from "@/lib/api";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getUserAnalytics("demo-user-1");
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Analytics & Retention Intelligence
            </span>
            <span className="text-xs text-slate-500">Continuous Mastery Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Performance & Exam Readiness
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time syllabus coverage, weak area vulnerability analysis, and spaced repetition heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/planner"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/25"
          >
            <span>Review Timeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Aggregating mastery metrics and session vectors...</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Syllabus Coverage */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Syllabus Coverage</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">{data.coverage_percentage}%</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Active study across {data.total_topics} topics
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                  style={{ width: `${Math.max(data.coverage_percentage, 5)}%` }}
                />
              </div>
            </div>

            {/* Card 2: Average Mastery */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Average Topic Mastery</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">
                  {data.average_mastery.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 10</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Evaluated via adaptive quizzes & study duration
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(data.average_mastery * 10, 5)}%` }}
                />
              </div>
            </div>

            {/* Card 3: Session Completion Rate */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Session Discipline</span>
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">
                  {data.session_stats.completed} <span className="text-sm font-normal text-slate-400">/ {data.session_stats.completed + data.session_stats.scheduled + data.session_stats.skipped}</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {data.session_stats.skipped} sessions adapted & rescheduled
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{
                    width: `${Math.max(
                      (data.session_stats.completed /
                        Math.max(data.session_stats.completed + data.session_stats.skipped, 1)) *
                        100,
                      5
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Card 4: Weak Focus Areas */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Weak Areas Flagged</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">
                  {data.weak_areas.length} <span className="text-sm font-normal text-slate-400">Topics</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Prioritized for upcoming study windows
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-rose-500" style={{ width: "45%" }} />
              </div>
            </div>
          </div>

          {/* Mastery Distribution & Spaced Revision Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mastery Ratio Distribution */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Topic Mastery Distribution</span>
                </h3>
              </div>

              {/* Stacked bar */}
              <div className="space-y-4">
                <div className="w-full h-4 rounded-xl bg-slate-900 overflow-hidden flex">
                  <div
                    style={{
                      width: `${(data.mastery_distribution.mastered / Math.max(data.total_topics, 1)) * 100}%`,
                    }}
                    className="bg-emerald-500 h-full"
                    title={`Mastered: ${data.mastery_distribution.mastered}`}
                  />
                  <div
                    style={{
                      width: `${(data.mastery_distribution.in_progress / Math.max(data.total_topics, 1)) * 100}%`,
                    }}
                    className="bg-amber-500 h-full"
                    title={`In Progress: ${data.mastery_distribution.in_progress}`}
                  />
                  <div
                    style={{
                      width: `${(data.mastery_distribution.needs_attention / Math.max(data.total_topics, 1)) * 100}%`,
                    }}
                    className="bg-rose-500/80 h-full"
                    title={`Needs Attention: ${data.mastery_distribution.needs_attention}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400">Mastered (≥70%)</span>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      {data.mastery_distribution.mastered}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400">In Progress (30-69%)</span>
                    <p className="text-lg font-bold text-amber-400 mt-1">
                      {data.mastery_distribution.in_progress}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400">Needs Focus (&lt;30%)</span>
                    <p className="text-lg font-bold text-rose-400 mt-1">
                      {data.mastery_distribution.needs_attention}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Spaced Revision Heatmap */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>7-Day Spaced Repetition Heatmap</span>
                </h3>
                <span className="text-[11px] text-slate-400">Automated Ebbinghaus Curves</span>
              </div>

              <div className="grid grid-cols-7 gap-2 pt-2">
                {data.revision_heatmap.map((item, idx) => {
                  const count = item.due_count;
                  let bgClass = "bg-slate-900 border-slate-800 text-slate-400";
                  if (count > 2) bgClass = "bg-indigo-600/30 border-indigo-500 text-white font-bold";
                  else if (count > 0) bgClass = "bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold";

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-between text-center min-h-[90px] transition-all ${bgClass}`}
                    >
                      <span className="text-[10px] uppercase">{item.date.slice(0, 3)}</span>
                      <span className="text-xl font-extrabold">{count}</span>
                      <span className="text-[9px] text-slate-400">due</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weak Areas vs High PYQ Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weak Area Focus List */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Weak Area High-Priority Focus</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-800/60">
                {data.weak_areas.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        PYQ Weight: {item.pyq_weight} • Mastery: {(item.mastery_score * 10).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                        Priority: {item.priority.toFixed(1)}
                      </span>
                      <Link
                        href={`/study/${item.id}`}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-800"
                        title="Study Now"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High-Yield PYQs */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>High-Yield Past Exam Topics</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-800/60">
                {data.high_yield_topics.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        Mastery: {(item.mastery_score * 10).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        PYQ: {item.pyq_weight.toFixed(1)} / 10
                      </span>
                      <Link
                        href={`/study/${item.id}`}
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800"
                        title="Study Now"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quiz Performance History */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>Recent Quiz Verification History</span>
            </h3>

            {data.quiz_attempts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No quizzes attempted yet. Head to the Study Room to test your mastery!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Topic</th>
                      <th className="py-2.5 px-3">Score %</th>
                      <th className="py-2.5 px-3">Correct / Total</th>
                      <th className="py-2.5 px-3">Outcome</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {data.quiz_attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-3 font-medium text-white">{attempt.topic_name}</td>
                        <td className="py-3 px-3 font-mono font-bold">{attempt.score_percentage}%</td>
                        <td className="py-3 px-3 text-slate-400">
                          {attempt.correct_answers} / {attempt.total_questions}
                        </td>
                        <td className="py-3 px-3">
                          {attempt.score_percentage >= 70 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              Passed
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                              Needs Review
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
