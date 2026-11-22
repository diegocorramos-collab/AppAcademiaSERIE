import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Field, Row, Screen, Segmented } from '../src/components/ui';
import { colors, spacing } from '../src/theme';
import { USER_ID, nowIso, uid } from '../src/db';
import { computeBmr, computeTargets, computeTdee, slotsFor } from '../src/lib/nutrition';
import { todayKey } from '../src/lib/date';
import { parseNumber } from '../src/lib/format';

export default function Onboarding() {
  const db = useSQLiteContext();
  const [name, setName] = useState('Diego');
  const [sex, setSex] = useState<'masculino' | 'feminino'>('masculino');
  const [birthYear, setBirthYear] = useState('1990');
  const [height, setHeight] = useState('172');
  const [weight, setWeight] = useState('110');
  const [activity, setActivity] = useState('moderado');
  const [experience, setExperience] = useState('iniciante');
  const [trainingDays, setTrainingDays] = useState('3');
  const [mealsPerDay, setMealsPerDay] = useState('5');
  const [goal, setGoal] = useState('perder');
  const [modality, setModality] = useState('musculacao');
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    try {
      const weightKg = parseNumber(weight) ?? 70;
      const heightCm = parseNumber(height) ?? 170;
      const year = parseNumber(birthYear) ?? 1990;
      const targets = computeTargets({
        sex,
        weightKg,
        heightCm,
        birthYear: year,
        activityLevel: activity,
        goal,
      });
      const bmr = computeBmr({ sex, weightKg, heightCm, birthYear: year });
      const tdee = computeTdee(bmr, activity);

      const ts = nowIso();
      await db.runAsync(
        `INSERT INTO user_profile
          (id, name, sex, birth_year, height_cm, weight_kg, activity_level, experience_level,
           training_days, meals_per_day, goal, modality, bmr, tdee, fiber_goal_g,
           daily_kcal_goal, daily_protein_goal_g, daily_carbs_goal_g, daily_fat_goal_g,
           daily_water_goal_ml, onboarding_completed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, sex=excluded.sex, birth_year=excluded.birth_year,
           height_cm=excluded.height_cm, weight_kg=excluded.weight_kg,
           activity_level=excluded.activity_level, experience_level=excluded.experience_level,
           training_days=excluded.training_days, meals_per_day=excluded.meals_per_day,
           goal=excluded.goal, modality=excluded.modality, bmr=excluded.bmr, tdee=excluded.tdee,
           fiber_goal_g=excluded.fiber_goal_g, daily_kcal_goal=excluded.daily_kcal_goal,
           daily_protein_goal_g=excluded.daily_protein_goal_g,
           daily_carbs_goal_g=excluded.daily_carbs_goal_g,
           daily_fat_goal_g=excluded.daily_fat_goal_g,
           daily_water_goal_ml=excluded.daily_water_goal_ml,
           onboarding_completed=1, updated_at=excluded.updated_at`,
        [
          USER_ID, name, sex, year, heightCm, weightKg, activity, experience,
          Number(trainingDays), Number(mealsPerDay), goal, modality,
          bmr, tdee,
          targets.fiber, targets.kcal, targets.protein, targets.carbs, targets.fat,
          targets.water, ts, ts,
        ],
      );

      // medidas iniciais
      await db.runAsync(
        `INSERT INTO body_metrics (id, user_id, day, weight_kg, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uid(), USER_ID, todayKey(), weightKg, ts, ts],
      );

      // slots de refeição de hoje
      const day = todayKey();
      for (const [i, s] of slotsFor(Number(mealsPerDay)).entries()) {
        await db.runAsync(
          `INSERT OR IGNORE INTO meal_slots (id, user_id, day, position, name, target_pct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uid(), USER_ID, day, i, s.name, s.pct, ts, ts],
        );
      }

      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs, marginTop: spacing.lg }}>
        <AppText variant="label">Bem-vindo ao</AppText>
        <AppText variant="title" style={{ fontSize: 40 }}>SÉRIE</AppText>
        <AppText variant="muted">
          Treino, alimentação e evolução em um só lugar. Vamos configurar suas metas.
        </AppText>
      </View>

      <Card>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
        <View style={{ gap: spacing.xs }}>
          <AppText variant="label">Sexo</AppText>
          <Segmented
            value={sex}
            onChange={setSex}
            options={[
              { value: 'masculino', label: 'Masculino' },
              { value: 'feminino', label: 'Feminino' },
            ]}
          />
        </View>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Nascimento" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" suffix="ano" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Altura" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Peso" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" />
          </View>
        </Row>
      </Card>

      <Card>
        <AppText variant="label">Nível de atividade</AppText>
        <Segmented
          value={activity}
          onChange={setActivity}
          options={[
            { value: 'sedentario', label: 'Sedentário' },
            { value: 'leve', label: 'Leve' },
            { value: 'moderado', label: 'Moderado' },
            { value: 'intenso', label: 'Intenso' },
          ]}
        />
        <AppText variant="label">Experiência</AppText>
        <Segmented
          value={experience}
          onChange={setExperience}
          options={[
            { value: 'iniciante', label: 'Iniciante' },
            { value: 'intermediario', label: 'Intermediário' },
            { value: 'avancado', label: 'Avançado' },
          ]}
        />
        <AppText variant="label">Objetivo</AppText>
        <Segmented
          value={goal}
          onChange={setGoal}
          options={[
            { value: 'perder', label: 'Perder gordura' },
            { value: 'manter', label: 'Manter' },
            { value: 'ganhar', label: 'Ganhar massa' },
          ]}
        />
        <AppText variant="label">Modalidade</AppText>
        <Segmented
          value={modality}
          onChange={setModality}
          options={[
            { value: 'musculacao', label: 'Musculação' },
            { value: 'calistenia', label: 'Calistenia' },
            { value: 'hibrido', label: 'Híbrido' },
          ]}
        />
      </Card>

      <Card>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Treinos/semana" value={trainingDays} onChangeText={setTrainingDays} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Refeições/dia" value={mealsPerDay} onChangeText={setMealsPerDay} keyboardType="number-pad" />
          </View>
        </Row>
        <AppText variant="muted">
          Com esses dados calculamos TMB, gasto diário e metas de macros automaticamente.
        </AppText>
      </Card>

      <Button title={saving ? 'Salvando...' : 'Começar'} onPress={finish} disabled={saving} icon="arrow-forward" />
      <View style={{ height: spacing.xxl }} />
      <AppText variant="muted" style={{ textAlign: 'center', color: colors.textMuted }}>
        Seus dados ficam apenas neste aparelho (SQLite).
      </AppText>
    </Screen>
  );
}
