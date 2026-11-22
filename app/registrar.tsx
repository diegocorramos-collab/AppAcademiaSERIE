import React, { useCallback, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Loading, Row, Screen, SectionTitle } from '../src/components/ui';
import { colors, fonts, radius, spacing } from '../src/theme';
import { USER_ID, nowIso, uid } from '../src/db';
import type { PlanExercise } from '../src/db/types';
import { todayKey } from '../src/lib/date';

type Entry = { reps: string[]; weight: string[] };

export default function Registrar() {
  const { planId, name } = useLocalSearchParams<{ planId: string; name?: string }>();
  const db = useSQLiteContext();
  const [items, setItems] = useState<PlanExercise[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      db.getAllAsync<PlanExercise>(
        `SELECT wpe.*, e.name, e.muscle_group, e.equipment, e.is_isometric
           FROM workout_plan_exercises wpe
           JOIN exercises e ON e.id = wpe.exercise_id
          WHERE wpe.plan_id = ? AND wpe.deleted_at IS NULL
          ORDER BY wpe.position`,
        [planId],
      ).then((rows) => {
        setItems(rows);
        const init: Record<string, Entry> = {};
        for (const r of rows) {
          init[r.id] = { reps: Array(r.sets).fill(''), weight: Array(r.sets).fill('') };
        }
        setEntries(init);
      });
    }, [db, planId]),
  );

  const filled = useMemo(
    () =>
      Object.values(entries).reduce(
        (acc, e) => acc + e.reps.filter((r) => r.trim() !== '').length,
        0,
      ),
    [entries],
  );

  function update(planExerciseId: string, kind: 'reps' | 'weight', index: number, value: string) {
    setEntries((cur) => {
      const entry = cur[planExerciseId];
      if (!entry) return cur;
      const list = [...entry[kind]];
      list[index] = value;
      return { ...cur, [planExerciseId]: { ...entry, [kind]: list } };
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const ts = nowIso();
    const day = todayKey();
    const sessionId = uid();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO workout_sessions (id, user_id, day, name, started_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, USER_ID, day, name ?? 'Treino', ts, ts, ts],
      );

      for (const item of items) {
        const entry = entries[item.id];
        if (!entry) continue;
        for (let i = 0; i < entry.reps.length; i++) {
          const reps = Number(entry.reps[i].replace(',', '.'));
          if (!entry.reps[i].trim()) continue;
          const weight = Number((entry.weight[i] || '0').replace(',', '.'));
          await db.runAsync(
            `INSERT INTO session_sets
              (id, session_id, user_id, exercise_id, day, set_number, reps, weight_kg, hold_seconds, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uid(), sessionId, USER_ID, item.exercise_id, day, i + 1,
              item.is_isometric ? null : Number.isFinite(reps) ? reps : null,
              Number.isFinite(weight) ? weight : null,
              item.is_isometric ? (Number.isFinite(reps) ? reps : null) : null,
              ts, ts,
            ],
          );
        }
      }
    });

    setSaving(false);
    router.replace('/(tabs)/treino');
  }

  if (items.length === 0) return <Loading />;

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="label">Sessão</AppText>
        <AppText variant="title">{name ?? 'Treino'}</AppText>
        <AppText variant="muted">{filled} séries registradas</AppText>
      </View>

      {items.map((item) => {
        const entry = entries[item.id];
        return (
          <Card key={item.id}>
            <Row>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="subtitle">{item.name}</AppText>
                <AppText variant="muted">{item.sets} séries · {item.rest_seconds}s descanso</AppText>
              </View>
            </Row>

            {Array.from({ length: item.sets }).map((_, i) => (
              <Row key={i} style={{ gap: spacing.sm }}>
                <AppText variant="muted" style={{ width: 54 }}>Série {i + 1}</AppText>
                <TextInput
                  value={entry?.reps[i] ?? ''}
                  onChangeText={(v) => update(item.id, 'reps', i, v)}
                  keyboardType="number-pad"
                  placeholder={item.is_isometric ? 'seg' : 'reps'}
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
                />
                {item.is_isometric ? null : (
                  <TextInput
                    value={entry?.weight[i] ?? ''}
                    onChangeText={(v) => update(item.id, 'weight', i, v)}
                    keyboardType="decimal-pad"
                    placeholder="kg"
                    placeholderTextColor={colors.textMuted}
                    style={inputStyle}
                  />
                )}
              </Row>
            ))}
          </Card>
        );
      })}

      <Button title={saving ? 'Salvando...' : 'Finalizar treino'} onPress={save} disabled={saving} icon="checkmark" />
    </Screen>
  );
}

const inputStyle = {
  flex: 1,
  backgroundColor: colors.surfaceAlt,
  borderRadius: radius.sm,
  paddingVertical: 10,
  paddingHorizontal: spacing.md,
  color: colors.text,
  fontFamily: fonts.body,
  fontSize: 14,
} as const;
