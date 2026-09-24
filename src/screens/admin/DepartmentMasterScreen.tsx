import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { AppButton } from '../../components/common/AppButton';
import { AppBadge } from '../../components/common/AppBadge';
import { BuildingIcon, PlusIcon, XMarkIcon } from '../../components/icons/SvgIcons';
import { getDepartments, createDepartment } from '../../api/departmentApi';

interface DepartmentMasterScreenProps {
  navigation: any;
}

export const DepartmentMasterScreen: React.FC<DepartmentMasterScreenProps> = ({
  navigation,
}) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const res = await getDepartments(true);
      const list = res?.departments || res?.data || (Array.isArray(res) ? res : []);
      setDepartments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load departments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleCreateDepartment = async () => {
    if (!deptName.trim()) {
      Alert.alert('Required', 'Please enter a department name.');
      return;
    }

    try {
      setCreating(true);
      await createDepartment({
        department_name: deptName.trim(),
        description: deptDesc.trim(),
      });
      setIsModalOpen(false);
      setDeptName('');
      setDeptDesc('');
      fetchDepts();
      Alert.alert('Success', `Department "${deptName}" created successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Department Master"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.7}
          >
            <PlusIcon size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchDepts} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.cardIcon}>
                <BuildingIcon size={22} color={colors.primary} />
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.department_name}</Text>
                  <AppBadge
                    label={item.status || 'ACTIVE'}
                    variant={item.status === 'ACTIVE' ? 'success' : 'warning'}
                  />
                </View>

                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <Text style={styles.memberCount}>
                  👥 {item.member_count || 0} Team Members Assigned
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No departments configured.</Text>
            </View>
          }
          contentContainerStyle={{ paddingVertical: spacing.md }}
        />
      )}

      {/* Create Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Department</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Department Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sales, Marketing, IT"
              placeholderTextColor={colors.textLight}
              value={deptName}
              onChangeText={setDeptName}
            />

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Describe department roles and duties..."
              placeholderTextColor={colors.textLight}
              value={deptDesc}
              onChangeText={setDeptDesc}
              multiline
            />

            <View style={styles.modalActions}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => setIsModalOpen(false)}
                style={{ flex: 1 }}
              />
              <AppButton
                title="Create"
                onPress={handleCreateDepartment}
                loading={creating}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    gap: 3,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: '#ffffff',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardMeta: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  cardDesc: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  memberCount: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    height: 44,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
