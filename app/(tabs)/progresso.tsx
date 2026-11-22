import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Divider, EmptyState, Row, Screen, SectionTitle, Stat } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';
import { USER_ID } from '../../src/db';
import type { BodyMetric, Profile } from '../../src/db/types';
import { formatShort } from '../../src/lib/date';
import { kg, num } from '../../src/lib/format';
import { bmi } from '../../src/lib/nutrition';

export default function ProgressoScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);

  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<Profile>('SELECT * FROM user_profile WHERE id = ?', [USER_ID]).then((p) =>
        setProfile(p ?? null),
      );
      db.getAllAsync<BodyMetric>(
        'SELECT * FROM body_metrics WHERE user_id = ? ORDER BY day DESC, created_at DESC LIMIT 60',
        [USER_ID],
      ).then(setMetrics);
    }, [db]),
  );

  const current = metrics[0];
  const first = metrics[metrics.length - 1];
  const delta = current?.weight_kg && first?.weight_kg ? current.weight_kg - first.weight_kg : 0;
  const imc = bmi(profile?.weight_kg, profile?.height_cm);

  return (
    <Screen>
      <Row>
        <View style={{ gap: 2 }}>
          <AppText variant="label">Evolução</AppText>
          <AppText variant="title">{kg(current?.weight_kg ?? profile?.weight_kg)} kg</AppText>
        </View>
        <Button title="Nova medida" variant="ghost" icon="add" onPress={() => router.push('/medida')} />
      </Row>

      <Card>
        <Row>
          <Stat label="IMC" value={imc ? String(imc) : '—'} />
          <Stat label="TDEE" value={`${num(profile?.tdee)} kcal`} align="center" />
          <Stat label="Variação" value={`${delta > 0 ? '+' : ''}${kg(delta)} kg`} align="flex-end" color={delta <= 0 ? colors.success : colors.text} />
        </Row>
      </Card>

      <SectionTitle right={<AppText variant="muted">{metrics.length} registros</AppText>}>
        Histórico
      </SectionTitle>

      {metrics.length === 0 ? (
        <Card>
          <EmptyState
            icon="scale-outline"
            title="Nenhuma medida ainda"
            description="Registre peso e circunferências para acompanhar sua evolução."
            action={<Button title="Registrar medida" onPress={() => router.push('/medida')} />}
          />
        </Card>
      ) : (
        <Card style={{ gap: 0, paddingVertical: 0 }}>
          {metrics.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Divider /> : null}
              <Row style={{ paddingVertical: spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="subtitle">{formatShort(m.day)}</AppText>
                  <AppText variant="muted">
                    {[
                      m.waist_cm ? `cintura ${kg(m.waist_cm, 0)} cm` : null,
                      m.body_fat_pct ? `gordura ${kg(m.body_fat_pct)}%` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'somente peso'}
                  </AppText>
                </View>
                <AppText variant="heading">{kg(m.weight_kg)} kg</AppText>
              </Row>
            </View>
          ))}
        </Card>
      )}

      <SectionTitle>Ajustes</SectionTitle>
      <Card style={{ gap: spacing.sm }}>
        <Button title="Editar perfil e metas" variant="ghost" icon="person-outline" onPress={() => router.push('/perfil')} />
        <Button title="Backup e restauração" variant="ghost" icon="cloud-upload-outline" onPress={() => router.push('/backup')} />
      </Card>
    </Screen>
  );
}
