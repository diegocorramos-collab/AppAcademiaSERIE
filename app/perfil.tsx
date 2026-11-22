import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText, Button, Card, Field, Row, Screen, Segmented } from '../src/components/ui';
import { USER_ID, nowIso } from '../src/db';
import type { Profile } from '../src/db/types';
import { computeBmr, computeTargets, computeTdee } from '../src/lib/nutrition';
import { parseNumber } from '../src/lib/format';
import { spacing } from '../src/theme';

export default function Perfil() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [sex, setSex] = useState<'masculino' | 'feminino'>('masculino');
  const [activity, setActivity] = useState('moderado');
  const [goal, setGoal] = useState('perder');
  const [modality, setModality] = useState('musculacao');
  const [trainingDays, setTrainingDays] = useState('3');
  const [mealsPerDay, setMealsPerDay] = useState('5');
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<Profile>('SELECT * FROM user_profile WHERE id = ?', [USER_ID]).then((p) => {
        if (!p) return;
        setProfile(p);
        setName(p.name ?? '');
        setWeight(p.weight_kg ? String(p.weight_kg) : '');
        setHeight(p.height_cm ? String(p.height_cm) : '');
        setBirthYear(p.birth_year ? String(p.birth_year) : '');
        setSex((p.sex as 'masculino' | 'feminino') ?? 'masculino');
        setActivity(p.activity_level ?? 'moderado');
        setGoal(p.goal ?? 'perder');
        setModality(p.modality ?? 'musculacao');
        setTrainingDays(String(p.training_days ?? 3));
        setMealsPerDay(String(p.meals_per_day ?? 5));
      });
    }, [db]),
  );

  async function save() {
    const weightKg = parseNumber(weight) ?? profile?.weight_kg ?? 70;
    const heightCm = parseNumber(height) ?? profile?.height_cm ?? 170;
    const year = parseNumber(birthYear) ?? profile?.birth_year ?? 1990;
    const bmr = computeBmr({ sex, weightKg, heightCm, birthYear: year });
    const tdee = computeTdee(bmr, activity);
    const t = computeTargets({ sex, weightKg, heightCm, birthYear: year, activityLevel: activity, goal });
    const ts = nowIso();

    await db.runAsync(
      `UPDATE user_profile SET name=?, sex=?, birth_year=?, height_cm=?, weight_kg=?,
         activity_level=?, goal=?, modality=?, training_days=?, meals_per_day=?,
         bmr=?, tdee=?, fiber_goal_g=?, daily_kcal_goal=?, daily_protein_goal_g=?,
         daily_carbs_goal_g=?, daily_fat_goal_g=?, daily_water_goal_ml=?, updated_at=?
       WHERE id=?`,
      [
        name, sex, year, heightCm, weightKg, activity, goal, modality,
        Number(trainingDays), Number(mealsPerDay), bmr, tdee, t.fiber, t.kcal, t.protein,
        t.carbs, t.fat, t.water, ts, USER_ID,
      ],
    );
    setSaved(true);
  }

  return (
    <Screen>
      <Card>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Peso" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Altura" value={height} onChangeText={setHeight} keyboardType="decimal-pad" suffix="cm" />
          </View>
        </Row>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Nascimento" value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Treinos/semana" value={trainingDays} onChangeText={setTrainingDays} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Refeições" value={mealsPerDay} onChangeText={setMealsPerDay} keyboardType="number-pad" />
          </View>
        </Row>
      </Card>

      <Card>
        <AppText variant="label">Sexo</AppText>
        <Segmented
          value={sex}
          onChange={setSex}
          options={[
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino', label: 'Feminino' },
          ]}
        />
        <AppText variant="label">Atividade</AppText>
        <Segmented
          value={activity}
          onChange={setActivity}
          options={[
            { value: 'sedentario', label: 'Sedentário' },
            { value: 'leve', label: 'Leve' },
            { value: 'moderado', label: 'Moderado' },
            { value: 'intenso', label: 'Intenso' },
          ]}
        />
        <AppText variant="label">Objetivo</AppText>
        <Segmented
          value={goal}
          onChange={setGoal}
          options={[
            { value: 'perder', label: 'Perder' },
            { value: 'manter', label: 'Manter' },
            { value: 'ganhar', label: 'Ganhar' },
          ]}
        />
      </Card>

      {profile ? (
        <Card>
          <Row>
            <View>
              <AppText variant="label">TMB</AppText>
              <AppText variant="heading">{profile.bmr ?? '—'} kcal</AppText>
            </View>
            <View style={{ alignItems: 'center' }}>
              <AppText variant="label">Gasto</AppText>
              <AppText variant="heading">{profile.tdee ?? '—'} kcal</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="label">Meta</AppText>
              <AppText variant="heading">{profile.daily_kcal_goal ?? '—'} kcal</AppText>
            </View>
          </Row>
        </Card>
      ) : null}

      <Button title={saved ? 'Salvo!' : 'Salvar alterações'} onPress={save} icon="checkmark" />
      <Button title="Backup e restauração" variant="ghost" icon="cloud-upload-outline" onPress={() => router.push('/backup')} />
    </Screen>
  );
}
