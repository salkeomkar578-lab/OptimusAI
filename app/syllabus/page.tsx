"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Layers, 
  Flame, 
  Clock, 
  Award, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  HelpCircle,
  FileQuestion,
  PlusCircle,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { api, Syllabus, Topic } from "@/lib/api";

export default function SyllabusTreePage() {
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});
  const [selectedTopicPYQs, setSelectedTopicPYQs] = useState<{ topicName: string; questions: any[] } | null>(null);

  // Quick Add Topic Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTopicName, setNewTopicName] = useState<string>("");
  const [newTopicHours, setNewTopicHours] = useState<number>(2.0);
  const [newTopicPYQ, setNewTopicPYQ] = useState<number>(7.5);

  useEffect(() => {
    loadSyllabus();
  }, []);

  const loadSyllabus = async () => {
    try {
      setLoading(true);
      const userSyllabi = await api.getUserSyllabi("demo-user-1");
      if (userSyllabi && userSyllabi.length > 0) {
        setSyllabus(userSyllabi[0]);
      }
    } catch (err) {
      console.error("Failed to load syllabus tree:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = (unitId: string) => {
    setCollapsedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const expandAll = () => {
    setCollapsedUnits({});
  };

  const collapseAll = () => {
    if (!syllabus) return;
    const allUnitIds: Record<string, boolean> = {};
    syllabus.subjects.forEach((s) => {
      s.units.forEach((u) => {
        allUnitIds[u.id] = true;
      });
    });
    setCollapsedUnits(allUnitIds);
  };

  const viewPYQs = async (topicId: string, topicName: string) => {
    try {
      const data = await api.getTopicPYQs(topicId);
      setSelectedTopicPYQs({
        topicName,
        questions: data.questions || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  const bumpMastery = (topicId: string) => {
    if (!syllabus) return;
    const updated = { ...syllabus };
    updated.subjects.forEach((s) => {
      s.units.forEach((u) => {
        u.topics.forEach((t) => {
          if (t.id === topicId) {
            t.user_mastery_score = Math.min(10.0, (t.user_mastery_score || 0) + 1.5);
          }
        });
      });
    });
    setSyllabus(updated);
  };

  const handleAddTopic = () => {
    if (!newTopicName.trim() || !syllabus || syllabus.subjects.length === 0) return;
    const updated = { ...syllabus };
    const targetUnit = updated.subjects[0].units[0];
    if (targetUnit) {
      const newTopic: Topic = {
        id: `custom-${Date.now()}`,
        unit_id: targetUnit.id,
        name: newTopicName,
        description: `Custom topic in ${targetUnit.name}`,
        estimated_hours: newTopicHours,
        pyq_weight_score: newTopicPYQ,
        user_mastery_score: 0.0,
        calculated_priority: 6.8,
        pyq_count: 1,
      };
      targetUnit.topics.push(newTopic);
      setSyllabus(updated);
      setNewTopicName("");
      setShowAddModal(false);
    }
  };

  const getImportanceBadge = (pyqWeight: number) => {
    if (pyqWeight >= 7.0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/20">
          <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
          High PYQ ({pyqWeight.toFixed(1)})
        </span>
      );
    } else if (pyqWeight >= 4.0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Med PYQ ({pyqWeight.toFixed(1)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Low PYQ ({pyqWeight.toFixed(1)})
      </span>
    );
  };

  const getRevisionStatus = (topic: Topic) => {
    if (!topic.next_revision_due) {
      return <span className="text-[11px] text-slate-500">Unstudied</span>;
    }
    const due = new Date(topic.next_revision_due);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 3600);

    if (diffHours < 0) {
      return (
        <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          Revision Overdue
        </span>
      );
    } else if (diffHours < 24) {
      return <span className="text-[11px] font-semibold text-amber-400">Due Today</span>;
    }
    return (
      <span className="text-[11px] text-sky-400">
        Due in {Math.ceil(diffHours / 24)}d
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Interactive Hierarchy Tree
            </span>
            <span className="text-xs text-slate-500">Subject → Unit → Topic</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {syllabus ? syllabus.title : "Curriculum Syllabus Tree"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic prioritization ranking based on past exam question weights and spaced retention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-medium transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Add Topic</span>
          </button>
          <Link
            href="/planner"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/25"
          >
            <span>View Timeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter, Search & Tree Controls Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics, units, or concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Tree Expand / Collapse controls */}
          <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              onClick={expandAll}
              className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 text-xs"
              title="Expand All Units"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAll}
              className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800 text-xs"
              title="Collapse All Units"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: "all", label: "All Topics" },
            { id: "high", label: "High PYQ Only" },
            { id: "weak", label: "Weak Mastery (<50%)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setImportanceFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                importanceFilter === f.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hierarchy Render */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading syllabus vector structure...</p>
        </div>
      ) : !syllabus || syllabus.subjects.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl mt-8">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Syllabus Uploaded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Upload your course syllabus or past exam papers to generate your interactive hierarchy.
          </p>
          <Link
            href="/onboarding"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Start Setup Wizard
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {syllabus.subjects.map((subject) => (
            <div key={subject.id} className="space-y-4">
              {/* Subject Title */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {subject.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{subject.name}</h2>
                  <p className="text-xs text-slate-400">
                    {subject.units.length} Units •{" "}
                    {subject.units.reduce((acc, u) => acc + u.topics.length, 0)} Core Topics
                  </p>
                </div>
              </div>

              {/* Units */}
              <div className="space-y-4 pl-4 border-l-2 border-indigo-500/20">
                {subject.units.map((unit) => {
                  const isCollapsed = collapsedUnits[unit.id];
                  
                  // Filter topics
                  const filteredTopics = unit.topics.filter((t) => {
                    const matchesQuery = t.name.toLowerCase().includes(searchQuery.toLowerCase());
                    if (!matchesQuery) return false;
                    if (importanceFilter === "high") return (t.pyq_weight_score || 0) >= 7.0;
                    if (importanceFilter === "weak") return (t.user_mastery_score || 0) < 5.0;
                    return true;
                  });

                  if (filteredTopics.length === 0 && searchQuery) return null;

                  return (
                    <div
                      key={unit.id}
                      className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden"
                    >
                      {/* Unit Header Bar */}
                      <button
                        onClick={() => toggleUnit(unit.id)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-indigo-400" />
                          )}
                          <span className="font-semibold text-sm text-slate-200">{unit.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {filteredTopics.length} Topics
                          </span>
                        </div>
                      </button>

                      {/* Topics Table / Cards */}
                      {!isCollapsed && (
                        <div className="divide-y divide-slate-800/50 bg-slate-950/40">
                          {filteredTopics.map((topic) => {
                            const masteryPct = Math.round(((topic.user_mastery_score || 0) / 10) * 100);

                            return (
                              <div
                                key={topic.id}
                                className="p-4 sm:px-6 hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                {/* Left Topic Info */}
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-semibold text-sm text-white">{topic.name}</h4>
                                    {getImportanceBadge(topic.pyq_weight_score || 0)}
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                                      Priority: {topic.calculated_priority?.toFixed(1) || "5.0"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 line-clamp-1">
                                    {topic.description || `Comprehensive examination review for ${topic.name}`}
                                  </p>
                                </div>

                                {/* Right Stats & Actions */}
                                <div className="flex flex-wrap items-center gap-5 shrink-0">
                                  {/* Mastery Progress Bar with quick click to bump */}
                                  <div
                                    onClick={() => bumpMastery(topic.id)}
                                    className="w-32 cursor-pointer group"
                                    title="Click to bump mastery score (+1.5)"
                                  >
                                    <div className="flex justify-between text-[11px] mb-1">
                                      <span className="text-slate-400 group-hover:text-indigo-300">Mastery</span>
                                      <span className="font-semibold text-slate-200">{masteryPct}%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          masteryPct >= 70
                                            ? "bg-emerald-500"
                                            : masteryPct >= 40
                                            ? "bg-amber-500"
                                            : "bg-indigo-500"
                                        }`}
                                        style={{ width: `${Math.max(masteryPct, 4)}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Spaced Repetition Due */}
                                  <div className="text-right min-w-[90px]">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Retention</p>
                                    <div>{getRevisionStatus(topic)}</div>
                                  </div>

                                  {/* PYQ Drawer button */}
                                  <button
                                    onClick={() => viewPYQs(topic.id, topic.name)}
                                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors"
                                    title="View Mapped Past Questions"
                                  >
                                    <FileQuestion className="w-4 h-4" />
                                  </button>

                                  {/* Direct Launch to Study Room */}
                                  <Link
                                    href={`/study/${topic.id}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                                  >
                                    <span>Study & Quiz</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK ADD TOPIC MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span>Add Syllabus Topic</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Topic Name</label>
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Paxos"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTopicHours}
                    onChange={(e) => setNewTopicHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">PYQ Weight (0-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="10"
                    min="0"
                    value={newTopicPYQ}
                    onChange={(e) => setNewTopicPYQ(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTopic}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Insert Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mapped PYQ Questions Modal */}
      {selectedTopicPYQs && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  Semantic PYQ Mappings
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedTopicPYQs.topicName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTopicPYQs(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            {selectedTopicPYQs.questions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No past year questions directly matched this topic.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedTopicPYQs.questions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-amber-400">
                        Weight: {q.weight} Marks
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400">
                        Vector Match: {(q.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-sans">{q.question_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
