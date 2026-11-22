import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, EmptyState, ProgressBar, Row, Screen } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { USER_ID, nowIso, uid } from '../../src/db';
import type { Meal, MealSlot, Profile } from '../../src/db/types';
import { todayKey } from '../../src/lib/date';
import { kcal, pct } from '../../src/lib/format';
import { slotsFor } from '../../src/lib/nutrition';

type SlotTotals = MealSlot & { kcal_total: number; protein_total: number; items: number };

export default function AlimentacaoScreen() {
  const db = useSQLiteContext();
  const day = todayKey();
  const [slots, setSlots] = useState<SlotTotals[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totals, setTotals] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const ensureSlots = useCallback(
    async (mealsPerDay: number) => {
      const existing = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) as total FROM meal_slots WHERE user_id = ? AND day = ? AND deleted_at IS NULL',
        [USER_ID, day],
      );
      if ((existing?.total ?? 0) > 0) return;
      const ts = nowIso();
      for (const [i, s] of slotsFor(mealsPerDay).entries()) {
        await db.runAsync(
          `INSERT INTO meal_slots (id, user_id, day, position, name, target_pct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uid(), USER_ID, day, i, s.name, s.pct, ts, ts],
        );
      }
    },
    [day, db],
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await db.getFirstAsync<Profile>('SELECT * FROM user_profile WHERE id = ?', [USER_ID]);
        setProfile(p ?? null);
        await ensureSlots(p?.meals_per_day ?? 5);

        const rows = await db.getAllAsync<SlotTotals>(
          `SELECT ms.*, 
                  COALESCE((SELECT SUM(m.kcal) FROM meals m WHERE m.slot_id = ms.id), 0) as kcal_total,
                  COALESCE((SELECT SUM(m.protein_g) FROM meals m WHERE m.slot_id = ms.id), 0) as protein_total,
                  COALESCE((SELECT COUNT(*) FROM meals m WHERE m.slot_id = ms.id), 0) as items
             FROM meal_slots ms
            WHERE ms.user_id = ? AND ms.day = ? AND ms.deleted_at IS NULL
            ORDER BY ms.position`,
          [USER_ID, day],
        );
        setSlots(rows);

        const todayMeals = await db.getAllAsync<Meal>(
          'SELECT * FROM meals WHERE user_id = ? AND day = ? ORDER BY created_at',
          [USER_ID, day],
        );
        setMeals(todayMeals);

        const t = await db.getFirstAsync<{ kcal: number; protein: number; carbs: number; fat: number }>(
          `SELECT COALESCE(SUM(kcal),0) kcal, COALESCE(SUM(protein_g),0) protein,
                  COALESCE(SUM(carbs_g),0) carbs, COALESCE(SUM(fat_g),0) fat
             FROM meals WHERE user_id = ? AND day = ?`,
          [USER_ID, day],
        );
        setTotals(t ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      })();
    }, [db, day, ensureSlots]),
  );

  const goal = profile?.daily_kcal_goal ?? 2000;

  return (
    <Screen>
      <Card>
        <Row>
          <View>
            <AppText variant="label">Hoje</AppText>
            <AppText variant="title">{kcal(totals.kcal)} kcal</AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="label">Meta</AppText>
            <AppText variant="subtitle">{kcal(goal)} kcal</AppText>
          </View>
        </Row>
        <ProgressBar value={pct(totals.kcal, goal)} />
        <Row>
          <AppText variant="muted">P {Math.round(totals.protein)} g</AppText>
          <AppText variant="muted">C {Math.round(totals.carbs)} g</AppText>
          <AppText variant="muted">G {Math.round(totals.fat)} g</AppText>
        </Row>
      </Card>

      {slots.length === 0 ? (
        <EmptyState title="Sem refeições hoje" description="Toque em uma refeição para adicionar alimentos." />
      ) : (
        slots.map((s) => (
          <Card key={s.id}>
            <Row>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="heading">{s.name}</AppText>
                <AppText variant="muted">
                  {s.items} {s.items === 1 ? 'item' : 'itens'} · meta {s.target_pct}%
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="subtitle">{kcal(s.kcal_total)} kcal</AppText>
                <AppText variant="muted">{Math.round(s.protein_total)} g proteína</AppText>
              </View>
            </Row>
            <Row style={{ gap: spacing.sm }}>
              <Button
                title="Adicionar"
                icon="add"
                variant="ghost"
                style={{ flex: 1 }}
                onPress={() => router.push(`/alimentos?slot=${s.id}&day=${day}`)}
              />
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                onPress={() => router.push(`/alimentos?slot=${s.id}&day=${day}`)}
              />
            </Row>

            {meals
              .filter((m) => m.slot_id === s.id)
              .map((m) => (
                <AppText
                  key={m.id}
                  variant="muted"
                  onPress={() => router.push(`/refeicao/${m.id}`)}
                  style={{ paddingVertical: 4 }}
                >
                  • {m.name} — {kcal(m.kcal)} kcal
                </AppText>
              ))}
          </Card>
        ))
      )}

      <Button
        title="Criar alimento personalizado"
        variant="ghost"
        icon="flask-outline"
        onPress={() => router.push('/alimento-personalizado')}
      />
    </Screen>
  );
}
