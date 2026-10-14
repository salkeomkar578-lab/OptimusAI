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
  Minimize2,
  UploadCloud,
  FileText,
  Cpu,
  Zap,
  Key,
  RefreshCw,
  Check,
  AlertCircle
} from "lucide-react";
import { api, Syllabus, Topic, Subject } from "@/lib/api";

export default function SyllabusTreePage() {
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [allSyllabi, setAllSyllabi] = useState<Syllabus[]>([]);
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

  // AI Upload & Parse Modal State
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTab, setUploadTab] = useState<"paste" | "file">("paste");
  const [inputTitle, setInputTitle] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("gemini");
  const [inlineApiKey, setInlineApiKey] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseStepMessage, setParseStepMessage] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // AI Configuration Modal State
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [aiStatus, setAIStatus] = useState<any>(null);
  const [configProvider, setConfigProvider] = useState<string>("gemini");
  const [configKey, setConfigKey] = useState<string>("");
  const [configLoading, setConfigLoading] = useState<boolean>(false);
  const [configMsg, setConfigMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  useEffect(() => {
    loadSyllabus();
    loadAIStatus();
  }, []);

  const loadAIStatus = async () => {
    try {
      const status = await api.getAIStatus();
      setAIStatus(status);
    } catch (e) {
      console.warn("Could not load AI status:", e);
    }
  };

  const loadSyllabus = async () => {
    try {
      setLoading(true);
      const activeUserId = api.getActiveUserId();
      const userSyllabi = await api.getUserSyllabi(activeUserId);
      if (userSyllabi && userSyllabi.length > 0) {
        setAllSyllabi(userSyllabi);
        setSyllabus(userSyllabi[0]);
      }
    } catch (err) {
      console.error("Failed to load syllabus tree:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSyllabus = (syl: Syllabus) => {
    setSyllabus(syl);
    if (typeof window !== "undefined") {
      localStorage.setItem("optimus_active_syllabus", JSON.stringify(syl));
      localStorage.setItem("optimus_active_syllabus_id", syl.id);
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

  // Preview syllabus structure before saving
  const handlePreviewParse = async () => {
    if (!inputText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const titleToUse = inputTitle.trim() || "Course Syllabus";
      const res = await api.previewSyllabus(inputText, titleToUse);
      if (res && res.parsed) {
        setPreviewData(res.parsed);
      }
    } catch (e: any) {
      setParseError(e.message || "Preview failed");
    } finally {
      setIsParsing(false);
    }
  };

  // Upload and execute full AI extraction
  const handleUploadSyllabus = async () => {
    if (uploadTab === "paste" && !inputText.trim()) {
      setParseError("Please paste or type your syllabus text.");
      return;
    }
    if (uploadTab === "file" && !inputFile) {
      setParseError("Please select a syllabus document or PDF file.");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseStepMessage("Extracting text and initializing semantic AI...");

    try {
      const activeUserId = api.getActiveUserId();
      const titleToUse = inputTitle.trim() || (inputFile ? inputFile.name.replace(/\.[^/.]+$/, "") : "Course Syllabus");

      const formData = new FormData();
      formData.append("user_id", activeUserId);
      formData.append("title", titleToUse);
      formData.append("ai_provider", selectedProvider);
      if (inlineApiKey.trim()) {
        formData.append("api_key", inlineApiKey.trim());
      }

      if (uploadTab === "file" && inputFile) {
        formData.append("file", inputFile);
        setParseStepMessage("Parsing document via OCR & PyMuPDF...");
      } else {
        formData.append("raw_text", inputText);
        setParseStepMessage("Organizing modules and topic hierarchy with AI...");
      }

      const res = await api.uploadSyllabus(formData);

      setParseStepMessage("Generating dense vector embeddings & calibrating priorities...");
      
      // If server returned the tree directly, use it
      if (res.tree) {
        setSyllabus(res.tree);
        setAllSyllabi((prev) => [res.tree!, ...prev.filter((p) => p.id !== res.tree!.id)]);
      } else if (res.syllabus_id) {
        const loaded = await api.getSyllabusTree(res.syllabus_id);
        setSyllabus(loaded);
        setAllSyllabi((prev) => [loaded, ...prev.filter((p) => p.id !== loaded.id)]);
      }

      // Close modal and reset
      setShowUploadModal(false);
      setInputText("");
      setInputFile(null);
      setPreviewData(null);
      loadAIStatus();
    } catch (err: any) {
      console.error("Upload error:", err);
      setParseError(err.message || "Failed to process syllabus. Please check your text or connection.");
    } finally {
      setIsParsing(false);
      setParseStepMessage("");
    }
  };

  // Configure AI API key
  const handleSaveAIConfig = async () => {
    if (!configKey.trim()) {
      setConfigMsg({ type: "error", text: "Please enter a valid API key." });
      return;
    }
    setConfigLoading(true);
    setConfigMsg(null);
    try {
      const res = await api.configureAI(configProvider, configKey.trim());
      if (res.status === "success") {
        setConfigMsg({ type: "success", text: res.message || "AI connected successfully!" });
        loadAIStatus();
      } else {
        setConfigMsg({ type: "warning", text: res.message || "Key saved, but validation warning." });
      }
    } catch (e: any) {
      setConfigMsg({ type: "error", text: e.message || "Failed to configure AI provider." });
    } finally {
      setConfigLoading(false);
    }
  };

  const fillSampleTemplate = (type: "cs" | "bio" | "chem" | "math") => {
    if (type === "bio") {
      setInputTitle("Human Anatomy & Physiology");
      setInputText(`Course: Human Anatomy & Physiology
Unit 1: Skeletal System and Bone Homeostasis
- Compact and Spongy Bone Microstructure
- Bone Remodeling and Calcium Regulation
- Axial and Appendicular Skeletal Mechanics
Unit 2: Muscular System & Biomechanics
- Sliding Filament Theory and Actin-Myosin Crossbridges
- Neuromuscular Junction and Acetylcholine Dynamics
- Motor Unit Recruitment and Muscle Fatigue
Unit 3: Cardiovascular and Respiratory Integration
- Cardiac Cycle, Pacemaker Potentials, and ECG
- Hemodynamics and Systemic Blood Pressure Regulation
- Alveolar Gas Exchange and Oxygen-Hemoglobin Dissociation`);
    } else if (type === "chem") {
      setInputTitle("Organic Chemistry & Reaction Mechanisms");
      setInputText(`Subject: Organic Chemistry
Unit 1: Structure and Chemical Bonding
- Hybridization, Molecular Orbitals, and Resonance
- Acid-Base Equilibria and pKa Values in Organic Systems
- Stereochemistry, Chirality, and Enantiomeric Resolution
Unit 2: Substitution and Elimination Reactions
- SN1 vs SN2 Mechanisms, Kinetics, and Stereochemical Inversion
- E1 and E2 Elimination Pathways and Zaitsev's Rule
- Solvent Effects and Nucleophilicity Trends
Unit 3: Carbonyl Chemistry and Synthesis
- Nucleophilic Addition to Aldehydes and Ketones
- Carboxylic Acid Derivatives and Nucleophilic Acyl Substitution
- Enolate Alkylation and Aldol Condensations`);
    } else if (type === "math") {
      setInputTitle("Linear Algebra & Vector Calculus");
      setInputText(`Subject: Linear Algebra & Multivariable Calculus
Unit 1: Vector Spaces & Linear Transformations
- Vector Spaces, Subspaces, and Linear Independence
- Basis, Dimension, and Rank-Nullity Theorem
- Linear Mappings, Matrix Representations, and Change of Basis
Unit 2: Eigenvalues, Diagonalization & Inner Products
- Characteristic Polynomial and Eigenspaces
- Orthogonality, Gram-Schmidt Process, and QR Factorization
- Symmetric Matrices and Singular Value Decomposition (SVD)
Unit 3: Vector Calculus & Field Theorems
- Gradient, Divergence, and Curl Formulations
- Line Integrals and Conservative Vector Fields
- Green's Theorem, Stokes' Theorem, and Gauss Divergence`);
    } else {
      setInputTitle("Operating Systems & Concurrency");
      setInputText(`Course: Modern Operating Systems
Unit 1: Process Management and Threading
- Process Control Blocks, States, and Context Switching
- POSIX Threads, Kernel vs User-Level Threading
- CPU Scheduling Algorithms (CFS, Multi-Level Feedback Queues)
Unit 2: Synchronization, Race Conditions & Deadlocks
- Critical Section Problem, Mutexes, and Semaphores
- Classical Synchronization Problems (Readers-Writers, Dining Philosophers)
- Deadlock Characterization, Banker's Algorithm, and Recovery
Unit 3: Memory Hierarchy and Storage Systems
- Virtual Memory, Paging, and Translation Lookaside Buffers (TLB)
- Page Replacement Algorithms (LRU, Clock, Second-Chance)
- File System Layout, Inodes, and Journaled File Systems`);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Interactive Hierarchy Tree
            </span>
            <span className="text-xs text-slate-500">Subject → Unit → Topic</span>

            {/* AI Engine Status Pill Button */}
            <button
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-sky-500/10 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 transition-all cursor-pointer"
              title="Click to view or configure AI Model settings"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>
                AI Engine: {aiStatus?.active_provider === "gemini" ? "Google Gemini" : aiStatus?.active_provider === "groq" ? "Groq LLaMA 3.3" : aiStatus?.active_provider === "openai" ? "OpenAI GPT-4o" : "Semantic NLP Engine"}
              </span>
              <Key className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
            </button>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {syllabus ? syllabus.title : "Curriculum Syllabus Tree"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Give any syllabus or exam paper — OptimusAI extracts and structures topics into an adaptive learning roadmap.
          </p>

          {/* Course / Syllabus Switcher if user has multiple */}
          {allSyllabi.length > 1 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Your Courses:</span>
              {allSyllabi.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSyllabus(s)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    syllabus?.id === s.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Upload / Import Button */}
          <button
            onClick={() => {
              setShowUploadModal(true);
              setParseError(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Upload Syllabus with AI</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-medium transition-all"
          >
            <PlusCircle className="w-4 h-4 text-indigo-400" />
            <span>Add Topic</span>
          </button>

          <Link
            href="/planner"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-medium transition-all"
          >
            <span>Timeline</span>
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
        <div className="py-20 text-center glass-panel rounded-3xl mt-8 p-8">
          <BookOpen className="w-14 h-14 text-indigo-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">No Syllabus Uploaded Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
            Paste your course syllabus or upload a document to let OptimusAI structure your units, topics, and exam priorities.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upload Syllabus with AI</span>
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {syllabus.subjects.map((subject) => (
            <div key={subject.id} className="space-y-4">
              {/* Subject Title */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {subject.name[0] || "S"}
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

      {/* AI UPLOAD & PARSE SYLLABUS MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-indigo-500/30 p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-950/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Upload & AI Organize Syllabus</h3>
                  <p className="text-xs text-slate-400">OptimusAI will extract Subjects, Units, and Topics automatically</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Sample Curriculums:
              </span>
              <button
                type="button"
                onClick={() => fillSampleTemplate("bio")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
              >
                🧬 Biology
              </button>
              <button
                type="button"
                onClick={() => fillSampleTemplate("chem")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
              >
                🧪 Chemistry
              </button>
              <button
                type="button"
                onClick={() => fillSampleTemplate("math")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
              >
                📐 Mathematics
              </button>
              <button
                type="button"
                onClick={() => fillSampleTemplate("cs")}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
              >
                💻 Computer Science
              </button>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Course / Exam Title
              </label>
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="e.g. Molecular Genetics & Evolution or Advanced Algorithms"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tabs for Upload Method */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setUploadTab("paste")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  uploadTab === "paste"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text / Syllabus</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("file")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  uploadTab === "file"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload PDF / Document</span>
              </button>
            </div>

            {uploadTab === "paste" ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Paste Syllabus Content
                </label>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your course outline, modules, or chapter list here... Any structure or plain text is accepted!"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition-colors">
                <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs text-white font-medium">Select PDF or Syllabus File</p>
                <p className="text-[11px] text-slate-500 mt-1">PyMuPDF will automatically extract all pages and text</p>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setInputFile(e.target.files?.[0] || null)}
                  className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                />
                {inputFile && (
                  <p className="text-xs text-emerald-400 mt-2 font-medium">Selected: {inputFile.name}</p>
                )}
              </div>
            )}

            {/* Optional AI Key Override */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300">Target AI Engine:</span>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="groq">Groq LLaMA 3.3</option>
                  <option value="openai">OpenAI GPT-4o-mini</option>
                  <option value="auto">Auto Select</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(true)}
                className="text-indigo-400 hover:text-indigo-300 text-xs underline"
              >
                Configure / Test Keys
              </button>
            </div>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview Box if requested */}
            {previewData && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2 max-h-48 overflow-y-auto">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  AI Structure Preview
                </span>
                {previewData.subjects?.map((sub: any, sIdx: number) => (
                  <div key={sIdx} className="space-y-1">
                    <p className="text-xs font-bold text-white">{sub.name}</p>
                    {sub.units?.map((u: any, uIdx: number) => (
                      <div key={uIdx} className="pl-3 text-[11px] text-slate-300">
                        <span className="text-indigo-400 font-semibold">{u.name}</span>: {u.topics?.length} Topics
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={isParsing || (!inputText && !inputFile)}
                onClick={handlePreviewParse}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 disabled:opacity-50"
              >
                Preview Structure
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isParsing}
                  onClick={handleUploadSyllabus}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
                >
                  {isParsing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{parseStepMessage || "Processing with AI..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Parse & Build Hierarchy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI ENGINE & KEYS CONFIGURATION MODAL */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl border border-indigo-500/30 p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Engine Configuration</h3>
                  <p className="text-xs text-slate-400">Manage LLM API Keys & Providers</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Provider Status Indicators */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Provider Connection Status</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Google Gemini</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    aiStatus?.configured_providers?.gemini ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                  }`}>
                    {aiStatus?.configured_providers?.gemini ? "Active" : "Not Set"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Groq LLaMA 3.3</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    aiStatus?.configured_providers?.groq ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                  }`}>
                    {aiStatus?.configured_providers?.groq ? "Active" : "Not Set"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>OpenAI GPT-4o</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    aiStatus?.configured_providers?.openai ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                  }`}>
                    {aiStatus?.configured_providers?.openai ? "Active" : "Not Set"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Semantic NLP</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Always Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Configure Key Form */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select AI Provider</label>
                <select
                  value={configProvider}
                  onChange={(e) => setConfigProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini">Google Gemini (Recommended, gemini-2.5-flash / gemini-1.5-flash)</option>
                  <option value="groq">Groq (LLaMA 3.3 70B)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {configProvider === "gemini" ? "Google Gemini API Key" : configProvider === "groq" ? "Groq API Key" : "OpenAI API Key"}
                </label>
                <input
                  type="password"
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder={`Paste your ${configProvider} API key here...`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {configMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  configMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : configMsg.type === "warning"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                }`}>
                  {configMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{configMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAIModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={configLoading || !configKey.trim()}
                  onClick={handleSaveAIConfig}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {configLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Authenticate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
                  placeholder="e.g. Sliding Filament Theory or Paxos Consensus"
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
