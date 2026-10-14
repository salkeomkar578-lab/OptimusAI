"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { api, Syllabus, Topic } from "@/lib/api";

export default function StudyIndexPage() {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadFirstTopic();
  }, []);

  const loadFirstTopic = async () => {
    try {
      setLoading(true);
      const activeUid = api.getActiveUserId();
      const syllabi = await api.getUserSyllabi(activeUid);
      if (syllabi && syllabi.length > 0 && syllabi[0].subjects.length > 0) {
        setSyllabus(syllabi[0]);
        // Auto-redirect to first high priority topic
        const allTopics: Topic[] = [];
        syllabi[0].subjects.forEach((s) => {
          s.units.forEach((u) => {
            allTopics.push(...u.topics);
          });
        });
        if (allTopics.length > 0) {
          allTopics.sort((a, b) => (b.calculated_priority || 0) - (a.calculated_priority || 0));
          router.replace(`/study/${allTopics[0].id}`);
          return;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4">
        <GraduationCap className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold text-white">Opening Study & Examination Room...</h1>
      <p className="text-xs text-slate-400 mt-2">
        Directing to your highest-priority syllabus topic based on past exam paper weights.
      </p>
      {syllabus && (
        <div className="mt-8">
          <Link
            href="/syllabus"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            <span>Browse All Syllabus Topics</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
