# SÉRIE — app de treino e alimentação

Reconstrução do app **SÉRIE** (`com.diego.appacademia`), a partir do APK/AAB
recuperado do Expo. Expo SDK 58, React Native 0.88, Expo Router e SQLite local.

> **Estado:** base funcional. Telas principais operando com dados reais no
> SQLite. O design acompanha o app original (fundo `#0B0C0E`, destaque
> `#FF5A2A`, fontes Archivo + Inter), mas o polimento visual de cada tela ainda
> pode ser refinado comparando com o app instalado.

## Requisitos

- Node.js 20+ (recomendado 22 LTS)
- App Expo Go no celular, ou um development build
- (opcional) EAS CLI para gerar APK na nuvem

## Instalação

```bash
cd C:\Users\diego\Documents\AppAcademia
npm install
```

Se o `npm install` reclamar de versões de pacotes do Expo:

```bash
npx expo install --fix
```

## Rodar

```bash
npx expo start
```

Escaneie o QR com o Expo Go (Android) ou pressione `a` com um emulador aberto.

> O banco é criado e semeado no primeiro boot: **591 alimentos TACO**,
> **101 exercícios** e **6 programas** de 8 semanas.

## Gerar APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

O `app.json` já aponta para o projeto EAS original
(`1d1576fd-478e-4f34-8a40-a39619a01cc2`). Se preferir um projeto novo:

```bash
eas init --force
```

## Estrutura

```
app/
  _layout.tsx              fontes, SQLiteProvider, Stack
  (tabs)/
    _layout.tsx            guarda de onboarding + abas
    index.tsx              Hoje (kcal, macros, água, treino)
    treino.tsx             planos da semana
    alimentacao.tsx        refeições do dia
    progresso.tsx          peso, IMC, histórico
  onboarding.tsx           perfil + metas
  perfil.tsx               editar perfil e recalcular metas
  medida.tsx               nova medida corporal
  registrar.tsx            registrar séries/cargas do treino
  exercicios.tsx           biblioteca com busca e filtros
  programas.tsx            programas prontos
  programa/[id].tsx        detalhe + iniciar programa
  programa/dia/[id].tsx    treino do dia + usar como meu treino
  plano/[id].tsx           plano atual + iniciar treino
  alimentos.tsx            busca TACO + adicionar à refeição
  refeicao/[id].tsx        editar/excluir refeição
  alimento-personalizado.tsx
  backup.tsx               exportar/importar JSON
src/
  db/                      schema, migrações, seeds, tipos
  data/                    foods.json, exercises.json, programs.json
  components/ui.tsx        kit de UI (Screen, Card, Button, Field...)
  lib/                     datas, nutrição (TMB/TDEE/macros), formatação
  theme/                   cores, fontes, espaçamento
```

## Modelo de dados

22 tabelas, espelhando o app original (`schemaVersion` 10):

- **Perfil**: `user_profile`
- **Treino**: `exercises`, `workout_plans`, `workout_plan_exercises`,
  `workout_sessions`, `session_sets`, `programs`, `program_days`,
  `program_day_exercises`, `user_programs`, `program_sessions`
- **Alimentação**: `foods`, `food_portions`, `food_favorites`, `meals`,
  `meal_slots`
- **Progresso**: `body_metrics`, `progress_photos`, `water_logs`
- **Infra**: `app_meta`, `storage`

## Recalcular metas

`src/lib/nutrition.ts` implementa Mifflin-St Jeor (TMB), fator de atividade
(TDEE), ajuste por objetivo (−20% perder, +10% ganhar), proteína 2,2 g/kg
(cutting) ou 1,8 g/kg, gordura ≥ 0,8 g/kg, carbo no restante, fibra 14 g/1000
kcal e água 35 ml/kg.

## Pendências conhecidas

- Ícones, splash e fontes do APK original não foram recriados como assets
  (podem ser extraídos do AAB: `base/res/...`).
- Fotos de progresso (`expo-image-picker`) e leitor de código de barras
  (`expo-camera`) estão instalados como dependência, mas as telas ainda não
  usam esses recursos.
- Notificações de lembrete: canal `lembretes` configurado, sem agendamento.
- O backup exporta as tabelas de dados do usuário; as seeds são recriadas.

## Backup do projeto

Recomendado: criar um repositório no GitHub e subir o código.

```bash
git init
git add .
git commit -m "SÉRIE: reconstrução a partir do APK"
```

Isso evita repetir a perda: o código passa a viver fora do disco local.
