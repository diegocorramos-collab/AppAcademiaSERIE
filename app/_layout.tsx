import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Archivo_400Regular,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { initDatabase } from '../src/db';
import { colors, fonts } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    Archivo_400Regular,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    Inter_400Regular,
    Inter_500Medium,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="serie.db" onInit={initDatabase} useSuspense={false}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: fonts.heading, fontSize: 17 },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />
          <Stack.Screen name="medida" options={{ title: 'Nova medida' }} />
          <Stack.Screen name="registrar" options={{ title: 'Registrar treino' }} />
          <Stack.Screen name="exercicios" options={{ title: 'Exercícios' }} />
          <Stack.Screen name="programas" options={{ title: 'Programas' }} />
          <Stack.Screen name="programa/[id]" options={{ title: 'Programa' }} />
          <Stack.Screen name="programa/dia/[id]" options={{ title: 'Treino do dia' }} />
          <Stack.Screen name="plano/[id]" options={{ title: 'Treino' }} />
          <Stack.Screen name="alimentos" options={{ title: 'Alimentos' }} />
          <Stack.Screen name="refeicao/[id]" options={{ title: 'Refeição' }} />
          <Stack.Screen name="alimento-personalizado" options={{ title: 'Novo alimento' }} />
          <Stack.Screen name="backup" options={{ title: 'Backup' }} />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
