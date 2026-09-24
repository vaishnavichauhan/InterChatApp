import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import { AppAvatar } from '../../components/common/AppAvatar';
import { AppBadge } from '../../components/common/AppBadge';
import { getAllUsers, getPendingDevices, approveDevice, toggleUserActive } from '../../api/adminApi';

interface UserMasterScreenProps {
  navigation: any;
}

export const UserMasterScreen: React.FC<UserMasterScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'devices'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [pendingDevices, setPendingDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, devicesRes] = await Promise.all([
        getAllUsers(true).catch(() => ({ data: { users: [] } })),
        getPendingDevices().catch(() => ({ data: { devices: [] } })),
      ]);

      setUsers(usersRes.data?.users || []);
      setPendingDevices(devicesRes.data?.devices || []);
    } catch (err) {
      console.warn('Failed to load user master data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (userId: number, currentStatus: boolean | number) => {
    const nextStatus = !currentStatus;
    try {
      await toggleUserActive(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: nextStatus } : u))
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleApproveDevice = async (device: any) => {
    Alert.alert(
      'Approve Device',
      `Authorize device for ${device.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve with Download',
          onPress: async () => {
            try {
              await approveDevice(device.id, true);
              Alert.alert('Approved', `Device authorized with download enabled.`);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Approval failed.');
            }
          },
        },
        {
          text: 'Approve (View Only)',
          onPress: async () => {
            try {
              await approveDevice(device.id, false);
              Alert.alert('Approved', `Device authorized with view-only permissions.`);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Approval failed.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="User & Device Master"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Team Users ({users.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'devices' && styles.tabActive]}
          onPress={() => setActiveTab('devices')}
        >
          <Text style={[styles.tabText, activeTab === 'devices' && styles.tabTextActive]}>
            Pending Devices ({pendingDevices.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : activeTab === 'users' ? (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.userCard, shadows.sm]}>
              <AppAvatar name={item.name || item.username} size={42} />

              <View style={styles.userMeta}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>{item.name || item.username}</Text>
                  <AppBadge
                    label={item.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                    variant={item.role === 'admin' ? 'broadcast' : 'primary'}
                  />
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.user_type_name && (
                  <Text style={styles.userRoleText}>Role Profile: {item.user_type_name}</Text>
                )}
              </View>

              <View style={styles.switchWrapper}>
                <Text style={styles.activeLabel}>
                  {item.active ? 'Active' : 'Disabled'}
                </Text>
                <Switch
                  value={Boolean(item.active)}
                  onValueChange={() => handleToggleActive(item.id, item.active)}
                  trackColor={{ false: colors.border, true: colors.success }}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={pendingDevices}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.deviceCard, shadows.sm]}>
              <View style={styles.deviceMeta}>
                <View style={styles.deviceUserRow}>
                  <Text style={styles.deviceUsername}>{item.username || item.name}</Text>
                  <AppBadge label="PENDING APPROVAL" variant="warning" />
                </View>
                <Text style={styles.deviceSignature} numberOfLines={1}>
                  ID: {item.device_id}
                </Text>
                <Text style={styles.deviceDate}>
                  Requested: {new Date(item.created_at || Date.now()).toLocaleDateString()}
                </Text>
              </View>

              <AppButton
                title="Authorize"
                onPress={() => handleApproveDevice(item)}
                size="sm"
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending device requests.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSubtle,
  },
  tabActive: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  tabText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  userName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: fontSizes.tiny,
    color: colors.textMuted,
  },
  userRoleText: {
    fontSize: 9,
    color: colors.primary,
    marginTop: 2,
    fontWeight: fontWeights.semibold,
  },
  switchWrapper: {
    alignItems: 'center',
  },
  activeLabel: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 2,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceMeta: {
    flex: 1,
    marginRight: spacing.md,
  },
  deviceUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 3,
  },
  deviceUsername: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  deviceSignature: {
    fontSize: fontSizes.tiny,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  deviceDate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
});
