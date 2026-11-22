import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Constants from 'expo-constants';
import { AppText, Button, Card, Row, Screen } from '../src/components/ui';
import { USER_ID, nowIso } from '../src/db';
import { colors, spacing } from '../src/theme';

const TABLES = [
  'user_profile',
  'workout_sessions',
  'session_sets',
  'water_logs',
  'meals',
  'body_metrics',
  'meal_slots',
  'workout_plans',
  'workout_plan_exercises',
  'user_programs',
  'program_sessions',
  'progress_photos',
  'food_favorites',
];

const SCHEMA_VERSION = 1;

export default function Backup() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<{ value: string }>("SELECT value FROM app_meta WHERE key = 'last_backup_at'").then((r) =>
        setLast(r?.value ?? null),
      );
    }, [db]),
  );

  async function exportBackup() {
    setBusy(true);
    setMessage(null);
    try {
      const tables: Record<string, unknown[]> = {};
      for (const t of TABLES) {
        const where = t === 'user_profile' ? ' WHERE id = ?' : ' WHERE user_id = ?';
        tables[t] = await db.getAllAsync(`SELECT * FROM ${t}${where}`, [USER_ID]);
      }

      const foods = await db.getAllAsync("SELECT * FROM foods WHERE source = 'custom' AND deleted_at IS NULL");
      const foodPortions = await db.getAllAsync(
        'SELECT * FROM food_portions WHERE food_id IN (SELECT id FROM foods WHERE source = ?)',
        ['custom'],
      );

      const payload = {
        format: 'serie-backup',
        version: 1,
        schemaVersion: SCHEMA_VERSION,
        appVersion: Constants.expoConfig?.version ?? '1.0.0',
        exportedAt: new Date().toISOString(),
        stats: {
          workouts: (tables.workout_sessions ?? []).length,
          sets: (tables.session_sets ?? []).length,
          meals: (tables.meals ?? []).length,
          water: (tables.water_logs ?? []).length,
          metrics: (tables.body_metrics ?? []).length,
        },
        tables,
        foods,
        foodPortions,
      };

      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const fileName = `serie-backup-${stamp}.json`;
      const uri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Backup SÉRIE' });
      }

      await db.runAsync(
        "INSERT INTO app_meta (key, value) VALUES ('last_backup_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [new Date().toISOString()],
      );
      setLast(new Date().toISOString());
      setMessage(`Backup gerado: ${fileName}`);
    } catch (err) {
      setMessage(`Falha ao exportar: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function importBackup() {
    setBusy(true);
    setMessage(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.[0]) {
        setBusy(false);
        return;
      }
      const text = await FileSystem.readAsStringAsync(picked.assets[0].uri);
      const data = JSON.parse(text);
      if (data?.format !== 'serie-backup') throw new Error('Arquivo não é um backup do SÉRIE');

      let count = 0;
      await db.withTransactionAsync(async () => {
        for (const [table, rows] of Object.entries<unknown[]>(data.tables ?? {})) {
          if (!TABLES.includes(table) || !Array.isArray(rows)) continue;
          for (const row of rows) {
            if (!row || typeof row !== 'object') continue;
            const cols = Object.keys(row as Record<string, unknown>);
            if (cols.length === 0) continue;
            const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
            await db.runAsync(sql, cols.map((c) => (row as Record<string, unknown>)[c] as never));
            count++;
          }
        }

        for (const row of data.foods ?? []) {
          const cols = Object.keys(row);
          const sql = `INSERT OR REPLACE INTO foods (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`;
          await db.runAsync(sql, cols.map((c) => row[c]));
          count++;
        }
      });

      setMessage(`${count} registros importados.`);
    } catch (err) {
      setMessage(`Falha ao importar: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card>
        <AppText variant="heading">Seus dados são locais</AppText>
        <AppText variant="muted">
          O backup gera um arquivo JSON com perfil, treinos, refeições, medidas e alimentos personalizados.
        </AppText>
        <Row>
          <AppText variant="label">Último backup</AppText>
          <AppText variant="muted">
            {last ? new Date(last).toLocaleString('pt-BR') : 'nunca'}
          </AppText>
        </Row>
      </Card>

      <Button
        title={busy ? 'Aguarde...' : 'Exportar backup'}
        icon="share-outline"
        onPress={exportBackup}
        disabled={busy}
      />
      <Button
        title="Importar backup"
        variant="ghost"
        icon="download-outline"
        onPress={importBackup}
        disabled={busy}
      />

      {message ? (
        <Card style={{ borderColor: colors.border }}>
          <AppText variant="muted">{message}</AppText>
        </Card>
      ) : null}

      <View style={{ height: spacing.xl }} />
      <AppText variant="muted" style={{ color: colors.textMuted, textAlign: 'center' }}>
        Os alimentos da base TACO e os exercícios não vão no backup: eles são recriados automaticamente.
      </AppText>
    </Screen>
  );
}
