import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Field, Row, Screen } from '../src/components/ui';
import { USER_ID, nowIso, uid } from '../src/db';
import { parseNumber } from '../src/lib/format';
import { spacing } from '../src/theme';

export default function AlimentoPersonalizado() {
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    const ts = nowIso();
    await db.runAsync(
      `INSERT INTO foods
        (id, name, search, category, kcal_100g, protein_100g, carbs_100g, fat_100g, fiber_100g, sodium_mg_100g,
         popularity, source, barcode, user_id, created_at, updated_at)
       VALUES (?, ?, ?, 'Meus alimentos', ?, ?, ?, ?, ?, ?, 0, 'custom', NULL, ?, ?, ?)`,
      [
        `custom-${uid()}`, name.trim(), name.trim().toLowerCase(),
        parseNumber(kcal) ?? 0, parseNumber(protein) ?? 0, parseNumber(carbs) ?? 0,
        parseNumber(fat) ?? 0, parseNumber(fiber) ?? 0, parseNumber(sodium) ?? 0,
        USER_ID, ts, ts,
      ],
    );
    setSaving(false);
    router.back();
  }

  return (
    <Screen>
      <Card>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Panqueca de aveia" />
        <AppText variant="muted">Valores por 100 g</AppText>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Calorias" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" suffix="kcal" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Proteína" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" suffix="g" />
          </View>
        </Row>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Carboidrato" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" suffix="g" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Gordura" value={fat} onChangeText={setFat} keyboardType="decimal-pad" suffix="g" />
          </View>
        </Row>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Fibra" value={fiber} onChangeText={setFiber} keyboardType="decimal-pad" suffix="g" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Sódio" value={sodium} onChangeText={setSodium} keyboardType="decimal-pad" suffix="mg" />
          </View>
        </Row>
      </Card>

      <Button title={saving ? 'Salvando...' : 'Salvar alimento'} onPress={save} disabled={saving} icon="checkmark" />
    </Screen>
  );
}
