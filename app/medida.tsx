import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Field, Row, Screen } from '../src/components/ui';
import { USER_ID, nowIso, uid } from '../src/db';
import { todayKey } from '../src/lib/date';
import { parseNumber } from '../src/lib/format';
import { spacing } from '../src/theme';

export default function Medida() {
  const db = useSQLiteContext();
  const [weight, setWeight] = useState('');
  const [fat, setFat] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const ts = nowIso();
    const day = todayKey();
    await db.runAsync(
      `INSERT INTO body_metrics
        (id, user_id, day, weight_kg, body_fat_pct, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uid(), USER_ID, day,
        parseNumber(weight), parseNumber(fat), parseNumber(waist), parseNumber(hip),
        parseNumber(chest), parseNumber(arm), parseNumber(thigh), notes || null, ts, ts,
      ],
    );

    const w = parseNumber(weight);
    if (w) {
      await db.runAsync('UPDATE user_profile SET weight_kg = ?, updated_at = ? WHERE id = ?', [w, ts, USER_ID]);
    }
    router.back();
  }

  return (
    <Screen>
      <Card>
        <Field label="Peso" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" placeholder="Obrigatório" />
        <Field label="Gordura corporal" value={fat} onChangeText={setFat} keyboardType="decimal-pad" suffix="%" />
      </Card>

      <Card>
        <AppText variant="label">Circunferências</AppText>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Cintura" value={waist} onChangeText={setWaist} keyboardType="decimal-pad" suffix="cm" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Quadril" value={hip} onChangeText={setHip} keyboardType="decimal-pad" suffix="cm" />
          </View>
        </Row>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Tórax" value={chest} onChangeText={setChest} keyboardType="decimal-pad" suffix="cm" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Braço" value={arm} onChangeText={setArm} keyboardType="decimal-pad" suffix="cm" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Coxa" value={thigh} onChangeText={setThigh} keyboardType="decimal-pad" suffix="cm" />
          </View>
        </Row>
      </Card>

      <Card>
        <Field label="Observações" value={notes} onChangeText={setNotes} multiline placeholder="Como você está se sentindo?" />
      </Card>

      <Button title={saving ? 'Salvando...' : 'Salvar medida'} onPress={save} disabled={saving} icon="checkmark" />
    </Screen>
  );
}
