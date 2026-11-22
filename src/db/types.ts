export type ID = string;

export type Profile = {
  id: ID;
  name: string | null;
  sex: 'masculino' | 'feminino' | null;
  birth_year: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  experience_level: string | null;
  training_days: number | null;
  meals_per_day: number | null;
  goal: string | null;
  modality: string | null;
  bmr: number | null;
  tdee: number | null;
  fiber_goal_g: number;
  daily_kcal_goal: number | null;
  daily_protein_goal_g: number | null;
  daily_carbs_goal_g: number | null;
  daily_fat_goal_g: number | null;
  daily_water_goal_ml: number | null;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
};

export type Food = {
  id: ID;
  name: string;
  search: string;
  category: string;
  kcal_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number;
  sodium_mg_100g: number;
  popularity: number;
  source: string;
  barcode: string | null;
};

export type Exercise = {
  id: ID;
  name: string;
  modality: string;
  muscle_group: string;
  is_isometric: number;
  sort_order: number;
  equipment: string | null;
  level: string | null;
  instructions: string | null;
  image_key: string | null;
  secondary_muscles: string | null;
  source: string;
};

export type Program = {
  id: ID;
  name: string;
  description: string;
  goal: string;
  level: string;
  modality: string;
  days_per_week: number;
  weeks: number;
  equipment: string;
  focus_summary: string;
  progression: string;
  sort_order: number;
};

export type ProgramDay = {
  id: ID;
  program_id: ID;
  day_index: number;
  name: string;
  focus: string;
  sort_order: number;
};

export type ProgramDayExercise = {
  id: ID;
  program_day_id: ID;
  exercise_id: ID;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  rpe: number | null;
  notes: string | null;
};

export type WorkoutPlan = {
  id: ID;
  user_id: ID;
  day_index: number;
  name: string;
  focus: string;
};

export type PlanExercise = {
  id: ID;
  plan_id: ID;
  exercise_id: ID;
  position: number;
  sets: number;
  rest_seconds: number;
  name: string;
  muscle_group: string;
  equipment: string | null;
  is_isometric: number;
};

export type MealSlot = {
  id: ID;
  user_id: ID;
  day: string;
  position: number;
  name: string;
  target_pct: number;
  completed_at: string | null;
};

export type Meal = {
  id: ID;
  user_id: ID;
  day: string;
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  food_id: ID | null;
  grams: number | null;
  portion_label: string | null;
  slot_id: ID | null;
  source: string;
  logged_at: string | null;
};

export type BodyMetric = {
  id: ID;
  user_id: ID;
  day: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  hip_cm: number | null;
  chest_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
  created_at: string;
};

export type WaterLog = {
  id: ID;
  user_id: ID;
  day: string;
  amount_ml: number;
  logged_at: string | null;
};
