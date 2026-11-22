import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, ProgressBar, Row, Screen, SectionTitle, Stat } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { USER_ID, nowIso, uid } from '../../src/db';
import type { Profile } from '../../src/db/types';
import { formatDay, todayKey } from '../../src/lib/date';
import { kcal, num, pct } from '../../src/lib/format';

type Totals = { kcal: number; protein: number; carbs: number; fat: number };

export default function HojeScreen() {
  const db = useSQLiteContext();
  const day = todayKey();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totals, setTotals] = useState<Totals>({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const [water, setWater] = useState(0);
  const [plan, setPlan] = useState<{ id: string; name: string; focus: string; total: number } | null>(null);

  const load = useCallback(async () => {
    const p = await db.getFirstAsync<Profile>('SELECT * FROM user_profile WHERE id = ?', [USER_ID]);
    setProfile(p ?? null);

    const t = await db.getFirstAsync<Totals>(
      `SELECT COALESCE(SUM(kcal),0) as kcal, COALESCE(SUM(protein_g),0) as protein,
              COALESCE(SUM(carbs_g),0) as carbs, COALESCE(SUM(fat_g),0) as fat
         FROM meals WHERE user_id = ? AND day = ?`,
      [USER_ID, day],
    );
    setTotals(t ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 });

    const w = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount_ml),0) as total FROM water_logs WHERE user_id = ? AND day = ?',
      [USER_ID, day],
    );
    setWater(w?.total ?? 0);

    const pl = await db.getFirstAsync<{ id: string; name: string; focus: string; total: number }>(
      `SELECT wp.id, wp.name, wp.focus, COUNT(wpe.id) as total
         FROM workout_plans wp
         LEFT JOIN workout_plan_exercises wpe ON wpe.plan_id = wp.id AND wpe.deleted_at IS NULL
        WHERE wp.user_id = ? AND wp.deleted_at IS NULL
        GROUP BY wp.id ORDER BY wp.day_index LIMIT 1`,
      [USER_ID],
    );
    setPlan(pl ?? null);
  }, [day, db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addWater(amount: number) {
    const ts = nowIso();
    await db.runAsync(
      `INSERT INTO water_logs (id, user_id, day, amount_ml, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uid(), USER_ID, day, amount, ts, ts, ts],
    );
    setWater((w) => w + amount);
  }

  const goalKcal = profile?.daily_kcal_goal ?? 2000;
  const goalProtein = profile?.daily_protein_goal_g ?? 150;
  const goalCarbs = profile?.daily_carbs_goal_g ?? 200;
  const goalFat = profile?.daily_fat_goal_g ?? 60;
  const goalWater = profile?.daily_water_goal_ml ?? 3000;

  return (
    <Screen>
      <Row>
        <View>
          <AppText variant="label">{formatDay(day)}</AppText>
          <AppText variant="title">Olá, {profile?.name ?? 'atleta'}</AppText>
        </View>
        <Ionicons name="person-circle-outline" size={32} color={colors.textDim} onPress={() => router.push('/perfil')} />
      </Row>

      <Card>
        <Row>
          <Stat label="Consumido" value={`${kcal(totals.kcal)} kcal`} color={colors.accent} />
          <Stat label="Meta" value={`${kcal(goalKcal)} kcal`} align="flex-end" />
        </Row>
        <ProgressBar value={pct(totals.kcal, goalKcal)} />
        <Row style={{ marginTop: spacing.xs }}>
          <AppText variant="muted">Restam {kcal(Math.max(0, goalKcal - totals.kcal))} kcal</AppText>
          <AppText variant="muted">{Math.round(pct(totals.kcal, goalKcal) * 100)}%</AppText>
        </Row>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <MacroRow label="Proteína" value={totals.protein} goal={goalProtein} color={colors.protein} />
          <MacroRow label="Carboidrato" value={totals.carbs} goal={goalCarbs} color={colors.carbs} />
          <MacroRow label="Gordura" value={totals.fat} goal={goalFat} color={colors.fat} />
        </View>
        <Button title="Registrar refeição" variant="ghost" icon="add" onPress={() => router.push('/alimentacao')} />
      </Card>

      <Card>
        <Row>
          <Stat label="Água" value={`${(water / 1000).toFixed(2)} L`} color={colors.water} />
          <AppText variant="muted">meta {(goalWater / 1000).toFixed(1)} L</AppText>
        </Row>
        <ProgressBar value={pct(water, goalWater)} color={colors.water} />
        <Row style={{ gap: spacing.sm }}>
          <Button title="+250 ml" variant="ghost" onPress={() => addWater(250)} style={{ flex: 1 }} />
          <Button title="+500 ml" variant="ghost" onPress={() => addWater(500)} style={{ flex: 1 }} />
        </Row>
      </Card>

      <SectionTitle>Treino</SectionTitle>
      {plan ? (
        <Card>
          <Row>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{plan.name}</AppText>
              <AppText variant="muted">{plan.focus}</AppText>
            </View>
            <AppText variant="muted">{num(plan.total)} exercícios</AppText>
          </Row>
          <Button title="Abrir treino" icon="barbell-outline" onPress={() => router.push(`/plano/${plan.id}`)} />
        </Card>
      ) : (
        <Card>
          <AppText variant="subtitle">Nenhum plano ativo</AppText>
          <AppText variant="muted">Comece com um programa pronto de 8 semanas.</AppText>
          <Button title="Ver programas" onPress={() => router.push('/programas')} />
        </Card>
      )}
    </Screen>
  );
}

function MacroRow({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Row>
        <AppText variant="muted">{label}</AppText>
        <AppText variant="muted">
          {Math.round(value)} / {Math.round(goal)} g
        </AppText>
      </Row>
      <ProgressBar value={pct(value, goal)} color={color} height={6} />
    </View>
  );
}
