# OptimusAI — Continuous Adaptive AI Study & Exam Preparation Platform

OptimusAI is an end-to-end, full-stack, production-grade adaptive study planner and exam preparation system. It converts unstructured study materials (syllabi, past-year exam question papers, exam dates, and student availability windows) into an actionable, dynamically updating study plan that adapts continuously based on student progress and quiz performance.

---

## 🏗 Architecture & Tech Stack

```
                                  +---------------------------------------+
                                  |      Next.js (App Router, React)      |
                                  |     Tailwind CSS + shadcn/ui          |
                                  +-------------------+-------------------+
                                                      |  REST & Events
                                                      v
                                  +---------------------------------------+
                                  |       FastAPI Python Backend          |
                                  |       (REST APIs & Orchestration)     |
                                  +----+---------------+-------------+----+
                                       |               |             |
                 +---------------------+               |             +---------------------+
                 |                                     |                                   |
                 v                                     v                                   v
+---------------------------------+  +-------------------------------+   +---------------------------------+
|        Semantic AI Layer        |  |    Topic Priority Engine      |   |     Deterministic Scheduler     |
| - PyMuPDF & OCR Parsing         |  | - Priority Ranking Formula    |   | - Hard Availability Slots       |
| - Past Year Question Vector Map |  | - Urgency & Mastery Weakness  |   | - Spaced Repetition (1/3/7/14d) |
| - Socratic AI Tutor & Quizzes   |  | - Overdue Penalties           |   | - Zero LLM Slot Hallucination   |
+---------------------------------+  +-------------------------------+   +---------------------------------+
                 |                                     |                                   |
                 +-------------------------------------+-----------------------------------+
                                                       |
                                                       v
                                  +---------------------------------------+
                                  |       Adaptive Replanning Loop        |
                                  | - Triggers on Skip or Quiz < 70%      |
                                  | - Immediate Priority Recalculation    |
                                  | - Re-slots into Next Study Window     |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   PostgreSQL + pgvector / Supabase    |
                                  |     (Row Level Security & HNSW)       |
                                  +---------------------------------------+
```

### Components
* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Mermaid.js, Canvas Confetti.
* **Backend:** Python (FastAPI), SQLAlchemy ORM, Pydantic v2, PyMuPDF (fitz), NumPy, Provider-Agnostic AI Gateway (Groq / OpenAI / Gemini / Smart Deterministic Engine).
* **Database & Auth:** PostgreSQL with `pgvector`, HNSW vector indexing, Row Level Security (RLS) policies, and Supabase migration script (`backend/migrations/001_initial_schema.sql`).
* **DevOps:** Multi-stage Dockerfiles (`frontend/Dockerfile`, `backend/Dockerfile`), `docker-compose.yml`, and GitHub Actions CI/CD (`.github/workflows/ci.yml`).

---

## 🧮 Mathematical Priority Engine

All syllabus topics are ranked deterministically without LLM guesswork using the formula:

$$\text{Priority} = (w_1 \times \text{PYQ Weight}) + (w_2 \times (10 - \text{Mastery Score})) + (w_3 \times \text{Exam Urgency}) + (w_4 \times \text{Revision Overdue Penalty})$$

* **$w_1 = 0.35$ (Past Exam Frequency & Marks):** Derived from dense vector cosine similarity of past year exam questions mapped to syllabus topics.
* **$w_2 = 0.30$ (Mastery Weakness):** Evaluated from quiz scores and study durations ($10 - \text{Mastery Score}$).
* **$w_3 = 0.20$ (Exam Urgency):** Exponential decay function based on days remaining until the target examination date.
* **$w_4 = 0.15$ (Revision Overdue Penalty):** Escalating penalty applied when Spaced Repetition dates elapse without review.

---

## 🔄 The Adaptive Replanning Loop

1. **Session Skipped:**
   - Topic mastery score is reduced.
   - Priority immediately surges due to overdue penalty.
   - Deterministic scheduler automatically re-slots the skipped topic into the student's earliest upcoming availability window, shifting lower-priority sessions forward.
2. **Quiz Score $< 70\%$ (Weakness Detected):**
   - Topic mastery score is penalized proportional to the deficit.
   - Topic is flagged as an urgent weakness and scheduled for reinforced study in the next available slot.
3. **Quiz Score $\ge 70\%$ (Mastery Achieved):**
   - Topic mastery is boosted ($+2.5$).
   - Automated Spaced Repetition interval is scheduled ($+1\text{d} \to +3\text{d} \to +7\text{d} \to +14\text{d}$).

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* Python 3.12+ (or `uv`)
* Node.js 20+ & npm

### 1. Run Backend Server
```bash
# Create venv and install dependencies
uv venv .venv
uv pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
.venv/Scripts/python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Run Next.js Frontend
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
Dashboard will be live at: [http://localhost:3000](http://localhost:3000)

### 3. Run Integration Test Suite
```bash
.venv/Scripts/python backend/tests/test_adaptive_loop.py
```

### 4. Run with Docker Compose
```bash
docker compose up --build
```

---

## 📊 Dashboard Views
1. **Overview Command Center (`/`):** Next study session countdown, engine status, and architecture pillars.
2. **Onboarding Wizard (`/onboarding`):** 4-step wizard to upload syllabi, past exam papers, define weekly study availability hours, and set exam dates.
3. **Interactive Syllabus Tree (`/syllabus`):** `Subject -> Unit -> Topic` hierarchy with PYQ weight badges (High/Med/Low), mastery gauges, and past question inspection modal.
4. **Adaptive Timeline (`/planner`):** Calendar view with hard time-slot constraints and real-time "Complete", "Skip & Replan", and "Reschedule" actions.
5. **Study & Examination Room (`/study/[topicId]`):** High-yield exam notes, mathematical invariants, live Mermaid.js concept diagrams, interactive practice quiz component, and Socratic RAG AI Tutor drawer.
6. **Analytics & Vulnerability Radar (`/analytics`):** Real-time coverage gauge, average mastery, weak area focus leaderboard, and 7-day spaced repetition heatmap.
