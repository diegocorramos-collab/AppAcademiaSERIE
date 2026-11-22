import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Card, EmptyState, Field, Row, Screen, Segmented } from '../src/components/ui';
import { ExerciseImage } from '../src/components/ExerciseImage';
import type { Exercise } from '../src/db/types';
import { spacing } from '../src/theme';

const GROUPS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Core', 'Panturrilha'];

export default function Exercicios() {
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const [items, setItems] = useState<Exercise[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const where: string[] = [];
    const params: unknown[] = [];
    if (query.trim()) {
      where.push('name LIKE ?');
      params.push(`%${query.trim()}%`);
    }
    if (group) {
      where.push('muscle_group = ?');
      params.push(group);
    }
    const sql = `SELECT * FROM exercises ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY muscle_group, name LIMIT 200`;
    setItems(await db.getAllAsync<Exercise>(sql, params as never));
  }, [db, group, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Field label="Buscar exercício" value={query} onChangeText={setQuery} placeholder="supino, agachamento..." />
      <Segmented
        value={group}
        onChange={(g) => setGroup((cur) => (cur === g ? null : g))}
        options={GROUPS.map((g) => ({ value: g, label: g }))}
      />

      {items.length === 0 ? (
        <EmptyState title="Nenhum exercício" description="Tente outro termo ou remova o filtro." />
      ) : (
        items.map((e) => (
          <Card key={e.id} style={{ gap: spacing.sm }}>
            <Row style={{ gap: spacing.md }}>
              <ExerciseImage id={e.id} size={56} />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="subtitle">{e.name}</AppText>
                <AppText variant="muted">
                  {e.muscle_group}
                  {e.equipment ? ` · ${e.equipment}` : ''}
                  {e.level ? ` · ${e.level}` : ''}
                </AppText>
              </View>
              <AppText
                variant="muted"
                onPress={() => setOpen(open === e.id ? null : e.id)}
                style={{ textDecorationLine: 'underline' }}
              >
                {open === e.id ? 'fechar' : 'instruções'}
              </AppText>
            </Row>
            {open === e.id && e.instructions ? (
              <AppText variant="muted">{e.instructions}</AppText>
            ) : null}
            {e.secondary_muscles ? (
              <AppText variant="muted">Secundários: {e.secondary_muscles}</AppText>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
