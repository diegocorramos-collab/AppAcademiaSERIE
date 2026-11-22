import React, { useCallback, useState } from 'react';
import { Tabs, useFocusEffect, Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../src/theme';
import { Loading } from '../../src/components/ui';
import { USER_ID } from '../../src/db';

export default function TabsLayout() {
  const db = useSQLiteContext();
  const [state, setState] = useState<'loading' | 'onboarding' | 'ready'>('loading');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      db.getFirstAsync<{ onboarding_completed: number }>(
        'SELECT onboarding_completed FROM user_profile WHERE id = ?',
        [USER_ID],
      )
        .then((row) => {
          if (!alive) return;
          setState(row?.onboarding_completed === 1 ? 'ready' : 'onboarding');
        })
        .catch(() => alive && setState('onboarding'));
      return () => {
        alive = false;
      };
    }, [db]),
  );

  if (state === 'loading') return <Loading />;
  if (state === 'onboarding') return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: 22 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          headerTitle: 'SÉRIE',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color as string} />
        ),
        }}
      />
      <Tabs.Screen
        name="treino"
        options={{
          title: 'Treino',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="barbell-outline" size={size} color={color as string} />
        ),
        }}
      />
      <Tabs.Screen
        name="alimentacao"
        options={{
          title: 'Alimentação',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="restaurant-outline" size={size} color={color as string} />
        ),
        }}
      />
      <Tabs.Screen
        name="progresso"
        options={{
          title: 'Progresso',
          tabBarIcon: ({ color, size }) => (
          <Ionicons name="stats-chart-outline" size={size} color={color as string} />
        ),
        }}
      />
    </Tabs>
  );
}
