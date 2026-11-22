import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, EmptyState, Field, Row, Screen } from '../src/components/ui';
import { colors, spacing } from '../src/theme';
import { USER_ID, nowIso, uid } from '../src/db';
import type { Food } from '../src/db/types';
import { todayKey } from '../src/lib/date';
import { num, parseNumber } from '../src/lib/format';

export default function Alimentos() {
  const { slot, day } = useLocalSearchParams<{ slot?: string; day?: string }>();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');

  const search = useCallback(async () => {
    const term = query.trim().toLowerCase();
    const rows = await db.getAllAsync<Food>(
      term
        ? `SELECT * FROM foods WHERE deleted_at IS NULL AND (search LIKE ? OR name LIKE ?)
           ORDER BY popularity DESC, name LIMIT 40`
        : `SELECT * FROM foods WHERE deleted_at IS NULL ORDER BY name LIMIT 40`,
      term ? [`%${term}%`, `%${term}%`] : [],
    );
    setFoods(rows);
  }, [db, query]);

  useEffect(() => {
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [search]);

  async function add() {
    if (!selected) return;
    const g = parseNumber(grams) ?? 100;
    const factor = g / 100;
    const ts = nowIso();
    const targetDay = day ?? todayKey();

    await db.runAsync(
      `INSERT INTO meals
        (id, user_id, day, name, kcal, protein_g, carbs_g, fat_g, fiber_g, food_id, grams, portion_label, slot_id, source, logged_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'taco', ?, ?, ?)`,
      [
        uid(), USER_ID, targetDay, selected.name,
        selected.kcal_100g * factor, selected.protein_100g * factor,
        selected.carbs_100g * factor, selected.fat_100g * factor,
        selected.fiber_100g * factor, selected.id, g, `${g} g`, slot ?? null,
        ts, ts, ts,
      ],
    );

    if (slot) {
      await db.runAsync('UPDATE meal_slots SET completed_at = NULL WHERE id = ?', [slot]);
    }
    router.back();
  }

  return (
    <Screen>
      <Field label="Buscar alimento" value={query} onChangeText={setQuery} placeholder="arroz, frango, banana..." />

      {selected ? (
        <Card>
          <View style={{ gap: 2 }}>
            <AppText variant="heading">{selected.name}</AppText>
            <AppText variant="muted">{selected.category} · TACO</AppText>
          </View>
          <Field label="Quantidade" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" suffix="g" />
          <Row>
            <AppText variant="muted">
              {Math.round(selected.kcal_100g * (parseNumber(grams) ?? 100) / 100)} kcal
            </AppText>
            <AppText variant="muted">
              P {num((selected.protein_100g * (parseNumber(grams) ?? 100)) / 100).toFixed(1)} g
            </AppText>
            <AppText variant="muted">
              C {num((selected.carbs_100g * (parseNumber(grams) ?? 100)) / 100).toFixed(1)} g
            </AppText>
            <AppText variant="muted">
              G {num((selected.fat_100g * (parseNumber(grams) ?? 100)) / 100).toFixed(1)} g
            </AppText>
          </Row>
          <Row style={{ gap: spacing.sm }}>
            <Button title="Cancelar" variant="ghost" style={{ flex: 1 }} onPress={() => setSelected(null)} />
            <Button title="Adicionar" icon="add" style={{ flex: 1 }} onPress={add} />
          </Row>
        </Card>
      ) : null}

      {foods.length === 0 ? (
        <EmptyState title="Nada encontrado" description="Tente outro termo ou crie um alimento personalizado." />
      ) : (
        foods.map((f) => (
          <Card key={f.id} onPress={() => setSelected(f)}>
            <Row>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="subtitle">{f.name}</AppText>
                <AppText variant="muted">
                  {f.category} · P {Math.round(f.protein_100g)} C {Math.round(f.carbs_100g)} G {Math.round(f.fat_100g)}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="subtitle">{Math.round(f.kcal_100g)}</AppText>
                <AppText variant="muted" style={{ color: colors.textMuted }}>kcal/100g</AppText>
              </View>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
