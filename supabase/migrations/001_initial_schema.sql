-- ============================================================
-- 001_initial_schema.sql
-- Science Master Pokédex — 전체 DB 스키마
-- ============================================================

-- ── 플레이어 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname         TEXT    NOT NULL,
  session_code     TEXT    NOT NULL,
  avatar           JSONB   NOT NULL DEFAULT '{}',
  position         JSONB   NOT NULL DEFAULT '{"x":400,"y":300}',
  xp               INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  coins            INTEGER NOT NULL DEFAULT 0,
  unlocked_cards   TEXT[]  NOT NULL DEFAULT '{}',
  unlocked_costumes TEXT[] NOT NULL DEFAULT '{}',
  achievements     TEXT[]  NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 게임 세션 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  code           TEXT    PRIMARY KEY,
  teacher_id     UUID,
  status         TEXT    NOT NULL DEFAULT 'lobby',  -- lobby | quiz | battle | raid | ended
  active_unit_id INTEGER,
  boss_hp        INTEGER DEFAULT 1000,
  boss_max_hp    INTEGER DEFAULT 1000,
  battle_pairs   JSONB   DEFAULT '[]',
  settings       JSONB   DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ── 문제 은행 ─────────────────────────────────────────────────
-- Edge Function이 서버에서 정답을 검증할 때 참조하는 단일 출처
CREATE TABLE IF NOT EXISTS questions (
  id            TEXT    PRIMARY KEY,                 -- e.g. 'u1_q1'
  unit_id       INTEGER NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  card_reward   TEXT,                                -- 정답 시 해금할 카드 ID
  difficulty    TEXT    NOT NULL DEFAULT 'medium'    -- easy | medium | hard
);

-- ── 퀴즈 답변 기록 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_answers (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID    REFERENCES players(id) ON DELETE CASCADE,
  session_code TEXT    REFERENCES game_sessions(code) ON DELETE SET NULL,
  question_id  TEXT    NOT NULL,
  unit_id      INTEGER NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  card_reward  TEXT,
  answered_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 배틀 결과 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS battle_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT,
  winner_id    UUID,
  loser_id     UUID,
  rounds       JSONB DEFAULT '[]',
  ended_at     TIMESTAMPTZ DEFAULT now()
);

-- ── 인덱스 ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_players_session  ON players(session_code);
CREATE INDEX IF NOT EXISTS idx_answers_player   ON quiz_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_answers_session  ON quiz_answers(session_code);
CREATE INDEX IF NOT EXISTS idx_questions_unit   ON questions(unit_id);

-- ── RLS (Row Level Security) ─────────────────────────────────
ALTER TABLE players       ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions     ENABLE ROW LEVEL SECURITY;

-- players: 같은 세션 참여자만 읽기 / 자신만 수정
CREATE POLICY "players_session_read" ON players
  FOR SELECT USING (session_code = current_setting('app.session_code', true));

CREATE POLICY "players_own_insert" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "players_own_update" ON players
  FOR UPDATE USING (id = (current_setting('app.player_id', true))::UUID);

-- game_sessions: 누구나 읽기 가능 (세션 코드를 아는 사람)
CREATE POLICY "sessions_public_read" ON game_sessions
  FOR SELECT USING (true);

-- quiz_answers: 자신의 기록만 삽입
CREATE POLICY "answers_own_insert" ON quiz_answers
  FOR INSERT WITH CHECK (player_id = (current_setting('app.player_id', true))::UUID);

-- questions: 누구나 읽기 (정답 index는 Edge Function 서버에서만 조회)
-- 클라이언트는 correct_index 컬럼에 접근하지 못하도록 컬럼 권한으로 추가 제어 권장
CREATE POLICY "questions_public_read" ON questions
  FOR SELECT USING (true);
