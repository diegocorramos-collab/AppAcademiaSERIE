import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Loading, Row, Screen, SectionTitle } from '../../../src/components/ui';
import { colors, spacing } from '../../../src/theme';
import { USER_ID, nowIso, uid } from '../../../src/db';
import type { ProgramDay } from '../../../src/db/types';

type RowEx = {
  id: string;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  rpe: number | null;
  notes: string | null;
  exercise_id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  is_isometric: number;
};

export default function ProgramaDia() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [day, setDay] = useState<ProgramDay | null>(null);
  const [items, setItems] = useState<RowEx[]>([]);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<ProgramDay>('SELECT * FROM program_days WHERE id = ?', [id]).then((d) => setDay(d ?? null));
      db.getAllAsync<RowEx>(
        `SELECT pde.*, e.name, e.muscle_group, e.equipment, e.is_isometric
           FROM program_day_exercises pde
           JOIN exercises e ON e.id = pde.exercise_id
          WHERE pde.program_day_id = ? ORDER BY pde.position`,
        [id],
      ).then(setItems);
    }, [db, id]),
  );

  async function useAsPlan() {
    if (!day || busy) return;
    setBusy(true);
    const ts = nowIso();

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM workout_plans WHERE user_id = ? AND day_index = ? AND deleted_at IS NULL',
      [USER_ID, day.day_index],
    );

    let planId = existing?.id;
    if (planId) {
      await db.runAsync('UPDATE workout_plans SET name = ?, focus = ?, updated_at = ? WHERE id = ?', [
        `Treino ${day.name}`, day.focus, ts, planId,
      ]);
      await db.runAsync('DELETE FROM workout_plan_exercises WHERE plan_id = ?', [planId]);
    } else {
      planId = uid();
      await db.runAsync(
        `INSERT INTO workout_plans (id, user_id, day_index, name, focus, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [planId, USER_ID, day.day_index, `Treino ${day.name}`, day.focus, ts, ts],
      );
    }

    for (const [i, e] of items.entries()) {
      await db.runAsync(
        `INSERT INTO workout_plan_exercises
          (id, plan_id, exercise_id, position, sets, rest_seconds, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uid(), planId, e.exercise_id, i, e.sets, e.rest_seconds, ts, ts],
      );
    }

    setBusy(false);
    router.replace(`/plano/${planId}`);
  }

  if (!day) return <Loading />;

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">Treino {day.name}</AppText>
        <AppText variant="title">{day.focus}</AppText>
        <AppText variant="muted">{items.length} exercícios</AppText>
      </View>

      <SectionTitle>Exercícios</SectionTitle>
      {items.map((e) => (
        <Card key={e.id}>
          <Row>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="subtitle">{e.name}</AppText>
              <AppText variant="muted">
                {e.muscle_group}
                {e.equipment ? ` · ${e.equipment}` : ''}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="subtitle">
                {e.is_isometric ? `${e.sets} × ${e.reps_max}s` : `${e.sets} × ${e.reps_min}-${e.reps_max}`}
              </AppText>
              <AppText variant="muted">{e.rest_seconds}s descanso</AppText>
            </View>
          </Row>
          {e.notes ? <AppText variant="muted" style={{ color: colors.textDim }}>{e.notes}</AppText> : null}
        </Card>
      ))}

      <Button
        title={busy ? 'Salvando...' : 'Usar como meu treino'}
        onPress={useAsPlan}
        disabled={busy}
        icon="download-outline"
      />
    </Screen>
  );
}
