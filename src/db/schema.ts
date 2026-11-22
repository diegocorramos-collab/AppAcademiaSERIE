/** Coleção de migrações do banco. Versão atual = último item. */
export type Migration = { version: number; up: string };

const V1 = `
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS storage (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT,
  sex TEXT,
  birth_year INTEGER,
  height_cm REAL,
  weight_kg REAL,
  activity_level TEXT,
  experience_level TEXT,
  training_days INTEGER,
  meals_per_day INTEGER,
  goal TEXT,
  modality TEXT,
  bmr INTEGER,
  tdee INTEGER,
  fiber_goal_g INTEGER NOT NULL DEFAULT 30,
  daily_kcal_goal INTEGER,
  daily_protein_goal_g INTEGER,
  daily_carbs_goal_g INTEGER,
  daily_fat_goal_g INTEGER,
  daily_water_goal_ml INTEGER,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS foods (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  search TEXT NOT NULL,
  category TEXT NOT NULL,
  kcal_100g REAL NOT NULL,
  protein_100g REAL NOT NULL DEFAULT 0,
  carbs_100g REAL NOT NULL DEFAULT 0,
  fat_100g REAL NOT NULL DEFAULT 0,
  fiber_100g REAL NOT NULL DEFAULT 0,
  sodium_mg_100g REAL NOT NULL DEFAULT 0,
  popularity INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'taco',
  barcode TEXT,
  user_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_foods_search ON foods (search);

CREATE TABLE IF NOT EXISTS food_portions (
  id TEXT PRIMARY KEY NOT NULL,
  food_id TEXT NOT NULL REFERENCES foods(id),
  label TEXT NOT NULL,
  grams REAL NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_food_portions_food ON food_portions (food_id);

CREATE TABLE IF NOT EXISTS food_favorites (
  user_id TEXT NOT NULL,
  food_id TEXT NOT NULL REFERENCES foods(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, food_id)
);

CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  kcal REAL NOT NULL DEFAULT 0,
  protein_g REAL NOT NULL DEFAULT 0,
  carbs_g REAL NOT NULL DEFAULT 0,
  fat_g REAL NOT NULL DEFAULT 0,
  fiber_g REAL NOT NULL DEFAULT 0,
  food_id TEXT,
  grams REAL,
  portion_label TEXT,
  slot_id TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  logged_at TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_meals_day ON meals (user_id, day);

CREATE TABLE IF NOT EXISTS meal_slots (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  target_pct REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  completed_at TEXT,
  UNIQUE (user_id, day, position)
);

CREATE TABLE IF NOT EXISTS water_logs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_water_day ON water_logs (user_id, day);

CREATE TABLE IF NOT EXISTS body_metrics (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  weight_kg REAL,
  body_fat_pct REAL,
  waist_cm REAL,
  hip_cm REAL,
  chest_cm REAL,
  arm_cm REAL,
  thigh_cm REAL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_body_metrics_day ON body_metrics (user_id, day);

CREATE TABLE IF NOT EXISTS progress_photos (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  uri TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  modality TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  is_isometric INTEGER NOT NULL DEFAULT 0,
  progression_parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  equipment TEXT,
  level TEXT,
  instructions TEXT,
  image_key TEXT,
  secondary_muscles TEXT,
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_exercises_group ON exercises (muscle_group);

CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  focus TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (user_id, day_index)
);

CREATE TABLE IF NOT EXISTS workout_plan_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  plan_id TEXT NOT NULL REFERENCES workout_plans(id),
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  position INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  rest_seconds INTEGER NOT NULL DEFAULT 60,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (plan_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  started_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_sets (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  day TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg REAL,
  hold_seconds INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sets_session ON session_sets (session_id);

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  goal TEXT NOT NULL,
  level TEXT NOT NULL,
  modality TEXT NOT NULL,
  days_per_week INTEGER NOT NULL,
  weeks INTEGER NOT NULL,
  equipment TEXT NOT NULL,
  focus_summary TEXT NOT NULL,
  progression TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS program_days (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id),
  day_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  focus TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (program_id, day_index)
);

CREATE TABLE IF NOT EXISTS program_day_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  program_day_id TEXT NOT NULL REFERENCES program_days(id),
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  position INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  reps_min INTEGER NOT NULL,
  reps_max INTEGER NOT NULL,
  rest_seconds INTEGER NOT NULL,
  rpe REAL,
  notes TEXT,
  UNIQUE (program_day_id, position)
);

CREATE TABLE IF NOT EXISTS user_programs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL REFERENCES programs(id),
  started_at TEXT NOT NULL,
  current_week INTEGER NOT NULL DEFAULT 1,
  current_day_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS program_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  user_program_id TEXT NOT NULL,
  program_day_id TEXT NOT NULL,
  week INTEGER NOT NULL,
  day_index INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_program_id, week, day_index)
);
`;

export const migrations: Migration[] = [{ version: 1, up: V1 }];

export const SEED_VERSION = 1;
