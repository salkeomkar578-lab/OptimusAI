"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  XCircle, 
  RotateCcw, 
  Flame, 
  Award,
  Send,
  Zap,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";
import { api, StudyNotes, QuizQuestion, Topic } from "@/lib/api";
import { MermaidViewer } from "@/components/MermaidViewer";
import { MathView } from "@/components/MathView";

function StudyWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.topicId as string;

  const [activeTab, setActiveTab] = useState<"notes" | "diagram" | "quiz" | "tutor">("notes");
  const [notes, setNotes] = useState<StudyNotes | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);

  // Tutor Chat state
  const [messages, setMessages] = useState<{ sender: "user" | "tutor"; text: string }[]>([
    {
      sender: "tutor",
      text: "Hello! I am your OptimusAI Socratic Tutor for this topic. What specific derivation, formula, or exam concept would you like to master today?",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isSendingMsg, setIsSendingMsg] = useState<boolean>(false);

  useEffect(() => {
    if (topicId) {
      loadTopicData();
    }
  }, [topicId]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      const [notesData, quizData] = await Promise.all([
        api.getTopicNotes(topicId),
        api.getTopicQuiz(topicId, 5),
      ]);
      setNotes(notesData);
      setQuizQuestions(quizData);
    } catch (err) {
      console.error("Failed to load study room data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmittingQuiz) return;
    setIsSubmittingQuiz(true);

    let correctCount = 0;
    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_index) {
        correctCount += 1;
      }
    });

    try {
      const res = await api.submitQuiz(topicId, "demo-user-1", quizQuestions.length, correctCount);
      setQuizResult(res);
      setQuizSubmitted(true);

      if (res.passed) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      }
    } catch (err: any) {
      alert("Failed to record quiz results: " + err.message);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || isSendingMsg) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    if (!textToSend) setChatInput("");
    setIsSendingMsg(true);

    try {
      const res = await api.chatWithTutor(topicId, text, []);
      setMessages((prev) => [...prev, { sender: "tutor", text: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "tutor", text: "Sorry, I encountered an issue generating a response. Please try again." },
      ]);
    } finally {
      setIsSendingMsg(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link
            href="/syllabus"
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Syllabus Tree</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {notes?.topic_name || "Study & Examination Room"}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              High-Yield Preparation
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: "notes", label: "Study Notes", icon: BookOpen },
            { id: "diagram", label: "Concept Diagram", icon: FileText },
            { id: "quiz", label: `Quiz (${quizQuestions.length})`, icon: HelpCircle },
            { id: "tutor", label: "AI Tutor", icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Synthesizing high-yield notes and adaptive questions...</p>
        </div>
      ) : (
        <div className="mt-8">
          {/* TAB 1: STUDY NOTES */}
          {activeTab === "notes" && notes && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Key Points & Formulas */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Points */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>High-Yield Examination Takeaways</span>
                  </div>
                  <div className="space-y-3">
                    {notes.key_points.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">{pt}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core Formulas */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>Core Invariants & Mathematical Formulations (KaTeX)</span>
                  </div>
                  <div className="space-y-3">
                    {notes.core_formulas.map((formula, idx) => (
                      <MathView
                        key={idx}
                        math={formula}
                        block={true}
                        label={`Theorem / Mathematical Invariant ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Definitions & References */}
              <div className="space-y-6">
                {/* Definitions */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>Critical Definitions</span>
                  </div>
                  <div className="space-y-3">
                    {notes.definitions.map((def, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <h4 className="font-semibold text-xs text-white">{def.term}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{def.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Reading */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-wider">
                    <Award className="w-4 h-4" />
                    <span>Targeted References</span>
                  </div>
                  <ul className="space-y-2">
                    {notes.recommended_reading.map((r, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONCEPT DIAGRAM */}
          {activeTab === "diagram" && notes && (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Concept Architecture Diagram</h3>
                  <p className="text-xs text-slate-400">
                    Live Mermaid.js structural model for {notes.topic_name}.
                  </p>
                </div>
              </div>
              <MermaidViewer chart={notes.concept_diagram_mermaid} />
            </div>
          )}

          {/* TAB 3: PRACTICE QUIZ */}
          {activeTab === "quiz" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Quiz Result Banner */}
              {quizSubmitted && quizResult && (
                <div
                  className={`p-6 rounded-3xl border ${
                    quizResult.passed
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      : "bg-rose-950/40 border-rose-500/50 text-rose-200"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {quizResult.passed ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Score: {quizResult.score_percentage}% — {quizResult.passed ? "Concept Mastered!" : "Mastery Below Target (<70%)"}
                        </h3>
                        <p className="text-xs">
                          {quizResult.passed
                            ? `Mastery score boosted to ${quizResult.updated_mastery}/10! Next spaced repetition review scheduled in 3 days.`
                            : `Adaptive Replan Triggered: Topic prioritized for upcoming availability window to reinforce weak areas.`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetQuiz}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold hover:bg-slate-800 text-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {quizQuestions.map((q, qIdx) => {
                  const selectedIdx = selectedAnswers[q.id];
                  const isAnswered = selectedIdx !== undefined;

                  return (
                    <div
                      key={q.id}
                      className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          Question {qIdx + 1} of {quizQuestions.length}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                        {q.question}
                      </h4>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {q.options.map((option, optIdx) => {
                          const isSelected = selectedIdx === optIdx;
                          const isCorrect = q.correct_index === optIdx;

                          let btnClasses = "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-indigo-500/50";
                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnClasses = "border-emerald-500 bg-emerald-950/40 text-emerald-200 font-semibold";
                            } else if (isSelected && !isCorrect) {
                              btnClasses = "border-rose-500 bg-rose-950/40 text-rose-200";
                            }
                          } else if (isSelected) {
                            btnClasses = "border-indigo-500 bg-indigo-600/20 text-white font-semibold";
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 ${btnClasses}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Real-time explanation */}
                      {quizSubmitted && (
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                          <p className="font-semibold text-indigo-400">Explanation:</p>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!quizSubmitted && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz || Object.keys(selectedAnswers).length < quizQuestions.length}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {isSubmittingQuiz ? (
                      <span>Evaluating Results...</span>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        <span>Submit Quiz & Evaluate Mastery</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RAG AI TUTOR DRAWER */}
          {activeTab === "tutor" && (
            <div className="max-w-4xl mx-auto glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col h-[650px]">
              {/* Chat Header */}
              <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">OptimusAI Socratic Tutor</h3>
                    <p className="text-[11px] text-slate-400">Grounding on {notes?.topic_name}</p>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  RAG Online
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                        m.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none font-sans"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isSendingMsg && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 animate-pulse flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Formulating Socratic response...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Questions */}
              <div className="px-6 py-2.5 bg-slate-900/60 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-slate-500 shrink-0">Quick prompts:</span>
                {[
                  "Explain intuitively with real-world analogy",
                  "Show past exam derivation step-by-step",
                  "Test me on tricky edge cases",
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Ask a question about this topic..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isSendingMsg}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudyWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading topic workspace...</p>
        </div>
      }
    >
      <StudyWorkspaceContent />
    </Suspense>
  );
}
