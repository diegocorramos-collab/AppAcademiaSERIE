import React from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exerciseImages } from '../assets/exercises';
import { colors, radius } from '../theme';

/**
 * Foto do exercício extraída do APK original (res/assets_exercises320_*.jpg).
 * Se o id não tiver imagem, mostra um placeholder com ícone.
 */
export function ExerciseImage({
  id,
  size = 56,
  rounded = radius.md,
}: {
  id: string;
  size?: number;
  rounded?: number;
}) {
  const source = exerciseImages[id];

  if (!source) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: rounded,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="barbell-outline" size={size * 0.42} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      resizeMode="cover"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: colors.surfaceAlt,
      }}
    />
  );
}
