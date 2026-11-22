/**
 * Paleta extraída do bundle original do SÉRIE (1.0.0 / versionCode 5).
 * Cores hex e textos de UI recuperados por descompilação.
 */
export const colors = {
  // fundos
  bg: '#0B0C0E',
  bgAlt: '#0F1114',
  surface: '#14161A',
  surfaceAlt: '#1B1E23',
  surfaceHigh: '#202425',

  // linhas
  border: '#25292F',
  borderStrong: '#3A3D44',

  // texto (off-white quente, como no original)
  text: '#F2EFE6',
  textDim: '#A8A79F',
  textMuted: '#85877F',

  // destaque
  accent: '#FF5A2A',
  accentLight: '#FF7A54',
  accentDeep: '#6B2A18',
  accentBg: '#2A140D',
  accentSoft: 'rgba(255, 90, 42, 0.14)',
  accentBorder: 'rgba(255, 90, 42, 0.35)',

  // estados
  success: '#8BCB8B',
  successBg: '#16251A',
  danger: '#FF453A',

  // macros / água
  protein: '#52A9FF',
  carbs: '#F2C14E',
  fat: '#FF7A54',
  water: '#6BC5E8',
  waterDeep: '#2584E8',
  waterBg: '#0C2533',

  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(255,255,255,0.1)',
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

/** Textos de UI recuperados do bundle original (referência de copy). */
export const copy = {
  barcodeHint: 'Aponte para o código de barras',
  waterButton: 'Beber água',
  emptyDiary: 'Busque um alimento ou use o registro manual para começar.',
  emptyPlan: 'Adicione exercícios para montar a sua caderneta deste dia.',
  programNext: 'Ao concluir, o programa avança para o próximo treino.',
  seriesSaved: 'As séries foram registradas, mas este treino não é o atual do programa.',
  invalidLoad: 'Carga inválida. Use apenas números, por exemplo 40 ou 42,5.',
  tacoSource: 'Base TACO 4ª edição (NEPA/UNICAMP). Produtos escaneados: Open Food Facts (ODbL).',
  epley: '1RM estimado pela fórmula de Epley (carga × (1 + reps ÷ 30)).',
  metricsEmpty: 'Adicione peso e medidas para acompanhar sua evolução.',
  photosPermission: 'Autorize o acesso às fotos para registrar sua evolução.',
} as const;
