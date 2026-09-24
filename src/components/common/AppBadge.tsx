import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontWeights, borderRadius } from '../../theme';

interface AppBadgeProps {
  label: string;
  variant?: 'primary' | 'activity' | 'broadcast' | 'success' | 'warning' | 'danger' | 'department';
  style?: ViewStyle;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.textBase, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
  },
  textBase: {
    fontSize: 9,
    fontWeight: fontWeights.extrabold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Variants
  primary: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  text_primary: {
    color: colors.primary,
  },
  activity: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  text_activity: {
    color: '#d97706',
  },
  broadcast: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  text_broadcast: {
    color: '#7c3aed',
  },
  success: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  text_success: {
    color: '#059669',
  },
  warning: {
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  text_warning: {
    color: colors.warning,
  },
  danger: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  text_danger: {
    color: colors.danger,
  },
  department: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text_department: {
    color: colors.textSecondary,
    textTransform: 'none',
  },
});
