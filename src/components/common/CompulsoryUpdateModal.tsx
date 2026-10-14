import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { CURRENT_APP_VERSION } from '../../api/appUpdateApi';
import { DownloadIcon, ArrowRightIcon } from '../icons/SvgIcons';

interface CompulsoryUpdateModalProps {
  visible: boolean;
  latestVersion?: string;
  currentVersion?: string;
  onUpdate: () => void;
  onClose: () => void;
}

export const CompulsoryUpdateModal: React.FC<CompulsoryUpdateModalProps> = ({
  visible,
  latestVersion = 'latest',
  currentVersion = CURRENT_APP_VERSION,
  onUpdate,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Compulsory: Do not allow closing via hardware back button on Android
      }}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialogCard, shadows.lg]}>
          {/* Top Banner Accent */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <DownloadIcon size={32} color={colors.primary} />
            </View>
          </View>

          {/* Title & Compulsory Tag */}
          <View style={styles.badgeRow}>
            <View style={styles.compulsoryBadge}>
              <Text style={styles.compulsoryBadgeText}>MANDATORY UPDATE</Text>
            </View>
          </View>

          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            Update is compulsory. A new version ({latestVersion}) is available.
            Please update the application to continue.
          </Text>

          {/* Version Comparison Box */}
          <View style={styles.versionRow}>
            <View style={styles.versionBox}>
              <Text style={styles.versionLabel}>INSTALLED</Text>
              <Text style={styles.versionValue}>v{currentVersion}</Text>
            </View>

            <View style={styles.versionArrow}>
              <Text style={styles.versionArrowText}>➔</Text>
            </View>

            <View style={[styles.versionBox, styles.versionBoxLatest]}>
              <Text style={styles.versionLabelLatest}>LATEST</Text>
              <Text style={styles.versionValueLatest}>v{latestVersion}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Update Now Button */}
            <TouchableOpacity
              style={[styles.updateButton, shadows.md]}
              activeOpacity={0.88}
              onPress={onUpdate}
            >
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="modalUpdateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                    <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={24} fill="url(#modalUpdateGrad)" />
              </Svg>

              <View style={styles.btnInner}>
                <Text style={styles.updateButtonText}>Update Now</Text>
                <View style={styles.arrowCircle}>
                  <ArrowRightIcon size={14} color={colors.buttonPrimary} />
                </View>
              </View>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  badgeRow: {
    marginBottom: spacing.xs,
  },
  compulsoryBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  compulsoryBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionBox: {
    flex: 1,
    alignItems: 'center',
  },
  versionBoxLatest: {
    backgroundColor: '#FFF1F2',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  versionLabel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  versionLabelLatest: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  versionValue: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  versionValueLatest: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
  },
  versionArrow: {
    paddingHorizontal: spacing.md,
  },
  versionArrowText: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  actions: {
    width: '100%',
    gap: spacing.sm,
  },
  updateButton: {
    height: 48,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  closeButtonText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
});
