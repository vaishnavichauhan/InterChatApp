import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { ArrowRightIcon, CheckIcon } from '../../components/icons/SvgIcons';
import { EpoxyHouseBrandLogo } from '../../components/common/EpoxyHouseBrandLogo';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const topInset = Math.max(insets.top, androidStatusHeight);

  // Increased height of upper curved section (~63% of screen height)
  const upperSectionHeight = Math.max(490, Math.round(height * 0.63));

  // Organic S-curve Bezier wave coordinates matching the reference design
  const curveLeftY = upperSectionHeight - 44;
  const curveRightY = upperSectionHeight - 84;
  const mainWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY} C ${width * 0.70} ${curveRightY - 24}, ${width * 0.35} ${upperSectionHeight + 12}, 0 ${curveLeftY} Z`;
  const backWavePath = `M 0 0 L ${width} 0 L ${width} ${curveRightY + 28} C ${width * 0.68} ${curveRightY + 8}, ${width * 0.32} ${upperSectionHeight + 32}, 0 ${curveLeftY + 18} Z`;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    return () => {
      StatusBar.setBarStyle('dark-content');
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ================= UPPER HALF: INFORMATION + ORGANIC CURVE ================= */}
        <View style={[styles.upperContainer, { height: upperSectionHeight }]}>
          {/* SVG Gradient Background with Organic Curve */}
          <Svg
            width={width}
            height={upperSectionHeight + 30}
            viewBox={`0 0 ${width} ${upperSectionHeight + 30}`}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              {/* Soft, pleasant light red gradient */}
              <LinearGradient id="upperBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={colors.heroGradientStart} />
                <Stop offset="50%" stopColor={colors.heroGradientMid} />
                <Stop offset="100%" stopColor={colors.heroGradientEnd} />
              </LinearGradient>

              {/* Softer translucent secondary wave for visual depth */}
              <LinearGradient id="backWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
                <Stop offset="100%" stopColor="rgba(255, 120, 126, 0.22)" />
              </LinearGradient>
            </Defs>

            {/* Depth Wave Layer */}
            <Path d={backWavePath} fill="url(#backWaveGrad)" />

            {/* Main Foreground Wave Layer */}
            <Path d={mainWavePath} fill="url(#upperBgGrad)" />
          </Svg>

          {/* Upper Half Content: Information Our App */}
          <View style={[styles.upperContent, { paddingTop: topInset + 36 }]}>
            {/* Center: Official Epoxy House + InterChat Brand Logo */}
            <View style={styles.heroLogoContainer}>
              <EpoxyHouseBrandLogo size="lg" variant="light" />
            </View>

            {/* App Information Section */}
            <View style={styles.infoSection}>
              <Text style={styles.appMainHeading}>Fast, Secure & Hardware-Locked</Text>
              <Text style={styles.appSubHeading}>
                Connect with your enterprise team through authorized devices, instant channels, and audited media vault.
              </Text>

              {/* App Feature Highlights */}
              <View style={styles.featuresRow}>
                <View style={styles.featureBadge}>
                  <CheckIcon size={14} color="#34d399" />
                  <Text style={styles.featureBadgeText}>Device Verified</Text>
                </View>
                <View style={styles.featureBadge}>
                  <CheckIcon size={14} color="#34d399" />
                  <Text style={styles.featureBadgeText}>Real-Time Sync</Text>
                </View>
                <View style={styles.featureBadge}>
                  <CheckIcon size={14} color="#34d399" />
                  <Text style={styles.featureBadgeText}>Audited Vault</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ================= LOWER HALF: AFTER HALF CURVE (CONTINUE SIGN IN) ================= */}
        <View style={[styles.lowerContainer, { paddingBottom: Math.max(insets.bottom, 28) }]}>
          {/* Welcome Action Header */}
          <View style={styles.welcomeActionHeader}>
            <Text style={styles.welcomeActionTitle}>Welcome to Workspace</Text>
            <Text style={styles.welcomeActionSubtitle}>
              Sign in with your enterprise credentials to access your channels and conversations.
            </Text>
          </View>

          {/* Continue Sign In Button */}
          <TouchableOpacity
            style={[styles.continueButton, shadows.lg]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.88}
          >
            {/* SVG Gradient inside the pill button */}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={colors.buttonGradientStart} />
                  <Stop offset="100%" stopColor={colors.buttonGradientEnd} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={28} fill="url(#btnGrad)" />
            </Svg>

            <View style={styles.buttonInnerContent}>
              <Text style={styles.continueButtonText}>Continue Sign in</Text>
              <View style={styles.arrowCircle}>
                <ArrowRightIcon size={16} color={colors.buttonPrimary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  /* ---------- Upper Half ---------- */
  upperContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  upperContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heroLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  /* Information Section */
  infoSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  appMainHeading: {
    fontSize: 21,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 27,
    marginBottom: 8,
  },
  appSubHeading: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.lg,
    maxWidth: 340,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  featureBadgeText: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },

  /* ---------- Lower Half (After Half Curve) ---------- */
  lowerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  welcomeActionHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  welcomeActionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.black,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  welcomeActionSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Continue Sign In Button */
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


