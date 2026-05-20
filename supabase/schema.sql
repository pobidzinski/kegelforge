-- Globalna konfiguracja programu (zawsze 1 wiersz)
CREATE TABLE program_config (
  id          INT PRIMARY KEY DEFAULT 1,
  start_date  DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ukończone sesje
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date  DATE NOT NULL,
  session_type  TEXT NOT NULL CHECK (session_type IN ('morning', 'midday', 'evening')),
  phase         INT NOT NULL,
  week_in_phase INT NOT NULL,
  is_deload     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  duration_sec  INT
);

-- Ukończone serie w ramach sesji
CREATE TABLE sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_key  TEXT NOT NULL CHECK (exercise_key IN ('type2_hold', 'power_flutter', 'type1_endurance')),
  set_number    INT NOT NULL,
  reps          INT,
  hold_sec      INT,
  completed     BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Wyłącz RLS (single user, brak auth)
ALTER TABLE program_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
