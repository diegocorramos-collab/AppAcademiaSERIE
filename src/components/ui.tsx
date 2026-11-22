import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../theme';

/* ---------------------------------- texto --------------------------------- */

type TextVariant = 'title' | 'heading' | 'subtitle' | 'body' | 'muted' | 'label';

export function AppText({
  children,
  variant = 'body',
  style,
  color,
  numberOfLines,
  onPress,
}: {
  children?: React.ReactNode;
  variant?: TextVariant;
  style?: TextStyle;
  color?: string;
  numberOfLines?: number;
  onPress?: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      numberOfLines={numberOfLines}
      style={[textStyles[variant], color ? { color } : null, style]}
    >
      {children}
    </Text>
  );
}

const textStyles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 30, color: colors.text, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  subtitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 21 },
  muted: { fontFamily: fonts.body, fontSize: 13, color: colors.textDim, lineHeight: 18 },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

/* ---------------------------------- layout -------------------------------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}) {
  const content = (
    <View style={[padded && { padding: spacing.lg }, { gap: spacing.lg }, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Row({
  children,
  style,
  align = 'center',
  justify = 'space-between',
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
}) {
  return <View style={[{ flexDirection: 'row', alignItems: align, justifyContent: justify }, style]}>{children}</View>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Row style={{ marginTop: spacing.sm }}>
      <AppText variant="label">{children}</AppText>
      {right}
    </Row>
  );
}

/* ---------------------------------- botões -------------------------------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isPrimary && { backgroundColor: colors.accent },
        variant === 'ghost' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
        isDanger && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={isPrimary ? '#0B0C0E' : isDanger ? colors.danger : colors.text}
        />
      ) : null}
      <AppText
        variant="subtitle"
        style={{
          color: isPrimary ? '#0B0C0E' : isDanger ? colors.danger : colors.text,
          fontFamily: fonts.heading,
        }}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  size = 20,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ padding: spacing.xs }}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

/* ---------------------------------- inputs -------------------------------- */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  suffix,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'number-pad';
  suffix?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && { minHeight: 84, textAlignVertical: 'top' }]}
        />
        {suffix ? <AppText variant="muted">{suffix}</AppText> : null}
      </View>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}
          >
            <AppText variant="muted" color={active ? colors.accent : colors.textDim}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------------------------- dados --------------------------------- */

export function ProgressBar({
  value,
  color = colors.accent,
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <View style={{ height, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

export function Stat({
  label,
  value,
  color,
  align = 'flex-start',
}: {
  label: string;
  value: string;
  color?: string;
  align?: ViewStyle['alignItems'];
}) {
  return (
    <View style={{ gap: 2, alignItems: align }}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="heading" color={color}>
        {value}
      </AppText>
    </View>
  );
}

export function EmptyState({
  icon = 'barbell-outline',
  title,
  description,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <AppText variant="subtitle">{title}</AppText>
      {description ? (
        <AppText variant="muted" style={{ textAlign: 'center', maxWidth: 280 }}>
          {description}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function ListItem({
  icon,
  title,
  subtitle,
  right,
  onPress,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listItem,
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}
    >
      {icon ? (
        <View style={styles.listIcon}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subtitle">{title}</AppText>
        {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
      </View>
      {right}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
});
