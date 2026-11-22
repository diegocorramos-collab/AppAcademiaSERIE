import { ageFromYear } from './date';

export const ACTIVITY_FACTORS: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  atleta: 1.9,
};

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  atleta: 'Atleta',
};

export const GOAL_LABELS: Record<string, string> = {
  perder: 'Perder gordura',
  manter: 'Manter',
  ganhar: 'Ganhar massa',
};

export const GOAL_ADJUST: Record<string, number> = {
  perder: -0.2,
  manter: 0,
  ganhar: 0.1,
};

export type MacroTargets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
};

export function computeBmr(input: {
  sex?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  birthYear?: number | null;
}): number {
  const weight = input.weightKg ?? 70;
  const height = input.heightCm ?? 170;
  const age = ageFromYear(input.birthYear);
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(input.sex === 'feminino' ? base - 161 : base + 5);
}

export function computeTdee(bmr: number, activityLevel?: string | null): number {
  return Math.round(bmr * (ACTIVITY_FACTORS[activityLevel ?? 'moderado'] ?? 1.55));
}

export function computeTargets(input: {
  sex?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  birthYear?: number | null;
  activityLevel?: string | null;
  goal?: string | null;
}): MacroTargets {
  const bmr = computeBmr(input);
  const tdee = computeTdee(bmr, input.activityLevel);
  const kcal = Math.round(tdee * (1 + (GOAL_ADJUST[input.goal ?? 'manter'] ?? 0)));
  const weight = input.weightKg ?? 70;

  const proteinPerKg = input.goal === 'perder' ? 2.2 : 1.8;
  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round(Math.max(weight * 0.8, (kcal * 0.25) / 9));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = Math.round((kcal / 1000) * 14);

  return { kcal, protein, carbs, fat, fiber, water: Math.round(weight * 35) };
}

export const SLOT_TEMPLATES: Record<number, { name: string; pct: number }[]> = {
  3: [
    { name: 'Café da manhã', pct: 30 },
    { name: 'Almoço', pct: 40 },
    { name: 'Jantar', pct: 30 },
  ],
  4: [
    { name: 'Café da manhã', pct: 25 },
    { name: 'Almoço', pct: 35 },
    { name: 'Lanche da tarde', pct: 15 },
    { name: 'Jantar', pct: 25 },
  ],
  5: [
    { name: 'Café da manhã', pct: 22 },
    { name: 'Lanche da manhã', pct: 10 },
    { name: 'Almoço', pct: 30 },
    { name: 'Lanche da tarde', pct: 13 },
    { name: 'Jantar', pct: 25 },
  ],
  6: [
    { name: 'Café da manhã', pct: 20 },
    { name: 'Lanche da manhã', pct: 8 },
    { name: 'Almoço', pct: 27 },
    { name: 'Lanche da tarde', pct: 10 },
    { name: 'Jantar', pct: 25 },
    { name: 'Ceia', pct: 10 },
  ],
};

export function slotsFor(mealsPerDay: number | null | undefined) {
  return SLOT_TEMPLATES[mealsPerDay ?? 5] ?? SLOT_TEMPLATES[5];
}

export function bmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}
