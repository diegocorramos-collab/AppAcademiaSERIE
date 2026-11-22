import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, EmptyState, Row, Screen, SectionTitle } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { USER_ID } from '../../src/db';

type PlanRow = { id: string; name: string; focus: string; total: number };

export default function TreinoScreen() {
  const db = useSQLiteContext();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [sessionCount, setSessionCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      db.getAllAsync<PlanRow>(
        `SELECT wp.id, wp.name, wp.focus, COUNT(wpe.id) as total
           FROM workout_plans wp
           LEFT JOIN workout_plan_exercises wpe ON wpe.plan_id = wp.id AND wpe.deleted_at IS NULL
          WHERE wp.user_id = ? AND wp.deleted_at IS NULL
          GROUP BY wp.id ORDER BY wp.day_index`,
        [USER_ID],
      ).then(setPlans);

      db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) as total FROM workout_sessions WHERE user_id = ?',
        [USER_ID],
      ).then((r) => setSessionCount(r?.total ?? 0));
    }, [db]),
  );

  return (
    <Screen>
      <Row>
        <View style={{ gap: 2 }}>
          <AppText variant="label">Seus treinos</AppText>
          <AppText variant="title">{plans.length} dias na semana</AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="label">Sessões</AppText>
          <AppText variant="heading">{sessionCount}</AppText>
        </View>
      </Row>

      {plans.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar-outline"
            title="Nenhum treino montado"
            description="Escolha um programa pronto ou monte seu plano no onboarding."
            action={<Button title="Ver programas" onPress={() => router.push('/programas')} />}
          />
        </Card>
      ) : (
        plans.map((p) => (
          <Card key={p.id}>
            <Row>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="heading">{p.name}</AppText>
                <AppText variant="muted">{p.focus}</AppText>
              </View>
              <AppText variant="muted">{p.total} exercícios</AppText>
            </Row>
            <Button
              title="Ver exercícios"
              variant="ghost"
              onPress={() => router.push(`/plano/${p.id}`)}
            />
          </Card>
        ))
      )}

      <SectionTitle>Explorar</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Button title="Programas de 8 semanas" icon="layers-outline" onPress={() => router.push('/programas')} />
        <Button title="Biblioteca de exercícios" variant="ghost" icon="search" onPress={() => router.push('/exercicios')} />
      </Card>
    </Screen>
  );
}
