-- ============================================================================
-- OptimusAI: PostgreSQL / Supabase Production Schema with pgvector & RLS
-- ============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_exam_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. SYLLABI TABLE
CREATE TABLE IF NOT EXISTS syllabi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    raw_file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    syllabus_id UUID NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);

-- 5. UNITS TABLE
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0
);

-- 6. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours FLOAT DEFAULT 2.0,
    pyq_weight_score FLOAT DEFAULT 0.0 CHECK (pyq_weight_score >= 0.0 AND pyq_weight_score <= 10.0),
    user_mastery_score FLOAT DEFAULT 0.0 CHECK (user_mastery_score >= 0.0 AND user_mastery_score <= 10.0),
    calculated_priority FLOAT DEFAULT 0.0,
    last_studied_at TIMESTAMPTZ,
    next_revision_due TIMESTAMPTZ,
    embedding vector(1536)
);

-- 7. PYQ DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS pyq_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    file_url TEXT,
    year INT NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. TOPIC PYQ MAPPINGS TABLE
CREATE TABLE IF NOT EXISTS topic_pyq_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    pyq_id UUID NOT NULL REFERENCES pyq_documents(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0.0,
    weight FLOAT DEFAULT 1.0,
    embedding vector(1536)
);

-- 9. AVAILABILITY SLOTS TABLE
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE
);

-- 10. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
    session_type VARCHAR(50) DEFAULT 'study' CHECK (session_type IN ('study', 'revision', 'quiz')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    score_percentage FLOAT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDICES & VECTOR INDEXING (HNSW)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_topics_unit_id ON topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_topics_calculated_priority ON topics(calculated_priority DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_time ON study_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_topic ON study_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_availability_user ON availability_slots(user_id);

-- HNSW Vector Index for Semantic Search (Cosine distance)
CREATE INDEX IF NOT EXISTS idx_topics_embedding_hnsw ON topics 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_mappings_embedding_hnsw ON topic_pyq_mappings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- User owns their profile
CREATE POLICY "Users can manage own profile" ON users
    FOR ALL USING (auth.uid() = id);

-- User can manage their syllabi
CREATE POLICY "Users can manage own syllabi" ON syllabi
    FOR ALL USING (auth.uid() = user_id);

-- User can manage availability slots
CREATE POLICY "Users can manage own availability" ON availability_slots
    FOR ALL USING (auth.uid() = user_id);

-- User can manage study sessions
CREATE POLICY "Users can manage own sessions" ON study_sessions
    FOR ALL USING (auth.uid() = user_id);

-- User can manage quiz attempts
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
    FOR ALL USING (auth.uid() = user_id);
