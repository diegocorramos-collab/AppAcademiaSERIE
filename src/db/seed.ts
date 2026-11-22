import type { SQLiteDatabase } from 'expo-sqlite';
import { SEED_VERSION } from './schema';

type FoodSeed = {
  id: string;
  name: string;
  search: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  popularity: number;
  source: string;
};

type ExerciseSeed = {
  id: string;
  dataset_id?: string;
  name: string;
  muscle_group: string;
  modality: string;
  is_isometric: number;
  equipment?: string;
  level?: string;
  instructions?: string;
  image_key?: string;
  secondary_muscles?: string;
  sort_order?: number;
};

type ProgramSeed = {
  id: string;
  name: string;
  description: string;
  goal: string;
  level: string;
  modality: string;
  daysPerWeek: number;
  weeks: number;
  equipment: string;
  focusSummary: string;
  progression: string;
  sortOrder: number;
  days: {
    name: string;
    focus: string;
    exercises: {
      exerciseId: string;
      sets: number;
      repsMin: number;
      repsMax: number;
      restSeconds: number;
      rpe: number | null;
      notes: string | null;
    }[];
  }[];
};

// require evita depender de resolveJsonModule no tsconfig
const foods = require('../data/foods.json') as FoodSeed[];
const exercises = require('../data/exercises.json') as ExerciseSeed[];
const programs = require('../data/programs.json') as ProgramSeed[];

export async function seedDatabase(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'seed_version'",
  );
  if (row && Number(row.value) >= SEED_VERSION) return;

  await db.withTransactionAsync(async () => {
    await seedFoods(db);
    await seedExercises(db);
    await seedPrograms(db);
    await db.runAsync(
      "INSERT INTO app_meta (key, value) VALUES ('seed_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [String(SEED_VERSION)],
    );
  });
}

async function seedFoods(db: SQLiteDatabase) {
  const stmt = await db.prepareAsync(
    `INSERT OR REPLACE INTO foods
      (id, name, search, category, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, sodium_mg_100g, popularity, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  try {
    for (const f of foods) {
      await stmt.executeAsync([
        f.id, f.name, f.search, f.category,
        f.kcal, f.protein, f.carbs, f.fat, f.fiber, f.sodium,
        f.popularity ?? 0, f.source ?? 'taco',
      ]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
}

async function seedExercises(db: SQLiteDatabase) {
  const stmt = await db.prepareAsync(
    `INSERT OR REPLACE INTO exercises
      (id, name, modality, muscle_group, is_isometric, sort_order, equipment, level, instructions, image_key, secondary_muscles, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'library')`,
  );
  const now = new Date().toISOString();
  try {
    for (const e of exercises) {
      await stmt.executeAsync([
        e.id, e.name, e.modality, e.muscle_group, e.is_isometric ?? 0,
        e.sort_order ?? 0, e.equipment ?? null, e.level ?? null,
        e.instructions ?? null, e.image_key ?? null, e.secondary_muscles ?? null,
      ]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
  void now;
}

async function seedPrograms(db: SQLiteDatabase) {
  const progStmt = await db.prepareAsync(
    `INSERT OR REPLACE INTO programs
      (id, name, description, goal, level, modality, days_per_week, weeks, equipment, focus_summary, progression, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const dayStmt = await db.prepareAsync(
    `INSERT OR REPLACE INTO program_days (id, program_id, day_index, name, focus, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const exStmt = await db.prepareAsync(
    `INSERT OR REPLACE INTO program_day_exercises
      (id, program_day_id, exercise_id, position, sets, reps_min, reps_max, rest_seconds, rpe, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  try {
    for (const p of programs) {
      await progStmt.executeAsync([
        p.id, p.name, p.description, p.goal, p.level, p.modality,
        p.daysPerWeek, p.weeks, p.equipment, p.focusSummary, p.progression, p.sortOrder,
      ]);
      for (let i = 0; i < p.days.length; i++) {
        const d = p.days[i];
        const dayId = `${p.id}-d${i + 1}`;
        await dayStmt.executeAsync([dayId, p.id, i, d.name, d.focus, i]);
        for (let j = 0; j < d.exercises.length; j++) {
          const e = d.exercises[j];
          await exStmt.executeAsync([
            `${dayId}-e${j + 1}`, dayId, e.exerciseId, j,
            e.sets, e.repsMin, e.repsMax, e.restSeconds, e.rpe, e.notes,
          ]);
        }
      }
    }
  } finally {
    await progStmt.finalizeAsync();
    await dayStmt.finalizeAsync();
    await exStmt.finalizeAsync();
  }
}
