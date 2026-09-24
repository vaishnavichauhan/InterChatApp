import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { MessagesSquareIcon, UserIcon, ArrowRightIcon } from '../../components/icons/SvgIcons';
import { useAuthStore } from '../../store/authStore';

interface UserHomeScreenProps {
  navigation: any;
}

export const UserHomeScreen: React.FC<UserHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  return (
    <View style={styles.container}>
      <AppHeader
        showUserInfo
        onPressUser={() => navigation.navigate('ProfileTab')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <View style={styles.welcomeBanner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>Platform Status: Active</Text>
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user?.name || user?.username || 'Teammate'}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome to the InterChat collaboration suite. Access channels, media transfers, and profile details below.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionCard, shadows.sm]}
          onPress={() => navigation.navigate('ChatTab')}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIconWrap, { backgroundColor: '#e0efff' }]}>
            <MessagesSquareIcon size={24} color={colors.primary} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle}>Team Channels & Chat</Text>
            <Text style={styles.cardDesc}>
              Chat with coworkers, share photos and files, and participate in company broadcasts.
            </Text>
          </View>
          <ArrowRightIcon size={18} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, shadows.sm]}
          onPress={() => navigation.navigate('ProfileTab')}
          activeOpacity={0.7}
        >
          <View style={[styles.cardIconWrap, { backgroundColor: '#f0fdf4' }]}>
            <UserIcon size={24} color={colors.success} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle}>Your Profile & Security</Text>
            <Text style={styles.cardDesc}>
              View authorized device status, contact details, and role permissions.
            </Text>
          </View>
          <ArrowRightIcon size={18} color={colors.textLight} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: spacing.lg,
  },
  welcomeBanner: {
    backgroundColor: '#0040a1',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  bannerBadgeText: {
    fontSize: fontSizes.tiny,
    color: '#ffffff',
    fontWeight: fontWeights.bold,
  },
  welcomeTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.black,
    color: '#ffffff',
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: fontSizes.sm,
    color: '#e0efff',
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardMeta: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
