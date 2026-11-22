import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Field, Loading, Row, Screen } from '../../src/components/ui';
import { USER_ID, nowIso } from '../../src/db';
import type { Food, Meal } from '../../src/db/types';
import { num, parseNumber } from '../../src/lib/format';
import { spacing } from '../../src/theme';

export default function RefeicaoDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState('');
  const [name, setName] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const m = await db.getFirstAsync<Meal>('SELECT * FROM meals WHERE id = ?', [id]);
        setMeal(m ?? null);
        setName(m?.name ?? '');
        setGrams(m?.grams ? String(m.grams) : '');
        if (m?.food_id) {
          const f = await db.getFirstAsync<Food>('SELECT * FROM foods WHERE id = ?', [m.food_id]);
          setFood(f ?? null);
        }
      })();
    }, [db, id]),
  );

  async function save() {
    if (!meal) return;
    const g = parseNumber(grams);
    const ts = nowIso();

    if (food && g) {
      const factor = g / 100;
      await db.runAsync(
        `UPDATE meals SET name=?, grams=?, portion_label=?, kcal=?, protein_g=?, carbs_g=?, fat_g=?, fiber_g=?, updated_at=?
         WHERE id=? AND user_id=?`,
        [
          name, g, `${g} g`,
          food.kcal_100g * factor, food.protein_100g * factor, food.carbs_100g * factor,
          food.fat_100g * factor, food.fiber_100g * factor, ts, id, USER_ID,
        ],
      );
    } else {
      await db.runAsync('UPDATE meals SET name=?, grams=?, updated_at=? WHERE id=? AND user_id=?', [
        name, g, ts, id, USER_ID,
      ]);
    }
    router.back();
  }

  async function remove() {
    await db.runAsync('DELETE FROM meals WHERE id = ? AND user_id = ?', [id, USER_ID]);
    router.back();
  }

  if (!meal) return <Loading />;

  return (
    <Screen>
      <Card>
        <Field label="Nome" value={name} onChangeText={setName} />
        {food ? (
          <Field label="Quantidade" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" suffix="g" />
        ) : null}
        <Row>
          <AppText variant="label">Macros atuais</AppText>
        </Row>
        <Row>
          <AppText variant="muted">{Math.round(num(meal.kcal))} kcal</AppText>
          <AppText variant="muted">P {Math.round(meal.protein_g)} g</AppText>
          <AppText variant="muted">C {Math.round(meal.carbs_g)} g</AppText>
          <AppText variant="muted">G {Math.round(meal.fat_g)} g</AppText>
        </Row>
        <AppText variant="muted" style={{ color: '#6B7280' }}>
          {meal.source === 'taco' ? 'Base TACO' : meal.source === 'custom' ? 'Alimento personalizado' : 'Manual'}
        </AppText>
      </Card>

      <Button title="Salvar" icon="checkmark" onPress={save} />
      <Button title="Excluir refeição" variant="danger" icon="trash-outline" onPress={remove} />
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}
