export const colors = {
  bg: '#0B0C0E',
  surface: '#14161A',
  surfaceAlt: '#1B1E24',
  border: '#252A32',
  text: '#F5F6F7',
  textDim: '#9AA0A8',
  textMuted: '#6B7280',
  accent: '#FF5A2A',
  accentSoft: 'rgba(255, 90, 42, 0.14)',
  accentBorder: 'rgba(255, 90, 42, 0.35)',
  success: '#3DDC84',
  danger: '#FF4D4F',
  water: '#3FA9F5',
  protein: '#4DA3FF',
  carbs: '#FFC24D',
  fat: '#FF7A9A',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export const fonts = {
  heading: 'Archivo_800ExtraBold',
  headingBlack: 'Archivo_900Black',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
