"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  FileText, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen,
  HelpCircle,
  Layers,
  ChevronRight,
  Zap,
  Cpu,
  GraduationCap
} from "lucide-react";
import { api } from "@/lib/api";

const PRESETS = [
  {
    id: "ds",
    title: "Distributed Systems & Cloud",
    badge: "CS / Engineering",
    syllabus: `Subject: Distributed Systems & Cloud Computing
Unit 1: Foundations and Virtualization
- Cloud Service Models (IaaS, PaaS, SaaS)
- Hypervisors and Containerization (Docker, cgroups)
- Microservices Architecture & Service Mesh
Unit 2: Consensus, Synchronization and Consistency
- Logical Clocks (Lamport Timestamps and Vector Clocks)
- Distributed Mutual Exclusion Algorithms
- Paxos and Raft Consensus Protocols
- CAP Theorem and Eventual Consistency Models
Unit 3: Fault Tolerance, Storage and Reliability
- Distributed Key-Value Stores (Dynamo, Cassandra)
- Byzantine Fault Tolerance & Quorum Systems
- Replication, Sharding, and Failure Detectors`,
    pyq: `EXAMINATION 2024: Distributed Systems
Q1. [10 Marks] State Lamport logical timestamp axioms. How do vector clocks overcome total order limitations?
Q2. [10 Marks] Detail the Raft consensus algorithm phases for Leader Election and Log Replication.
Q3. [8 Marks] Explain the CAP Theorem and discuss real-world tradeoffs in distributed key-value databases.
Q4. [6 Marks] How does Byzantine Fault Tolerance prevent malicious or corrupt node failures?
Q5. [8 Marks] Compare container virtualization security with hypervisor virtualization.`
  },
  {
    id: "ml",
    title: "Machine Learning & Neural Nets",
    badge: "AI / Data Science",
    syllabus: `Subject: Machine Learning & Deep Learning Systems
Unit 1: Optimization and Convex Formulations
- Gradient Descent, Stochastic Approximations, and Adam Optimizer
- Loss Functions, Maximum Likelihood Estimation, and Regularization (L1/L2)
- Backpropagation and Computational Graphs
Unit 2: Deep Neural Architectures
- Convolutional Neural Networks and Receptive Fields
- Transformer Architecture, Multi-Head Attention, and Positional Encodings
- Recurrent Networks, LSTMs, and Sequence-to-Sequence Models
Unit 3: Generalization and Production Deployment
- Overfitting, Dropout, and Batch Normalization
- Model Quantization, Pruning, and Latency Profiling
- Alignment, RLHF, and Safety Invariants`,
    pyq: `EXAMINATION 2024: Machine Learning Systems
Q1. [10 Marks] Derive the multi-head scaled dot-product attention equation and explain computational complexity per layer.
Q2. [8 Marks] Compare Adam, RMSProp, and SGD with Momentum regarding convergence trajectories.
Q3. [10 Marks] Formulate the backpropagation chain rule for a multi-layer perceptron with cross-entropy loss.
Q4. [6 Marks] Why does Batch Normalization alleviate internal covariate shift? State the transformation equations.
Q5. [8 Marks] How does post-training quantization reduce memory footprint without degrading perplexity?`
  },
  {
    id: "algo",
    title: "Algorithms & Competitive Programming",
    badge: "Core CS",
    syllabus: `Subject: Advanced Algorithms & Data Structures
Unit 1: Graph Algorithms & Network Flows
- Maximum Bipartite Matching and Ford-Fulkerson Algorithm
- Minimum Cut Theorem and Push-Relabel Maximum Flow
- Shortest Path Optimizations (Dijkstra, Bellman-Ford, Floyd-Warshall)
Unit 2: Dynamic Programming & Amortized Complexity
- Matrix Chain Multiplication and Knapsack Variants
- Disjoint Set Union (DSU) with Path Compression and Rank
- Splay Trees and Potential Method Amortization
Unit 3: Complexity & Intractability
- NP-Completeness Proofs and Reductions (3-SAT, Vertex Cover, Clique)
- Approximation Algorithms and Greedy Heuristics
- Randomized Algorithms and Miller-Rabin Primality Testing`,
    pyq: `EXAMINATION 2024: Advanced Algorithms
Q1. [10 Marks] Formulate the Max-Flow Min-Cut theorem and prove Ford-Fulkerson correctness.
Q2. [8 Marks] Analyze Disjoint Set Union using the Potential Method to prove O(alpha(n)) amortized bounds.
Q3. [10 Marks] Prove that Vertex Cover is NP-complete by polynomial reduction from 3-SAT.
Q4. [6 Marks] State Floyd-Warshall dynamic programming recurrence and analyze space-time complexity.
Q5. [8 Marks] Design a 2-approximation algorithm for the Metric Traveling Salesperson Problem.`
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>("Alex Chen");
  const [email, setEmail] = useState<string>("student@optimus.ai");
  const [examDate, setExamDate] = useState<string>("2026-11-05T09:00");
  
  // Syllabus & PYQ state
  const [syllabusTitle, setSyllabusTitle] = useState<string>("Distributed Systems & Cloud Computing");
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusText, setSyllabusText] = useState<string>(PRESETS[0].syllabus);

  const [pyqYear, setPyqYear] = useState<number>(2024);
  const [pyqFile, setPyqFile] = useState<File | null>(null);
  const [pyqText, setPyqText] = useState<string>(PRESETS[0].pyq);

  // Availability slots (0=Sun, 1=Mon... 6=Sat)
  const [startTime, setStartTime] = useState<string>("18:00");
  const [endTime, setEndTime] = useState<string>("20:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSyllabusTitle(preset.title);
    setSyllabusText(preset.syllabus);
    setPyqText(preset.pyq);
  };

  const applyTimePreset = (start: string, end: string) => {
    setStartTime(start);
    setEndTime(end);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Create or register user
      const user = await api.getOrCreateUser({
        name,
        email,
        target_exam_date: new Date(examDate).toISOString(),
      });

      // 2. Set Availability Slots
      const slots = selectedDays.map((dow) => ({
        day_of_week: dow,
        start_time: startTime,
        end_time: endTime,
        is_recurring: true,
      }));
      await api.setUserAvailability(user.id, slots);

      // 3. Upload Syllabus
      const syllabusFormData = new FormData();
      syllabusFormData.append("user_id", user.id);
      syllabusFormData.append("title", syllabusTitle);
      if (syllabusFile) {
        syllabusFormData.append("file", syllabusFile);
      } else {
        syllabusFormData.append("raw_text", syllabusText);
      }
      const syllabusRes = await api.uploadSyllabus(syllabusFormData);

      // 4. Fetch the created syllabus to get subject ID
      const tree = await api.getSyllabusTree(syllabusRes.syllabus_id);
      if (tree.subjects && tree.subjects.length > 0) {
        const subjectId = tree.subjects[0].id;
        const pyqFormData = new FormData();
        pyqFormData.append("subject_id", subjectId);
        pyqFormData.append("year", pyqYear.toString());
        if (pyqFile) {
          pyqFormData.append("file", pyqFile);
        } else {
          pyqFormData.append("raw_text", pyqText);
        }
        await api.uploadPYQ(pyqFormData);
      }

      // 5. Generate Deterministic Timetable
      await api.generateSchedule(user.id, 14);

      // Redirect to planner view
      router.push("/planner");
    } catch (err: any) {
      console.error("Setup error:", err);
      setErrorMsg(err.message || "Failed to initialize course study plan. Please verify backend connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Wizard Progress Steps */}
      <div className="mb-10 text-center space-y-3">
        <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20">
          Continuous Adaptive Setup Wizard
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Configure Your Adaptive Study Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          OptimusAI parses your raw curriculum, maps past exam papers via dense vectors, and enforces hard availability windows.
        </p>

        {/* 1-Click Curriculum Presets Bar */}
        <div className="pt-4 flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            1-Click Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Cpu className="w-3 h-3 text-indigo-400" />
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {[
            { num: 1, label: "Exam Goals" },
            { num: 2, label: "Syllabus" },
            { num: 3, label: "Past Papers" },
            { num: 4, label: "Availability" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === s.num
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : step > s.num
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-slate-900 text-slate-500 border border-slate-800"
                }`}
              >
                {step > s.num ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span>{s.num}</span>
                )}
                <span>{s.label}</span>
              </button>
              {idx < 3 && <div className="w-6 h-[1px] bg-slate-800" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Exam Info */}
      {step === 1 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Target Exam & Profile</h2>
              <p className="text-xs text-slate-400">Define your exam date to set priority urgency curves.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Student Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Alex Chen"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Student Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                placeholder="student@optimus.ai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Target Exam Date & Time</label>
            <input
              type="datetime-local"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/25"
            >
              <span>Continue to Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Syllabus Upload */}
      {step === 2 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Syllabus Document</h2>
              <p className="text-xs text-slate-400">Semantic AI will extract Subject, Unit, and Topic hierarchy automatically.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Course / Exam Title</label>
            <input
              type="text"
              value={syllabusTitle}
              onChange={(e) => setSyllabusTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors">
            <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">Upload PDF or Syllabus Document</p>
            <p className="text-[11px] text-slate-500 mt-1">Supports PDF (PyMuPDF / OCR) or raw text files</p>
            <input
              type="file"
              accept=".pdf,.txt,.doc"
              onChange={(e) => setSyllabusFile(e.target.files?.[0] || null)}
              className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">Or Paste Syllabus Hierarchy</label>
              <span className="text-[11px] text-slate-500">Auto-detected formatting</span>
            </div>
            <textarea
              rows={7}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/25"
            >
              <span>Continue to Past Papers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PYQ Upload */}
      {step === 3 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Map Past Year Questions (PYQs)</h2>
              <p className="text-xs text-slate-400">OptimusAI computes vector similarity between past exam questions and syllabus topics.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Exam Paper Year</label>
              <input
                type="number"
                value={pyqYear}
                onChange={(e) => setPyqYear(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Upload PYQ PDF (Optional)</label>
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setPyqFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">Extracted Exam Questions & Marks</label>
              <span className="text-[11px] text-indigo-400">Vector Embeddings Ready</span>
            </div>
            <textarea
              rows={7}
              value={pyqText}
              onChange={(e) => setPyqText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/25"
            >
              <span>Continue to Availability</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Availability Windows */}
      {step === 4 && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Define Study Availability Windows</h2>
              <p className="text-xs text-slate-400">The deterministic scheduler strictly fits study blocks into these exact time windows.</p>
            </div>
          </div>

          {/* Quick Slot Schedule Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Schedule Presets</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => applyTimePreset("18:00", "20:00")}
                className={`p-3 rounded-xl text-left border transition-all ${
                  startTime === "18:00" && endTime === "20:00"
                    ? "border-indigo-500 bg-indigo-600/20 text-white"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold text-xs">🌆 Evenings</div>
                <div className="text-[11px] font-mono mt-0.5">18:00 - 20:00 (2 hrs)</div>
              </button>
              <button
                type="button"
                onClick={() => applyTimePreset("07:00", "09:00")}
                className={`p-3 rounded-xl text-left border transition-all ${
                  startTime === "07:00" && endTime === "09:00"
                    ? "border-indigo-500 bg-indigo-600/20 text-white"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold text-xs">🌅 Mornings</div>
                <div className="text-[11px] font-mono mt-0.5">07:00 - 09:00 (2 hrs)</div>
              </button>
              <button
                type="button"
                onClick={() => applyTimePreset("17:00", "21:00")}
                className={`p-3 rounded-xl text-left border transition-all ${
                  startTime === "17:00" && endTime === "21:00"
                    ? "border-indigo-500 bg-indigo-600/20 text-white"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold text-xs">🔥 Intensive Block</div>
                <div className="text-[11px] font-mono mt-0.5">17:00 - 21:00 (4 hrs)</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-3">Active Study Days</label>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((dayName, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`py-3 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Custom Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Custom End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Deterministic Time Enforcer</p>
              <p className="mt-0.5 text-slate-400">
                The AI never hallucinates arbitrary study times. It strictly assigns your highest priority topics and spaced repetition cycles into your defined {selectedDays.length} weekly windows.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCompleteSetup}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-xs transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Timetable & Vectors...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch OptimusAI Study Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
