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
import {
  ArrowRightIcon,
  CheckIcon,
  MessagesSquareIcon,
} from '../../components/icons/SvgIcons';

interface WelcomeScreenProps {
  navigation: any;
}

// InterChat Interlinking Hero Icon matching the Frontend Web App
const InterChatHeroIcon: React.FC = () => (
  <View style={styles.heroIconWrapper}>
    {/* Ambient radial glow aura */}
    <View style={styles.iconAura} />

    {/* Squircle logo badge identical to frontend brand design */}
    <View style={styles.heroLogoTile}>
      <Svg
        width={46}
        height={46}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Left message bubble */}
        <Path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
        {/* Interlinked right message bubble */}
        <Path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
      </Svg>
    </View>
  </View>
);

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
              {/* Vibrant Blue/Indigo Gradient */}
              <LinearGradient id="upperBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#0284c7" />
                <Stop offset="42%" stopColor="#2563eb" />
                <Stop offset="100%" stopColor="#3730a3" />
              </LinearGradient>

              {/* Softer translucent secondary wave for visual depth */}
              <LinearGradient id="backWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
                <Stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
              </LinearGradient>
            </Defs>

            {/* Depth Wave Layer */}
            <Path d={backWavePath} fill="url(#backWaveGrad)" />

            {/* Main Foreground Wave Layer */}
            <Path d={mainWavePath} fill="url(#upperBgGrad)" />
          </Svg>

          {/* Upper Half Content: Information Our App */}
          <View style={[styles.upperContent, { paddingTop: topInset + 32 }]}>
            {/* Center: Official Interlocking Chat Hero Icon */}
            <InterChatHeroIcon />
            <Text style={styles.headerTitleText}>
              Inter<Text style={styles.headerTitleAccent}>Chat</Text>
            </Text>

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
                  <Stop offset="0%" stopColor="#4f46e5" />
                  <Stop offset="50%" stopColor="#2563eb" />
                  <Stop offset="100%" stopColor="#06b6d4" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" rx={28} fill="url(#btnGrad)" />
            </Svg>

            <View style={styles.buttonInnerContent}>
              <Text style={styles.continueButtonText}>Continue Sign in</Text>
              <View style={styles.arrowCircle}>
                <ArrowRightIcon size={16} color="#2563eb" />
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: 8,
  },
  brandIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 27,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerTitleAccent: {
    color: '#93c5fd',
  },

  /* Hero Interlink Icon */
  heroIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  iconAura: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroLogoTile: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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


