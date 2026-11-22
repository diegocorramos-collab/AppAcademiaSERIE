import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Loading, Row, Screen, SectionTitle } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { USER_ID, nowIso, uid } from '../../src/db';
import type { Program, ProgramDay } from '../../src/db/types';

type DayRow = ProgramDay & { total: number };

export default function ProgramaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [program, setProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<Program>('SELECT * FROM programs WHERE id = ?', [id]).then((p) => setProgram(p ?? null));
      db.getAllAsync<DayRow>(
        `SELECT pd.*, COUNT(pde.id) as total
           FROM program_days pd
           LEFT JOIN program_day_exercises pde ON pde.program_day_id = pd.id
          WHERE pd.program_id = ?
          GROUP BY pd.id ORDER BY pd.day_index`,
        [id],
      ).then(setDays);
    }, [db, id]),
  );

  async function startProgram() {
    if (!program || starting) return;
    setStarting(true);
    const ts = nowIso();

    await db.withTransactionAsync(async () => {
      await db.runAsync('UPDATE user_programs SET status = ?, updated_at = ? WHERE user_id = ? AND status = ?', [
        'archived', ts, USER_ID, 'active',
      ]);
      await db.runAsync('UPDATE workout_plans SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deleted_at IS NULL', [
        ts, ts, USER_ID,
      ]);

      await db.runAsync(
        `INSERT INTO user_programs
          (id, user_id, program_id, started_at, current_week, current_day_index, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, 0, 'active', ?, ?)`,
        [uid(), USER_ID, program.id, ts, ts, ts],
      );

      for (const day of days) {
        const planId = uid();
        await db.runAsync(
          `INSERT INTO workout_plans (id, user_id, day_index, name, focus, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [planId, USER_ID, day.day_index, `Treino ${day.name}`, day.focus, ts, ts],
        );
        const exs = await db.getAllAsync<{ exercise_id: string; position: number; sets: number; rest_seconds: number }>(
          'SELECT exercise_id, position, sets, rest_seconds FROM program_day_exercises WHERE program_day_id = ? ORDER BY position',
          [day.id],
        );
        for (const e of exs) {
          await db.runAsync(
            `INSERT INTO workout_plan_exercises
              (id, plan_id, exercise_id, position, sets, rest_seconds, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [uid(), planId, e.exercise_id, e.position, e.sets, e.rest_seconds, ts, ts],
          );
        }
      }
    });

    setStarting(false);
    router.replace('/(tabs)/treino');
  }

  if (!program) return <Loading />;

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">{program.modality}</AppText>
        <AppText variant="title">{program.name}</AppText>
        <AppText variant="muted">{program.description}</AppText>
      </View>

      <Card>
        <Row>
          <Stat label="Dias/semana" value={String(program.days_per_week)} />
          <Stat label="Semanas" value={String(program.weeks)} align="center" />
          <Stat label="Nível" value={program.level} align="flex-end" />
        </Row>
        <AppText variant="muted">Equipamento: {program.equipment}</AppText>
        <AppText variant="muted">Foco: {program.focus_summary}</AppText>
        <AppText variant="muted" style={{ color: colors.textDim }}>{program.progression}</AppText>
      </Card>

      <SectionTitle>Treinos</SectionTitle>
      {days.map((d) => (
        <Card key={d.id} onPress={() => router.push(`/programa/dia/${d.id}`)}>
          <Row>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="subtitle">Treino {d.name}</AppText>
              <AppText variant="muted">{d.focus}</AppText>
            </View>
            <AppText variant="muted">{d.total} exercícios</AppText>
          </Row>
        </Card>
      ))}

      <Button
        title={starting ? 'Montando treinos...' : 'Iniciar programa'}
        onPress={startProgram}
        disabled={starting}
        icon="play"
      />
    </Screen>
  );
}

function Stat({ label, value, align = 'flex-start' }: { label: string; value: string; align?: 'flex-start' | 'center' | 'flex-end' }) {
  return (
    <View style={{ alignItems: align, gap: 2 }}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="heading">{value}</AppText>
    </View>
  );
}
