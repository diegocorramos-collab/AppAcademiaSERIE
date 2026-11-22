import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Card, EmptyState, Row, Screen } from '../src/components/ui';
import { colors, spacing } from '../src/theme';
import type { Program } from '../src/db/types';

export default function Programas() {
  const db = useSQLiteContext();
  const [programs, setPrograms] = useState<Program[]>([]);

  useFocusEffect(
    useCallback(() => {
      db.getAllAsync<Program>('SELECT * FROM programs ORDER BY sort_order').then(setPrograms);
    }, [db]),
  );

  return (
    <Screen>
      <AppText variant="muted">
        Programas prontos de 8 semanas. Ao iniciar, o app monta seus treinos da semana.
      </AppText>

      {programs.length === 0 ? (
        <EmptyState title="Nenhum programa" description="A base de programas ainda não foi semeada." />
      ) : (
        programs.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/programa/${p.id}`)}>
            <Row>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="heading">{p.name}</AppText>
                <AppText variant="muted">{p.description}</AppText>
              </View>
            </Row>
            <Row style={{ gap: spacing.sm }}>
              <Badge text={`${p.days_per_week}x/semana`} />
              <Badge text={`${p.weeks} semanas`} />
              <Badge text={p.level} />
              <Badge text={p.equipment} />
            </Row>
            <AppText variant="muted" style={{ color: colors.textDim }}>
              {p.focus_summary}
            </AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceAlt,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <AppText variant="muted" style={{ fontSize: 11 }}>{text}</AppText>
    </View>
  );
}
