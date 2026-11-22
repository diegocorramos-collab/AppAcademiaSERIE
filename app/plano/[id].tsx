import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Loading, Row, Screen, SectionTitle } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import type { PlanExercise, WorkoutPlan } from '../../src/db/types';

export default function PlanoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [items, setItems] = useState<PlanExercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<WorkoutPlan>('SELECT * FROM workout_plans WHERE id = ?', [id]).then((p) => setPlan(p ?? null));
      db.getAllAsync<PlanExercise>(
        `SELECT wpe.*, e.name, e.muscle_group, e.equipment, e.is_isometric
           FROM workout_plan_exercises wpe
           JOIN exercises e ON e.id = wpe.exercise_id
          WHERE wpe.plan_id = ? AND wpe.deleted_at IS NULL
          ORDER BY wpe.position`,
        [id],
      ).then(setItems);
    }, [db, id]),
  );

  if (!plan) return <Loading />;

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">{plan.focus}</AppText>
        <AppText variant="title">{plan.name}</AppText>
        <AppText variant="muted">{items.length} exercícios</AppText>
      </View>

      <SectionTitle>Sequência</SectionTitle>
      {items.map((e, i) => (
        <Card key={e.id}>
          <Row>
            <View style={{ width: 28 }}>
              <AppText variant="muted">{String(i + 1).padStart(2, '0')}</AppText>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="subtitle">{e.name}</AppText>
              <AppText variant="muted">
                {e.muscle_group}
                {e.equipment ? ` · ${e.equipment}` : ''}
              </AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="subtitle">{e.sets} séries</AppText>
              <AppText variant="muted">{e.rest_seconds}s</AppText>
            </View>
          </Row>
        </Card>
      ))}

      <Button
        title="Iniciar treino"
        icon="play"
        onPress={() => router.push(`/registrar?planId=${plan.id}&name=${encodeURIComponent(plan.name)}`)}
      />
      <AppText variant="muted" style={{ color: colors.textDim, textAlign: 'center' }}>
        O treino fica salvo no histórico com séries, repetições e cargas.
      </AppText>
    </Screen>
  );
}
