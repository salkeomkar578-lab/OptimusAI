const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface User {
  id: string;
  email: string;
  name: string;
  target_exam_date: string;
  created_at: string;
}

export interface AvailabilitySlot {
  id?: string;
  user_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
}

export interface Topic {
  id: string;
  unit_id: string;
  name: string;
  description?: string;
  estimated_hours: number;
  pyq_weight_score: number;
  user_mastery_score: number;
  calculated_priority: number;
  last_studied_at?: string;
  next_revision_due?: string;
  pyq_count?: number;
}

export interface Unit {
  id: string;
  subject_id: string;
  name: string;
  order_index: number;
  topics: Topic[];
}

export interface Subject {
  id: string;
  syllabus_id: string;
  name: string;
  order_index: number;
  units: Unit[];
}

export interface Syllabus {
  id: string;
  user_id: string;
  title: string;
  raw_file_url?: string;
  created_at: string;
  subjects: Subject[];
}

export interface StudySession {
  id: string;
  user_id: string;
  topic_id: string;
  topic_name?: string;
  subject_name?: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
  session_type: "study" | "revision" | "quiz";
  calculated_priority?: number;
}

export interface StudyNotes {
  topic_id: string;
  topic_name: string;
  key_points: string[];
  core_formulas: string[];
  definitions: { term: string; definition: string }[];
  concept_diagram_mermaid: string;
  recommended_reading: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface AnalyticsData {
  total_topics: number;
  coverage_percentage: number;
  average_mastery: number;
  mastery_distribution: {
    mastered: number;
    in_progress: number;
    needs_attention: number;
  };
  weak_areas: {
    id: string;
    name: string;
    subject: string;
    mastery_score: number;
    priority: number;
    pyq_weight: number;
  }[];
  high_yield_topics: {
    id: string;
    name: string;
    subject: string;
    pyq_weight: number;
    mastery_score: number;
  }[];
  session_stats: {
    completed: number;
    scheduled: number;
    skipped: number;
    rescheduled: number;
  };
  revision_heatmap: {
    date: string;
    due_count: number;
  }[];
  quiz_attempts: {
    id: string;
    topic_name: string;
    score_percentage: number;
    correct_answers: number;
    total_questions: number;
    completed_at: string;
  }[];
}

// Resilient Fallback Mock Data for Vercel Preview / Offline Deployment
const DEMO_SYLLABUS: Syllabus = {
  id: "demo-syl-1",
  user_id: "demo-user-1",
  title: "Distributed Systems & Cloud Computing",
  created_at: new Date().toISOString(),
  subjects: [
    {
      id: "subj-1",
      syllabus_id: "demo-syl-1",
      name: "Distributed Systems & Cloud Infrastructure",
      order_index: 0,
      units: [
        {
          id: "unit-1",
          subject_id: "subj-1",
          name: "Unit 1: Foundations and Virtualization",
          order_index: 0,
          topics: [
            {
              id: "topic-1",
              unit_id: "unit-1",
              name: "Cloud Service Models (IaaS, PaaS, SaaS)",
              description: "Comprehensive coverage of cloud deployment models and resource virtualization.",
              estimated_hours: 2.0,
              pyq_weight_score: 6.5,
              user_mastery_score: 7.5,
              calculated_priority: 6.2,
              last_studied_at: new Date().toISOString(),
              pyq_count: 2
            },
            {
              id: "topic-2",
              unit_id: "unit-1",
              name: "Hypervisors and Containerization (Docker, cgroups)",
              description: "Namespace isolation, kernel control groups, and virtualization security trade-offs.",
              estimated_hours: 2.5,
              pyq_weight_score: 8.5,
              user_mastery_score: 5.0,
              calculated_priority: 7.8,
              pyq_count: 3
            },
            {
              id: "topic-3",
              unit_id: "unit-1",
              name: "Microservices Architecture & Service Mesh",
              description: "Decentralized service communication, discovery, and sidecar proxy telemetry.",
              estimated_hours: 2.0,
              pyq_weight_score: 4.0,
              user_mastery_score: 4.0,
              calculated_priority: 5.5,
              pyq_count: 1
            }
          ]
        },
        {
          id: "unit-2",
          subject_id: "subj-1",
          name: "Unit 2: Consensus, Synchronization and Consistency",
          order_index: 1,
          topics: [
            {
              id: "topic-4",
              unit_id: "unit-2",
              name: "Logical Clocks (Lamport Timestamps and Vector Clocks)",
              description: "Causality tracking, partial orderings, and clock synchronization protocols.",
              estimated_hours: 2.5,
              pyq_weight_score: 9.5,
              user_mastery_score: 3.5,
              calculated_priority: 8.9,
              next_revision_due: new Date().toISOString(),
              pyq_count: 4
            },
            {
              id: "topic-5",
              unit_id: "unit-2",
              name: "Paxos and Raft Consensus Protocols",
              description: "Leader election, log replication safety invariants, and quorum intersections.",
              estimated_hours: 3.0,
              pyq_weight_score: 10.0,
              user_mastery_score: 2.0,
              calculated_priority: 9.6,
              pyq_count: 5
            },
            {
              id: "topic-6",
              unit_id: "unit-2",
              name: "CAP Theorem and Eventual Consistency Models",
              description: "PACELC trade-offs, network partition resilience, and conflict-free replicated data types.",
              estimated_hours: 2.0,
              pyq_weight_score: 8.0,
              user_mastery_score: 6.0,
              calculated_priority: 7.1,
              pyq_count: 3
            }
          ]
        }
      ]
    }
  ]
};

const DEMO_SESSIONS: StudySession[] = [
  {
    id: "sess-1",
    user_id: "demo-user-1",
    topic_id: "topic-5",
    topic_name: "Paxos and Raft Consensus Protocols",
    subject_name: "Distributed Systems & Cloud Infrastructure",
    start_time: new Date(Date.now() + 1000 * 3600 * 2).toISOString(),
    end_time: new Date(Date.now() + 1000 * 3600 * 4).toISOString(),
    status: "scheduled",
    session_type: "study",
    calculated_priority: 9.6
  },
  {
    id: "sess-2",
    user_id: "demo-user-1",
    topic_id: "topic-4",
    topic_name: "Logical Clocks (Lamport Timestamps and Vector Clocks)",
    subject_name: "Distributed Systems & Cloud Infrastructure",
    start_time: new Date(Date.now() + 1000 * 3600 * 26).toISOString(),
    end_time: new Date(Date.now() + 1000 * 3600 * 28).toISOString(),
    status: "scheduled",
    session_type: "revision",
    calculated_priority: 8.9
  },
  {
    id: "sess-3",
    user_id: "demo-user-1",
    topic_id: "topic-2",
    topic_name: "Hypervisors and Containerization (Docker, cgroups)",
    subject_name: "Distributed Systems & Cloud Infrastructure",
    start_time: new Date(Date.now() + 1000 * 3600 * 50).toISOString(),
    end_time: new Date(Date.now() + 1000 * 3600 * 52).toISOString(),
    status: "scheduled",
    session_type: "study",
    calculated_priority: 7.8
  }
];

export const api = {
  async getOrCreateUser(payload: { email: string; name: string; target_exam_date: string }): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API fallback: using local user");
    }
    return {
      id: "demo-user-1",
      email: payload.email,
      name: payload.name,
      target_exam_date: payload.target_exam_date,
      created_at: new Date().toISOString(),
    };
  },

  async getUser(userId: string): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      id: userId,
      email: "student@optimus.ai",
      name: "Alex Chen",
      target_exam_date: new Date(Date.now() + 21 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    };
  },

  async setUserAvailability(userId: string, slots: AvailabilitySlot[]): Promise<AvailabilitySlot[]> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return slots;
  },

  async getUserAvailability(userId: string): Promise<AvailabilitySlot[]> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/availability`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      { day_of_week: 1, start_time: "18:00", end_time: "20:00" },
      { day_of_week: 2, start_time: "18:00", end_time: "20:00" },
      { day_of_week: 3, start_time: "18:00", end_time: "20:00" },
    ];
  },

  async uploadSyllabus(formData: FormData): Promise<{ syllabus_id: string; message: string; title: string }> {
    try {
      const res = await fetch(`${API_BASE}/syllabus/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      syllabus_id: "demo-syl-1",
      title: "Distributed Systems & Cloud Computing",
      message: "Syllabus processed and structured successfully",
    };
  },

  async getSyllabusTree(syllabusId: string): Promise<Syllabus> {
    try {
      const res = await fetch(`${API_BASE}/syllabus/${syllabusId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_SYLLABUS;
  },

  async getUserSyllabi(userId: string): Promise<Syllabus[]> {
    try {
      const res = await fetch(`${API_BASE}/syllabus/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
    } catch (e) {}
    return [DEMO_SYLLABUS];
  },

  async uploadPYQ(formData: FormData): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/pyq/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { message: "PYQ paper mapped", result: { mapped_questions: 5 } };
  },

  async getTopicPYQs(topicId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/pyq/mappings/${topicId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      topic_id: topicId,
      topic_name: "Distributed Consensus in Paxos and Raft",
      pyq_weight_score: 9.5,
      questions: [
        {
          id: "q1",
          question_text: "Q1. [10 Marks] State Lamport logical timestamp axioms. How do vector clocks overcome total order limitations?",
          relevance_score: 0.92,
          weight: 10
        },
        {
          id: "q2",
          question_text: "Q2. [10 Marks] Detail the Raft consensus algorithm phases for Leader Election and Log Replication.",
          relevance_score: 0.98,
          weight: 10
        }
      ]
    };
  },

  async generateSchedule(userId: string, horizonDays = 14): Promise<StudySession[]> {
    try {
      const res = await fetch(`${API_BASE}/planner/generate/${userId}?horizon_days=${horizonDays}`, {
        method: "POST",
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return DEMO_SESSIONS;
  },

  async getUserSessions(userId: string): Promise<StudySession[]> {
    try {
      const res = await fetch(`${API_BASE}/planner/sessions/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
    } catch (e) {}
    return DEMO_SESSIONS;
  },

  async updateSessionStatus(sessionId: string, status: "scheduled" | "completed" | "skipped" | "rescheduled"): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/planner/sessions/${sessionId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      message: `Session status updated to ${status}`,
      result: { replan_triggered: status === "skipped" }
    };
  },

  async getTopicNotes(topicId: string): Promise<StudyNotes> {
    try {
      const res = await fetch(`${API_BASE}/study/topic/${topicId}/notes`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      topic_id: topicId,
      topic_name: "Paxos and Raft Consensus Protocols",
      key_points: [
        "Consensus guarantees safety (never returns an incorrect result) and liveness (eventually makes progress).",
        "Raft decomposes consensus into three independent subproblems: Leader Election, Log Replication, and Safety.",
        "Leader election uses randomized election timers to avoid split votes in asynchronous networks.",
        "Log entries are committed only when replicated on a majority quorum of servers.",
        "Byzantine fault tolerance is required if nodes can fail arbitrarily or maliciously; Paxos and Raft assume fail-recovery only."
      ],
      core_formulas: [
        "Q_{\\text{majority}} = \\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1 \\quad \\text{(Quorum Size Guarantee)}",
        "T(n) = a \\cdot T(n/b) + \\Theta(n^k \\log^p n) \\quad \\text{(Master Complexity Theorem)}",
        "\\eta_{\\text{efficiency}} = \\frac{T_{\\text{sequential}}}{p \\cdot T_{\\text{parallel}}} \\times 100\\%"
      ],
      definitions: [
        { term: "Quorum Intersection Property", definition: "Any two quorums in a cluster of size N overlap in at least one node, ensuring the most updated log is always seen." },
        { term: "Log Matching Property", definition: "If two logs contain an entry with the same index and term, they are identical in all preceding entries." }
      ],
      concept_diagram_mermaid: `graph TD
    A["Client Request"] --> B["Raft Leader"]
    B --> C["AppendEntries RPC"]
    C --> D["Follower Node 1"]
    C --> E["Follower Node 2"]
    D --> F["Majority Quorum Ack"]
    E --> F
    F --> G["Commit & State Machine Apply"]
    style B fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#ffffff
    style F fill:#10b981,stroke:#047857,stroke-width:2px,color:#ffffff`,
      recommended_reading: [
        "In Search of an Understandable Consensus Algorithm (Ongaro & Ousterhout)",
        "Designing Data-Intensive Applications - Chapter 9 (Kleppmann)"
      ]
    };
  },

  async getTopicQuiz(topicId: string, count = 5): Promise<QuizQuestion[]> {
    try {
      const res = await fetch(`${API_BASE}/study/topic/${topicId}/quiz?count=${count}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
      {
        id: 1,
        question: "In the Raft consensus algorithm, how does a candidate node become a leader?",
        options: [
          "By receiving votes from a majority quorum of nodes in the cluster.",
          "By having the lowest IP address in the cluster topology.",
          "By running proof-of-work cryptographic hashing faster than peers.",
          "By broadcasting an unauthenticated heartbeat without election term."
        ],
        correct_index: 0,
        explanation: "A candidate wins an election and becomes leader when it receives votes from a majority of servers in the cluster for the current term."
      },
      {
        id: 2,
        question: "What is the primary mechanism Raft uses to prevent split vote deadlocks?",
        options: [
          "Randomized election timeouts on each candidate node.",
          "Static priority numbers assigned at compile time.",
          "Centralized external lock servers.",
          "Manual human intervention via command line."
        ],
        correct_index: 0,
        explanation: "Raft uses randomized election timeouts (e.g., 150-300ms) to ensure split votes are rare and resolved quickly."
      },
      {
        id: 3,
        question: "What minimum cluster size is required to tolerate 2 simultaneous node crashes in Paxos/Raft?",
        options: [
          "5 nodes (2f + 1 = 2(2) + 1 = 5)",
          "3 nodes",
          "4 nodes",
          "7 nodes"
        ],
        correct_index: 0,
        explanation: "To tolerate f crash failures, a consensus cluster requires at least 2f + 1 servers so a majority quorum (f + 1) is always available."
      },
      {
        id: 4,
        question: "Under the CAP theorem, what does a system guarantee if it chooses Availability and Partition Tolerance (AP)?",
        options: [
          "Every non-failing node returns a response, but it may contain stale data.",
          "Every read returns the most recent write or errors out immediately.",
          "Network partitions are physically prevented by hardware redundancy.",
          "All nodes execute synchronous atomic clocks."
        ],
        correct_index: 0,
        explanation: "AP systems prioritize availability during a network partition: all nodes remain responsive, but consistency is relaxed to eventual consistency."
      },
      {
        id: 5,
        question: "Why can Paxos and Raft NOT handle Byzantine node failures?",
        options: [
          "They assume crash-recovery failure model where nodes do not send corrupted, lying, or malicious messages.",
          "They require 100% symmetric quantum key encryption.",
          "They cannot run on Linux operating systems.",
          "They only support single-threaded sequential execution."
        ],
        correct_index: 0,
        explanation: "Standard Paxos and Raft assume fail-stop/recovery with reliable network communication; Byzantine fault tolerance requires 3f + 1 nodes and cryptographic signatures."
      }
    ];
  },

  async submitQuiz(topicId: string, userId: string, totalQuestions: number, correctAnswers: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/study/topic/${topicId}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const pct = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100);
    return {
      attempt_id: `att-${Date.now()}`,
      topic_id: topicId,
      score_percentage: pct,
      passed: pct >= 70,
      updated_mastery: pct >= 70 ? 7.5 : 3.0,
      replan_triggered: pct < 70
    };
  },

  async chatWithTutor(topicId: string, message: string, history: any[] = []): Promise<{ reply: string }> {
    try {
      const res = await fetch(`${API_BASE}/study/tutor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          message,
          conversation_history: history,
        }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      reply: `### 🎯 Concept Mastery: ${message}\n\nGreat question! In distributed systems exams, remember the golden rule: **Quorums guarantee safety, while terms resolve conflicts**.\n\nThink of Raft election timeouts like bidders in an auction: the randomized interval ensures one node speaks first and secures the majority vote before others split the ballot.\n\n*Self-check question: If 2 nodes in a 5-node cluster partition away, can the remaining 3 nodes still commit new log entries? (Answer: Yes, because 3 > 5/2!)*`
    };
  },

  async getUserAnalytics(userId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${API_BASE}/analytics/${userId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return {
      total_topics: 14,
      coverage_percentage: 64.3,
      average_mastery: 6.8,
      mastery_distribution: {
        mastered: 5,
        in_progress: 6,
        needs_attention: 3
      },
      weak_areas: [
        { id: "t1", name: "Paxos and Raft Consensus Protocols", subject: "Distributed Systems", mastery_score: 2.0, priority: 9.6, pyq_weight: 10.0 },
        { id: "t2", name: "Logical Clocks & Causality", subject: "Distributed Systems", mastery_score: 3.5, priority: 8.9, pyq_weight: 9.5 },
        { id: "t3", name: "Containerization cgroups & Security", subject: "Cloud Infrastructure", mastery_score: 5.0, priority: 7.8, pyq_weight: 8.5 }
      ],
      high_yield_topics: [
        { id: "t1", name: "Paxos and Raft Consensus Protocols", subject: "Distributed Systems", pyq_weight: 10.0, mastery_score: 2.0 },
        { id: "t2", name: "Logical Clocks & Causality", subject: "Distributed Systems", pyq_weight: 9.5, mastery_score: 3.5 },
        { id: "t4", name: "Hypervisors & Namespace Isolation", subject: "Cloud Infrastructure", pyq_weight: 8.5, mastery_score: 7.0 }
      ],
      session_stats: {
        completed: 4,
        scheduled: 7,
        skipped: 1,
        rescheduled: 2
      },
      revision_heatmap: [
        { date: "Mon 14 Oct", due_count: 2 },
        { date: "Tue 15 Oct", due_count: 1 },
        { date: "Wed 16 Oct", due_count: 3 },
        { date: "Thu 17 Oct", due_count: 0 },
        { date: "Fri 18 Oct", due_count: 2 },
        { date: "Sat 19 Oct", due_count: 1 },
        { date: "Sun 20 Oct", due_count: 4 }
      ],
      quiz_attempts: [
        { id: "q1", topic_name: "Consensus Protocols", score_percentage: 100, correct_answers: 5, total_questions: 5, completed_at: new Date().toISOString() },
        { id: "q2", topic_name: "Logical Clocks", score_percentage: 80, correct_answers: 4, total_questions: 5, completed_at: new Date(Date.now() - 86400000).toISOString() }
      ]
    };
  },
};
